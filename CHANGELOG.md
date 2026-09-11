# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier festgehalten.

Das Format folgt [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
die Versionierung folgt [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

### Fixed

- Mindesthöhe von 240 Pixeln auf `.ayonto-kanban-root`. Ein Subgrid-Container ohne eigene Höhe
  ließ das Board bisher auf null zusammenfallen, und das sieht im Browser genauso aus wie ein
  Bundle, das gar nicht lädt. Die Verwechslung hätte Punkt 5 aus `docs/DEV-VERIFICATION.md` falsch
  negativ beantwortet und in den Rückweg geführt, der den ganzen Entwurf kostet.
  Die Mindesthöhe beseitigt einen Auslöser, nicht die Verwechslungsgefahr: ein Bundle, das nicht
  lädt, rendert auch keine Wurzel. Die Dreiertabelle in `docs/DEV-RUNBOOK.md` §3 Punkt 5 bleibt
  deshalb maßgeblich.
- `.ayonto-kanban-drag-layer` war der einzige Selektor im Stylesheet ohne Präfix
  `.ayonto-kanban-root` und hätte die Klasse überall im Host getroffen. Im DOM lag das Element schon
  immer innerhalb der Wurzel; die Regel ist jetzt entsprechend gescoped. Gefunden hat das der neue
  Stylesheet-Test, nicht das Auge.
- Manifest-Version auf `0.2.1`. Eine Änderung am Control ohne Versionserhöhung wird von einer
  Model-Driven-App nicht bemerkt.

### Added

- `__tests__/stylesheet.test.ts`: prüft die Mindesthöhe, dass die volle Höhe daneben bestehen bleibt,
  und dass jede Regel unter `.ayonto-kanban-root` gescoped ist. Drei Tests, 221 insgesamt.
- `docs/DEV-VERIFICATION.md` Punkt **5a, React 17 statt React 16 zur Laufzeit**. Die Doku sagt, dass
  eine Model-Driven-App React `17.0.2` lädt, obwohl das Manifest `16.14.0` anfordert, während der
  Code gegen 16.14 typisiert und getestet ist.
  Der Punkt trägt das Ergebnis einer Durchsicht: **kein einziger `addEventListener` auf `document`
  oder `window`**, alle Handler über React-Props, kein `stopPropagation`, kein asynchrones Lesen von
  Ereignisfeldern, und die beiden `document.`-Zugriffe sind nicht ereignisbezogen. Die verlegte
  Ereignisdelegation trifft damit keine Stelle im Code. Der Punkt bleibt trotzdem stehen, weil das
  Zusammenspiel mit `setPointerCapture` im Browser weiterhin ungeprüft ist; er wird bei Punkt 2
  mitbeobachtet und braucht keinen eigenen Handgriff.

### Added

- `.github/workflows/package.yml`: Packt die Dataverse-Solution, auf Abruf über
  `workflow_dispatch` und bei jedem Tag, der auf `v` beginnt. Managed und unmanaged, beide als
  Artefakt. **Ohne Secrets**, weil Packen keine Authentifizierung braucht; die braucht nur der
  Import, und der bleibt eine Handlung im Maker-Portal.
  Der Workflow installiert die Power Platform CLI als .NET-Werkzeug über den dokumentierten
  plattformübergreifenden Weg, baut das Control mit `--buildMode production`, erzeugt das
  Solutionprojekt mit `pac solution init` und `pac solution add-reference` und baut zweimal:
  `Debug` liefert unmanaged, `Release` managed.
- Nicht blockierender Job `probe-virtual-dataset` im selben Workflow. Er ruft `pac pcf init` mit
  `--template dataset --framework react` auf und gibt Exitcode und erzeugtes Manifest ins Protokoll.
  Damit beantwortet sich Punkt 5 aus `docs/DEV-VERIFICATION.md` so weit vorab, wie es ohne Umgebung
  geht: ob das Werkzeug die Kombination vorsieht und welche Attribute es dabei setzt.

### Changed

- `docs/CI.md`: Der Platzhalterabschnitt „Solution-Packaging, noch nicht umgesetzt" ist durch die
  Beschreibung des tatsächlichen Workflows ersetzt. Der Denkfehler, an dem er hing, ist benannt:
  Zugangsdaten braucht nur der Import, nicht das Packen.
- `docs/DEV-RUNBOOK.md` §1: Hauptpfad ist jetzt das Fließband. Die lokalen `pac`-Befehle bleiben als
  Alternative stehen, sind aber nicht mehr der erste Weg, weil `pac` weder in der Arbeitsumgebung
  noch auf dem Zielrechner vorhanden ist.
  Zwei der acht offenen Punkte sind damit erledigt: `--buildMode` nimmt `production`, belegt an
  `pcf-scripts` selbst statt an der widersprüchlichen Doku-Seite, und die Bundlegrößen sind
  gemessen statt geschätzt — 25.394 Byte produktiv gegen 87.881 Byte im Entwicklungsbuild.

### Notes

- Das `cdsproj` wird vom Fließband erzeugt und **nicht** eingecheckt. `pac` lässt sich in der
  Arbeitsumgebung nicht installieren, weil der Egress-Proxy `dot.net` sperrt, und die Datei samt
  `src/Other/Solution.xml` aus dem Gedächtnis zu schreiben wäre nach Regel 2 unzulässig. Der
  Workflow legt das erzeugte Projekt als Artefakt `solution-project-sources` ab; nach dem ersten
  Lauf ist die echte Datei verfügbar und gehört dann eingecheckt.

## [0.2.0] - M2

Meilensteine M1 und M2 abgeschlossen. Das Board rendert, lässt sich mit Zeiger und Tastatur
bedienen, und der gesamte Stand ist auf dem Fließband grün.

### Changed

- Manifest-Version des Controls `Ayonto.KanbanBoard` von `1.0.0` auf `0.2.0` gesetzt. Regel 6
  verlangt eine Erhöhung je Meilenstein; die `1.0.0` stammte unverändert aus dem Platzhalter-Manifest
  des Scaffolds und war nie eine Aussage über Reife. Sie blieb über M1 und M2 unberührt stehen, die
  Regel war also zweimal nicht angewandt.
  Die Korrektur geht **nach unten**, und das ist genau einmal folgenlos möglich: nämlich jetzt. Die
  Dokumentation knüpft an eine steigende Version das Verwerfen des Zwischenspeichers in
  Model-Driven-Apps und die Aktualisierungsaufforderung in Canvas-Apps. Beides setzt voraus, dass das
  Control bereits in einer Umgebung liegt. Es wurde nie importiert, es existiert keine Solution, und
  damit gibt es keinen Verbraucher, dessen Zwischenspeicher eine höhere Zahl bräuchte. Nach dem
  ersten Import wäre dieselbe Korrektur nicht mehr frei.
  Rückwirkend gilt M1 als `0.1.0`, M2 als `0.2.0`. Die `0.4.0` weiter unten gehört dem
  Upstream-Control `PipelineKanban`, das als `reference/PipelineKanban/` unverändert liegt und mit
  diesem Control keine Versionslinie teilt.
  `0.x` ist die ehrliche Reihe: das Control ist nicht paketierbar gewesen, hat nie in einem Host
  geladen, und M3 sowie M4 stehen aus. Die `<resx>`-Einträge behalten ihre eigene `version`, die
  keine Steuerungswirkung hat.

### Added

- `docs/AUDIT.md`: Audit des Upstream-Stands. Bestätigt alle zwölf gelisteten Defekte mit Datei und
  Zeilennummer, ergänzt zwanzig weitere Befunde, listet den Verifikationsstand aller benötigten
  Plattform-APIs und stellt das Manifest-Zielbild dem tatsächlichen Schema gegenüber.
- `docs/API-NOTES.md`: Verifikationsprotokoll nach Regel 2, mit Links auf die geprüften
  Dokumentationsseiten. Was dort nicht steht, gilt als nicht verifiziert.
- `.claude/commands/kanban-rebuild.md`: Slash-Command, der den Umbau in den Meilensteinen `audit`
  sowie `M1` bis `M4` führt.

### Added

- Baubares PCF-Projekt. Werkzeugkette nach Regel 14 aus `microsoft/PowerApps-Samples`,
  Commit `ce13915`, Sample `component-framework/FluentThemingAPIControl` übernommen:
  `package.json`, `tsconfig.json`, `pcfconfig.json` und `eslint.config.mjs` verbatim,
  `KanbanBoard.pcfproj` mit angepasstem `<Name>` und frischer `ProjectGuid`.
- `KanbanBoard/` mit Platzhalter-Manifest und Platzhalter-`index.ts`. Namespace `Ayonto`,
  `control-type="virtual"`, ein `data-set`, keine Beispiel-Property, keine Beispielkomponente.
  Beides wird in M1 Aufgabe 3 vollständig ersetzt.
- `npm run build` und `npm run lint` laufen grün. Damit ist Regel 10 ab hier anwendbar.

- Modellschicht `KanbanBoard/model/`, frei von PCF-Typen und ohne Import aus
  `ComponentFramework`. `types.ts` beschreibt Spalte, Karte, Board-Zustand und Verschiebevorgang,
  `grouping.ts` ordnet Datensätze Spalten zu, `reconcile.ts` führt den Zustandsautomaten
  `pending / confirmed / reverted`.
- Test-Setup mit vitest, das übernommene Sample bringt keines mit. 34 Tests in `__tests__/`,
  darunter alle verbindlich geforderten Fälle.

- Fließband `M0-CI`: `.github/workflows/ci.yml` führt bei jedem Push und bei jedem Pull Request
  `npm ci`, `npm run build`, `npm run lint` und `npm test` aus. Node 20, abgeleitet aus
  `engines.node >= 20` von `pcf-scripts` und `pcf-start`, weil weder `package.json` noch das
  übernommene Sample ein `engines`-Feld führen.
- Nicht blockierender `audit`-Job mit `scripts/audit-report.mjs`. Das Skript trennt die Funde nach
  Herkunft: übernommene Werkzeugkette, selbst gewählte Abhängigkeiten, nicht zuordenbar.
- `docs/CI.md` beschreibt beide Jobs, begründet die Node-Wahl und hält das Solution-Packaging über
  `microsoft/powerplatform-actions` als dokumentierten Platzhalter fest, samt der Voraussetzungen,
  die vorher zu klären sind.

- Plattformgrenze: `KanbanBoard/services/` und `KanbanBoard/hooks/`. `metadata.ts` mit der
  Fallback-Kette und einmaligem Logging des greifenden Zweigs, `privileges.ts` als Kapselung von
  `hasEntityPrivilege` samt der dokumentierten Vorbedingung, `useOptionMetadata` mit
  zurücksetzbarem Fehlerzustand, `useDatasetRecords` mit der Übersetzung in die Modelltypen und der
  Auswertung von `dataset.paging`, `useOptimisticMove` als Anbindung von `reconcile.ts` an
  `context.webAPI.updateRecord`.
- `docs/UNTYPED-APIS.md` als Register nach Regel 9. Es hält fest, dass derzeit kein `any` im
  Quelltext steht und die Ausnahme nicht in Anspruch genommen wird.
- `docs/API-NOTES.md` beschreibt beide Zweige der Fallback-Kette und hält ausdrücklich fest, dass
  das empirische Ergebnis offen ist, bis es aus einer echten Umgebung vorliegt.
- 50 weitere Tests, zusammen 84.

- Komponenten `Board`, `Column`, `Card`, `EmptyState`, `ErrorState` und `BoardRoot`. Alles läuft
  über React, kein `dangerouslySetInnerHTML`, kein sichtbarer String im Quelltext.
- `model/contrast.ts`: die Optionsfarbe wird als Akzentbalken in voller Sättigung und als 18 Prozent
  aufgehellter Ton für den Spaltenkopf verwendet. Der Kopftext sitzt auf dem aufgehellten Ton, für
  den der Kontrast belegt ist.
- `strings/KanbanBoard.1033.resx` und `strings/KanbanBoard.1031.resx` mit deckungsgleichen
  Schlüsselmengen, `css/KanbanBoard.css` durchgehend unter `.ayonto-kanban-root` gescopt,
  `ControlManifest.Input.xml` vollständig nach Zielbild mit Fluent `9.4.0`, und `index.ts` ersetzt
  den Platzhalter.
- `resolveBinding` und `resolveGroupByAttribute` lösen die `property-set`-Aliasse und den
  dahinterliegenden Logikalnamen aus `dataset.columns` auf.
- 46 weitere Tests, zusammen 131.

- Renderer für Dokumenttests: `@testing-library/react@12.1.5` und `jsdom@30.0.1`, angewandt über
  `environmentMatchGlobs` nur auf `__tests__/**/*.dom.test.tsx`. RTL 12 ist die letzte Fassung mit
  `peerDependencies.react: <18.0.0`; die neueste verlangt `@types/react-dom` ^18 oder ^19, was mit
  den Fluent-8-Peers der Werkzeugkette kollidiert.
- Erste Verwendung schließt die in M1 benannte Lücke: die Verdrahtung von `onClick` auf der Karte
  und `onRetry` im `ErrorState` ist jetzt belegt, neun Dokumenttests, zusammen 140.
- Der zusätzliche Audit-Anteil ist null. `npm audit` meldet unverändert vierzehn Funde, neun aus
  der Werkzeugkette und fünf aus `vitest`. In `docs/CI.md` ausgewiesen.

- Zeigergesteuertes Verschieben über Pointer Events, kein HTML5-Drag. Maus, Stift und Finger nehmen
  denselben Pfad. Eigener Drag-Layer, `setPointerCapture`, Aufnahme erst ab fünf Pixeln Bewegung,
  damit ein Klick weiterhin den Datensatz öffnet.
- Ablagebereiche sind die Spalten, erkannt über `document.elementFromPoint` und
  `data-column-key`, mit sichtbarer Markierung der Zielspalte. Ablage auf der Ursprungsspalte
  erzeugt keinen Schreibvorgang.
- Anbindung an `useOptimisticMove`: der optimistische Zustand wirkt jetzt am gerenderten Board, ein
  Dataset-Refresh löst ihn über ein einziges gefaltetes Ereignis auf.
- `allowDrag` wird ausgewertet, die resx-Beschreibungen in 1033 und 1031 sind nachgezogen.
- `prefers-reduced-motion` schaltet den Übergang der Zielmarkierung ab.
- 29 weitere Tests, zusammen 169.

- `docs/DEV-VERIFICATION.md`: die Prüfliste für den ersten Lauf gegen eine echte Organisation. Neun
  Punkte, jeder mit der konkreten Frage, dem Weg zur Antwort und dem, was ein negativer Befund nach
  sich zöge.
- `.claude/commands/kanban-rebuild.md`: Regel 13 verbietet jetzt ausdrücklich auch selbst gesetzte
  Wartebefehle auf Runner-Ergebnisse. Ein noch laufender Lauf wird als offener Punkt berichtet und
  beim nächsten Aufruf nachgetragen.

- Tastaturpfad zum Verschieben: Leertaste nimmt eine fokussierte Karte auf, Pfeiltasten wechseln
  Zielspalte und Position, Leertaste legt ab, Escape bricht ab. Derselbe `useOptimisticMove`-Pfad
  wie beim Zeiger, keine zweite Schreiblogik.
- Fokusführung: nach Ablage und nach Abbruch bleibt der Fokus auf der Karte, auch wenn sie durch die
  Ablage in eine andere Spalte gewandert ist. Bei Ablehnung durch den Server ebenso, dort in der
  Ausgangsspalte.
- `role="list"` auf dem Spaltenkörper mit zugänglichem Namen aus Optionslabel und Anzahl,
  `role="listitem"` je Karte, und eine höfliche `aria-live`-Region, die Aufnahme, Zielwechsel,
  Ablage, Abbruch und Ablehnung ansagt. Alle Texte aus resx.
- Zweifarbiger Fokusring, dunkler Kern mit hellem Hof. Ein einfarbiger dunkler Ring erreichte auf
  dunklen Optionsfarben nur 1,08 bis 2,11 und ging dort unter; der zweifarbige liegt auf jedem
  geprüften Grund über 3.
- Zielmarkierung nicht mehr allein über Farbe: gestrichelte Umrandung des Spaltenkörpers und ein
  Ring im Spaltenkopf, dazu `forced-colors`-Regeln.
- 49 weitere Tests, zusammen 218.

### Fixed

- `jsdom` von `30.0.1` auf `26.1.0`. jsdom 30 deklariert `engines.node: ^22.22.2 || ^24.15.0 ||
  >=26.0.0` und unterstützt Node 20 nicht. Lokal fiel das nicht auf, weil die Arbeitsumgebung auf
  Node 22.22.2 steht; auf dem Fließband bestanden zwar alle Tests, jsdom konnte aber die beiden
  Dokument-Testdateien nicht laden und `vitest` endete mit Fehler.
- `engines.node` von `>=20` auf `>=20.9.0` korrigiert. `eslint@9`, `eslint-plugin-promise` und
  `typescript-eslint` verlangen `^20.9.0`, die erste Ableitung war zu weit.
- Neuer Schritt `check:engines` mit `scripts/check-engines.mjs`, im Fließband vor dem Build. Er
  prüft jede direkte Abhängigkeit gegen die deklarierte Node-Untergrenze und hätte den Fehler vor
  dem Push gefangen.
- `vitest.setup.ts` mit einem minimalen `PointerEvent`-Ersatz. jsdom 26 kennt die Schnittstelle
  nicht, wodurch die Zeigerereignisse ohne `clientX` und `pointerId` beim Handler ankamen.


- `services/metadata.ts` behandelt `Color` als Nutzlast, nicht als Tragfähigkeitsprobe. Optionsfarben
  sind in Dataverse optional; eine fehlende Farbe darf weder den Zweig verwerfen noch einen zweiten
  Netzaufruf auslösen, den der Endpunkt genauso wenig beantworten könnte. Fehlt sie, steht `null` im
  Modell und die Spalte bekommt den Standardakzent. `docs/API-NOTES.md` nachgezogen.
- `package.json` führt `engines.node >= 20`. Abgeleitet aus den `engines`-Angaben von `pcf-scripts`
  und `pcf-start`, den einzigen belastbaren Quellen: weder `package.json` noch das übernommene
  Sample hatten ein solches Feld, und `eslint`, `vitest` und `typescript` sind alle weiter. Damit
  steht die Node-Anforderung im Projekt statt nur in `docs/CI.md`.

### Changed

- `.claude/commands/kanban-rebuild.md` auf v2. Alle Änderungen folgen aus den Audit-Befunden:
  Regel 2 lässt `MicrosoftDocs/powerapps-docs` mit gepinnter SHA als Ersatzquelle zu, nimmt aber
  Versionsstrings und den Preview-gegen-GA-Status davon aus; Regel 10 ist bis zum Ende von M1 nicht
  anwendbar und wird als Befund gemeldet statt umgangen; neue Regel 12 zur Optionsreihenfolge und
  Regel 13 gegen periodische Check-ins; React im Manifest-Zielbild auf `16.14.0`, `writeMode` und
  `customApiName` ersatzlos entfernt; M1 auf Scaffolding über `pac pcf init` umgestellt und um eine
  zeitlich begrenzte Aufgabe 0 zum Metadaten-Spike ergänzt; M2 um die Randbedingung React 16
  erweitert; M3 auf Rechteprüfung, Anlegen mit Formularparametern, Plattformdialoge und Rollback
  zugeschnitten, die serverseitige Durchsetzung ausdrücklich außerhalb dieses Repos; zwei
  Audit-Zusatzbefunde mit Akzeptanzkriterium in die Defektliste gehoben.

- `.claude/commands/kanban-rebuild.md` auf v3. Neue Regel 14 zur Herkunft des Scaffolds: ist die
  Power Platform CLI nicht verfügbar, wird der Werkzeugkettensatz aus `microsoft/PowerApps-Samples`
  mit gepinnter SHA übernommen, handgeschriebene Projektdateien bleiben ausgeschlossen. Regel 10
  wertet fehlende Werkzeuge nicht länger als Befund, sondern verschiebt sie nach `M0-CI`. M1
  stellt das Scaffold an den Anfang, und der blockierende Metadaten-Spike weicht einer
  Fallback-Kette in `services/metadata.ts` mit einmaligem Logging des greifenden Zweigs. Neuer
  Meilenstein `M0-CI` vor M3: GitHub-Actions-Workflow für Build, Lint und Test bei jedem Push plus
  Solution-Packaging über `microsoft/powerplatform-actions`, und die Festlegung, dass `pac`
  ausschließlich dort läuft.

- `.claude/commands/kanban-rebuild.md` auf v4. `allowed-tools` um die schreibenden git-Kommandos
  und `gh pr` erweitert. Regel 14 trennt jetzt sauber: übernommen wird ausschließlich die
  Werkzeugkette, Manifest und `index.ts` sind Deliverable und werden selbst geschrieben, und
  Laufzeitentscheidungen des Controls — namentlich die Platform-Library-Versionen — folgen nicht
  automatisch dem Sample. Neue Regel 15: die in `package.json` gepinnte und die im Manifest
  deklarierte Version derselben Platform Library müssen übereinstimmen und werden gemeinsam
  angehoben. `M0-CI` bekommt einen `npm audit`-Schritt, der transitive Funde aus `pcf-scripts`
  getrennt von selbst gewählten Abhängigkeiten ausweist.

- Das Upstream-Control liegt jetzt unter `reference/PipelineKanban/`, per `git mv` verschoben,
  Inhalt aller Dateien byteweise unverändert. Die Lint-Ausnahme zeigt auf `reference/**`, und
  `tsconfig.json` schließt `./reference` aus, damit TypeScript die Referenz nicht mehr in sein
  Programm zieht. Der Dateiname des Referenz-Manifests trägt die Endung `.reference`, weil
  `pcf-scripts` Controls allein am Dateinamen `ControlManifest.Input.xml` erkennt, die Suche fest
  im Projektstamm startet und nur `node_modules` ausschließt. `out/controls/` enthält damit nur
  noch `KanbanBoard`.
- Fluent gemeinsam auf `9.4.0` gesetzt, in `package.json` und im Manifest. Grund: Regel 15
  verlangt Gleichstand, und gegen `9.46.2` zu bauen, während das Manifest `9.4.0` anfordert, hieße
  gegen eine neuere API zu bauen als zur Laufzeit bereitsteht. `9.4.0` ist die konservative Wahl
  und liegt im dokumentierten Bereich `>=9.4.0 <=9.46.2`.
- React aus demselben Grund auf `16.14.0` festgelegt statt `^16.14.0`, in `dependencies` und im
  `overrides`-Block. Der Override musste mitgezogen werden, sonst bricht `npm install` mit
  `EOVERRIDE` ab.

### Notes

- Der Meilenstein `audit` ändert keinen Code. Die Manifest-Version bleibt deshalb bei `0.4.0`;
  Regel 6 knüpft die Erhöhung an eine Änderung am Control.
- `npm run build` und `npm run lint` konnten nicht ausgeführt werden, weil das Repository kein
  npm-Projekt enthält. Das ist als Befund Z1 aufgenommen und die erste Aufgabe von M1.
- `learn.microsoft.com` ist in der Ausführungsumgebung durch die Egress-Policy gesperrt. Verifiziert
  wurde gegen das Quell-Repository der Learn-Seiten, `MicrosoftDocs/powerapps-docs` auf Commit
  `a76d0d1`. Details in `docs/API-NOTES.md`.

## [0.4.0] - Upstream

Ausgangsstand des Forks von `jawadAli1234/pipeline-kanban`, unverändert übernommen.
