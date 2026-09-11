# Referenz: Upstream-Control

`PipelineKanban/` ist der unveränderte Ausgangsstand des Forks von
`jawadAli1234/pipeline-kanban`, Commit `9099fae`. Er liegt hier als Nachschlagewerk für den Umbau
zum Ayonto Kanban Board und wird nicht gebaut, nicht gelintet und nicht ausgeliefert.

Der Dateiname des Manifests trägt die Endung `.reference`. Grund: `pcf-scripts` erkennt ein
Control daran, dass ein Verzeichnis eine Datei namens `ControlManifest.Input.xml` enthält. Die
Suche startet fest im Projektstamm und schließt allein `node_modules` aus; `pcfconfig.json` kennt
keinen Schlüssel dafür. Ohne die Endung würde dieses Control bei jedem `npm run build` mitgebaut
und in `out/controls/` sowie in das Solution-Paket geraten.

Der Inhalt aller Dateien ist byteweise unverändert. Geändert wurde ausschließlich der Dateiname
des Manifests.
