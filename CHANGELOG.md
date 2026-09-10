# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier festgehalten.

Das Format folgt [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
die Versionierung folgt [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

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
