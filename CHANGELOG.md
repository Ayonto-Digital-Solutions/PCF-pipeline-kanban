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
