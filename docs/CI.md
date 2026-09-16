# Fließband

Meilenstein `M0-CI`. Der Workflow liegt in `.github/workflows/ci.yml`.

## Was läuft

Zwei Jobs, beide bei jedem Push und bei jedem Pull Request.

**`verify`** führt `npm ci`, `npm run build`, `npm run lint` und `npm test` aus. Der Job blockiert.
Rot bedeutet rot, es gibt kein `continue-on-error`.

**`audit`** ruft `scripts/audit-report.mjs` auf und blockiert nicht. Das Skript liest
`npm audit --json` und teilt die Funde nach ihrer Herkunft, statt eine Gesamtzahl zu nennen, die
niemand zuordnen kann.

## Warum Node 20

Die Wahl ist abgeleitet, nicht gegriffen:

1. `package.json` hat kein `engines`-Feld. Das übernommene Sample
   `component-framework/FluentThemingAPIControl` hat ebenfalls keines, die Angabe ist dort also
   nicht zu holen.
2. Die nächste belastbare Quelle ist die Werkzeugkette selbst. `pcf-scripts@1.51.1` und
   `pcf-start@1.51.1` deklarieren beide `engines.node >= 20`. Das ist die bindende Untergrenze.
3. Die übrigen Anforderungen sind weiter: `eslint@9` verlangt `^18.18.0 || ^20.9.0 || >=21.1.0`,
   `vitest@2` verlangt `^18.0.0 || >=20.0.0`, `typescript@4.9.5` verlangt `>=4.2.0`.

Der Schnitt ist damit **Node 20.9.0**, nicht Node 20. `eslint@9`, `eslint-plugin-promise` und
`typescript-eslint` verlangen `^20.9.0`; ein Node 20.0 bis 20.8 trüge die Werkzeugkette nicht. Die
erste Fassung dieser Ableitung stand auf `>=20` und war damit zu weit.

Gebaut wird auf der Untergrenze, weil das den versehentlichen Gebrauch neuerer Laufzeit-APIs
auffallen lässt. Die Arbeitsumgebung läuft auf Node 22, ein Auseinanderlaufen zwischen lokalem Lauf
und Fließband ist also möglich und genau deshalb prüft das Fließband auf 20.

## Der Schritt `check:engines`

`scripts/check-engines.mjs` liest `engines.node` aus `package.json`, bestimmt daraus die kleinste
zulässige Node-Version und prüft jede **direkte** Abhängigkeit daraufhin, ob ihre eigene
`engines.node`-Angabe diese Version einschließt. Schlägt das fehl, bricht der Schritt ab.

Der Prüfer existiert, weil genau dieser Fehler passiert ist: `jsdom@30` deklariert
`engines.node: ^22.22.2 || ^24.15.0 || >=26.0.0` und unterstützt Node 20 überhaupt nicht. Lokal
lief es trotzdem, weil diese Arbeitsumgebung auf Node 22.22.2 steht, also zufällig auf der
Untergrenze dieser Spanne. Auf dem Fließband bestanden alle Tests, aber jsdom konnte die beiden
Dokument-Testdateien nicht laden und `vitest` beendete sich mit Fehler. Die Auflösung war `jsdom@26`
mit `engines.node: >=18`, das die gesamte deklarierte Spanne abdeckt; die Fassungen 27 bis 29
verlangen `^20.19.0` und würden `>=20.9.0` stillschweigend verengen.

**Was der Prüfer nicht leistet:** Er prüft die Untergrenze, nicht die vollständige Enthaltung einer
Spanne in der anderen. Eine Abhängigkeit, die etwa Node 21.0 ausschließt, während wir es zulassen,
fällt ihm nicht auf. Transitive Abhängigkeiten prüft er ebenfalls nicht; deren `EBADENGINE`-Warnungen
bei `npm ci` stammen fast alle aus `applicationinsights` unter `pcf-scripts` und sind nicht zu
verantworten.

