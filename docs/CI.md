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

## Solution-Packaging, noch nicht umgesetzt

Zu `M0-CI` gehört das Packen einer Dataverse-Solution über
[`microsoft/powerplatform-actions`](https://github.com/microsoft/powerplatform-actions). Das ist
hier bewusst **nicht** als halber Workflow angelegt, weil es ohne Umgebungszugang nichts prüft,
sondern nur rot leuchtet.

Was fehlt, bevor es sinnvoll wird:

- Eine Zielumgebung samt Zugangsdaten als Repository- oder Environment-Secrets. Je nach gewähltem
  Verfahren ein Service Principal mit Mandanten-, Anwendungs- und Geheimniswert, oder ein
  Benutzerkonto mit Kennwort. Welche Werte genau nötig sind, richtet sich nach der Aktion und ist
  vor der Umsetzung gegen deren Dokumentation zu prüfen, nicht aus dem Gedächtnis zu setzen.
- Eine Entscheidung, ob das Fließband nur packt und das Ergebnis als Artefakt ablegt, oder ob es
  auch importiert. Ein Import ist ein Eingriff in eine echte Umgebung und gehört nicht an einen
  Push-Trigger.
- Ein `cdsproj`-Solutionprojekt, das die `KanbanBoard.pcfproj` referenziert. Das Repository hat
  heute nur das Control-Projekt.

Solange das offen ist, erzeugt das Fließband kein Solution-Artefakt. Dieser Abschnitt ist der
Platzhalter dafür, nicht ein auskommentierter Job.