`@types/node` steht bei `^18.19.55` und weicht damit von der Laufzeit ab. Das sind reine Typen,
keine Laufzeitanforderung, und der Wert stammt unverändert aus dem Sample. Beim nächsten Anheben
der Werkzeugkette gehört er mitgezogen.

`package.json` führt inzwischen `engines.node >= 20` und schreibt damit fest, was oben abgeleitet
wurde. Der Wert stammt nicht aus dem Sample, sondern aus den `engines`-Angaben von `pcf-scripts` und
`pcf-start`; er ist eine Festlegung dieses Repositories, keine Übernahme.

## Wie die Audit-Funde getrennt werden

`npm audit --json` liefert je verwundbarem Paket zwei Kantenrichtungen: `effects` nennt Pakete, die
von diesem Paket abhängen, und `via` nennt als Zeichenkette die Abhängigkeit, über die das Paket
verwundbar wird. Beide Richtungen sind unvollständig, wenn man nur eine davon betrachtet.
`browser-sync-ui` etwa hat ein leeres `effects`, seine Abhängigen stehen ausschließlich im `via`
anderer Einträge.

`scripts/audit-report.mjs` baut deshalb den Abhängigen-Graph aus beiden Kanten und läuft von jedem
Fund aufwärts bis zu den direkten Abhängigkeiten des Projekts. Zyklen werden pfadbezogen erkannt.
Daraus ergeben sich drei Gruppen:

- **Aus der übernommenen Werkzeugkette.** Alle Wurzeln liegen in `pcf-scripts` oder `pcf-start`.
  Nicht unmittelbar zu verantworten, erneut zu prüfen, sobald die Werkzeugkette angehoben wird.
- **Aus selbst gewählten Abhängigkeiten.** Mindestens eine Wurzel ist eine Abhängigkeit, die dieses
  Repository selbst aufgenommen hat. Diese Gruppe ist zu verantworten.
- **Nicht zuordenbar.** Der Report nennt keinen Pfad zu einer direkten Abhängigkeit. Von Hand
  nachzusehen.

Stand beim Anlegen: neun Funde aus der Werkzeugkette, fünf aus `vitest`, keiner unzuordenbar.

Zu den fünf eigenen: sie stammen sämtlich aus `vitest` und dessen `vite`-Kette. `vitest` ist eine
`devDependency` und landet in keinem ausgelieferten Bundle. Der als kritisch geführte Fund setzt
voraus, dass der Vitest-UI-Server lauscht; dieses Repository startet ihn nirgends. Ein Anheben von
`vitest` ist derzeit an `@types/node` gebunden, siehe oben. Das ist eine bewusste, benannte
Position, keine Nachlässigkeit.

## Der Renderer und was er am Audit-Anteil ändert

Ab M2 laufen Tests teilweise gegen ein gerendertes Dokument. Dafür kamen zwei
Entwicklungsabhängigkeiten dazu:

- `@testing-library/react@12.1.5`
- `jsdom@26.1.0`

**Warum RTL 12 und nicht die neueste Fassung.** `@testing-library/react@16` verlangt
`@types/react-dom` in `^18.0.0 || ^19.0.0`. Die Fluent-8-Peers der übernommenen Werkzeugkette
deckeln `@types/react-dom` bei `<19`, und die Plattform stellt React 16. RTL 12 ist die letzte
Fassung mit `peerDependencies.react: <18.0.0`. Es gilt dieselbe Rangfolge wie bei `vitest`: die
passende Version des Testwerkzeugs wählen, nicht die Werkzeugkette verbiegen.

**Der zusätzliche Audit-Anteil ist null.** Nach der Aufnahme meldet `npm audit` unverändert
vierzehn Funde, neun aus der Werkzeugkette und fünf aus `vitest`. Weder
`@testing-library/react@12` noch `jsdom@26` bringen einen eigenen Fund mit. Der `audit`-Job weist
das weiterhin getrennt aus; die Zahl ist also nicht geschätzt, sondern gemessen.

**Was der Renderer am Testaufbau nötig macht.** `vitest.config.ts` trägt zwei Dinge, die beide aus
der React-16-Bindung folgen:

1. Ein Alias von `react/jsx-runtime` auf `react/jsx-runtime.js`. React 16.14 liefert die Datei,
   führt aber kein `exports`-Feld, weshalb die ESM-Auflösung den erweiterungslosen Bezeichner nicht
   findet. Fluent 9 und `@griffel/react` importieren genau diesen.
2. `server.deps.inline` für `@griffel` und `@fluentui`. Ohne das transformiert vitest die Pakete
   nicht und der Alias greift nicht. Auf `@griffel` allein einzuschränken reicht nicht, die
   Fluent-Pakete importieren das JSX-Runtime ebenfalls.
3. `vitest.setup.ts` mit einem minimalen Ersatz für `PointerEvent`. jsdom 26 kennt die Schnittstelle
   nicht, und ohne sie erreichen weder `clientX` noch `pointerId` den Handler; die Ereignisse kommen
   als bloßes `Event` an. Der Ersatz erweitert `MouseEvent` und wird nur gesetzt, wenn ein `window`
   vorhanden ist und `PointerEvent` fehlt. Das heißt zugleich: der Zeigerpfad ist hier gegen einen
   Stellvertreter geprüft, nicht gegen eine echte Browser-Implementierung.

Im Build stellt sich die Frage nicht: dort werden React und Fluent als Platform Libraries
ausgelagert, sichtbar als `external "Reactv16"` und `external "FluentUIReactv940"`. Das Auflösen
der echten Pakete passiert ausschließlich im Test.

Das Einbinden kostet Laufzeit: der Transformationsschritt der Dokumenttests liegt bei rund sechs
Sekunden. Die Tests ohne Dokument laufen weiter in Millisekunden, weil `environmentMatchGlobs`
`jsdom` nur auf `__tests__/**/*.dom.test.tsx` anwendet.

## Solution-Packaging

Der Workflow liegt in `.github/workflows/package.yml`. Er läuft auf Abruf über
`workflow_dispatch` und bei jedem Tag, der auf `v` beginnt. Er blockiert `ci.yml` nicht und wird von
ihm nicht ausgelöst.

**Er braucht keine Secrets.** Das war der Denkfehler, an dem dieser Abschnitt vorher als Platzhalter
hing: Zugangsdaten braucht nur der *Import* in eine Umgebung, nicht das *Packen*. Der Workflow packt
und legt das Ergebnis als Artefakt ab. Der Import bleibt eine Handlung im Maker-Portal, mit dem
Browser-Login der Person, die ihn verantwortet. Ein Import an einem Push-Trigger wäre ein Eingriff in
eine echte Umgebung und ist weiterhin nicht vorgesehen.

### Job `package`

Node 20 und .NET 8, dann die Power Platform CLI als .NET-Werkzeug:

```
dotnet tool install --global Microsoft.PowerApps.CLI.Tool
```

Das ist der dokumentierte plattformübergreifende Weg
(`power-platform/developer/howto/install-cli-net-tool.md`). Der Runner bringt `pac` **nicht** von
sich aus mit; die MSI-Fassung ist Windows-only, die VS-Code-Erweiterung hier gegenstandslos.

Danach `npm ci`, ein Produktionsbuild, das Erzeugen des Solutionprojekts, zwei Builds und der
Artefakt-Upload.

### Warum das `cdsproj` erzeugt und nicht eingecheckt ist

Der Auftrag lautete, ein `cdsproj` anzulegen. Der Workflow lässt es stattdessen von
`pac solution init` und `pac solution add-reference` auf dem Runner erzeugen. Der Grund ist Regel 2:
`pac` lässt sich in der Arbeitsumgebung nicht installieren, weil der Egress-Proxy `dot.net` sperrt,
und ein `cdsproj` samt `src/Other/Solution.xml` aus dem Gedächtnis zu schreiben wäre genau das
Erfinden, das die Regel untersagt. Die Dokumentation zeigt einzelne Eigenschaften des `cdsproj`,
etwa `SolutionPackageType` und die `ProjectReference`, nirgends aber die vollständige Datei.

Der Workflow legt das erzeugte Projekt deshalb zusätzlich als Artefakt `solution-project-sources`
ab. **Nach dem ersten Lauf ist die echte, vom Werkzeug erzeugte Datei verfügbar und gehört dann
eingecheckt**, womit der Workflow auf ein versioniertes Projekt umgestellt werden kann. Bis dahin
ist das Erzeugen zur Bauzeit die einzige Fassung, die nicht geraten ist.

### Managed und unmanaged

Beide entstehen aus demselben Projekt über die Build-Konfiguration:

| Befehl | Ergebnis | Artefakt |
| --- | --- | --- |
| `dotnet build --configuration Debug` | unmanaged | `solution-unmanaged` |
| `dotnet build --configuration Release` | managed | `solution-managed` |

Belegt in `powerapps-docs/developer/component-framework/import-custom-controls.md`: „Building the
solution in the *debug* configuration generates an unmanaged solution package. Building the solution
in *release* configuration generates a managed solution package." Für DEV ist unmanaged das
Richtige, für TEST und PROD managed.

### Produktionsbuild

`npm run build -- --buildMode production`. Der Wert ist belegt, und zwar gegen die Werkzeugkette
selbst statt gegen die Doku: `pcf-scripts/diagnosticMessages.generated.js` meldet bei einem
unbekannten Wert „Unsupported buildMode '{0}' specified. Supported values include 'development' or
'production'." Die Doku-Seite `code-components-alm.md` schreibt an einer Stelle
`--buildMode release`; das ist ein Fehler der Seite, `release` ist kein zulässiger Wert.

Der Unterschied ist erheblich und im Job-Protokoll nachlesbar:

| Modus | `bundle.js` |
| --- | --- |
| `development`, die Vorgabe | 87.881 Byte |
| `production` | 25.394 Byte |

### Job `probe-virtual-dataset`

Blockiert nicht. Er ruft

```
pac pcf init --name Wegwerf --namespace Wegwerf --template dataset --framework react
```

in einem temporären Verzeichnis auf und gibt Exitcode und, bei Erfolg, das erzeugte Manifest ins
Job-Protokoll aus.

Der Job beantwortet Punkt 5 aus `docs/DEV-VERIFICATION.md` vorab, soweit er sich ohne Umgebung
beantworten lässt. `--template` und `--framework` sind in der CLI-Referenz unabhängige Schalter ohne
dokumentierte Einschränkung. Nimmt die CLI die Kombination an, ist sie vom Hersteller vorgesehen und
das erzeugte Manifest zeigt, welche Attribute er setzt und unserem fehlen — `cds-data-set-options`
ist der erste Verdacht. Lehnt sie ab, ist Punkt 5 beantwortet, ohne dass etwas importiert wurde.

**Was der Job nicht leistet:** Er zeigt, was das Werkzeug zulässt, nicht, was der Host lädt. Bauen
ist nicht Laden. Punkt 5 bleibt bis zum DEV-Lauf offen.

### Was weiterhin offen ist

- Die Major- und Minor-Fassung in der erzeugten `Solution.xml` stammt aus `pac solution init` und
  ist nicht auf die Manifest-Version `0.2.0` abgestimmt. `pac solution version` setzt nur Build und
  Revision. Das ist zu klären, sobald das erzeugte Projekt eingecheckt ist.
- Der Herausgeber. Vorgabe ist `Ayonto` mit Präfix `ayonto`; verbindlich ist, was die Zielumgebung
  führt. Beides ist am `workflow_dispatch` überschreibbar.
