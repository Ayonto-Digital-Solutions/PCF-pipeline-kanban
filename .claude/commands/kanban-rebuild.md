---
description: Rebuild the Pipeline Kanban PCF fork into the Ayonto Kanban Board control
argument-hint: [audit|M1|M2|M0-CI|M3|M4]
allowed-tools: Read, Write, Edit, Glob, Grep, WebFetch, Bash(npm:*), Bash(node:*), Bash(npx:*), Bash(pac:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git clone:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(gh pr:*)
---

# Auftrag

Du baust den Fork von `jawadAli1234/pipeline-kanban` zu einem produktionsreifen Dataverse-Dataset-Control um: **Ayonto Kanban Board**.

Zielumgebung ist eine Governance-Lösung bei 50Hertz (Power Platform, Dataverse only, kein Dynamics 365). Der erste Anwendungsfall sind Decision Assessments, gruppiert nach einer Choice-Spalte, mit dem Assessor als Kartentitel. Das Control muss aber generisch bleiben und darf nirgends auf diesen Anwendungsfall hart verdrahtet werden.

Ausgeführter Meilenstein: `$ARGUMENTS`. Ohne Argument führst du `audit` aus.

---

# Nicht verhandelbare Regeln

1. **Ein Meilenstein pro Aufruf.** Nach Abschluss stoppst du, berichtest und wartest. Kein Vorgriff auf den nächsten Meilenstein.
2. **Keine erfundenen APIs.** Jede PCF-, Client-API- oder Manifest-Aussage, die du nicht bereits im Repo verifiziert hast, prüfst du per WebFetch gegen `learn.microsoft.com`, bevor du sie verwendest. Findest du keine Bestätigung, implementierst du sie nicht, sondern meldest die offene Frage.
   Ist `learn.microsoft.com` nicht erreichbar, gilt `MicrosoftDocs/powerapps-docs` mit gepinnter Commit-SHA als zulässige Primärquelle. Learn rendert seine Seiten aus diesem Repository. Jede darauf gestützte Aussage nennt Dateipfad und SHA.
   **Ausnahme:** Zulässige Versionsstrings der Platform Libraries und der Preview-gegen-GA-Status gelten damit **nicht** als bestätigt. Sie gelten erst als bestätigt, wenn der Build sie akzeptiert.
3. **Keine erfundenen Logikalnamen.** Die im Abschnitt "Verifizierte Ausgangslage" genannten Namen sind autoritativ. Alles andere kommt zur Laufzeit aus Metadaten oder aus der Maker-Konfiguration, niemals aus einer Annahme im Code.
4. **Kein `innerHTML` mit Daten.** Datensatzinhalte, Optionslabels und Feldwerte gehen ausschließlich durch React. Kein `dangerouslySetInnerHTML`.
5. **Keine Kommentare im ausgelieferten Code.** Erklärungen gehören in `docs/` und `CHANGELOG.md`, nicht zwischen die Zeilen.
6. **Changelog separat.** Jede Änderung wird in `CHANGELOG.md` nach Keep-a-Changelog geführt. Die Manifest-Version wird bei jedem Meilenstein erhöht.
7. **"50Hertz" wird immer vollständig ausgeschrieben**, nie abgekürzt. Weder in Code, Doku, Commit-Messages noch in Strings.
8. **Namespace ist `Ayonto`**, nicht `Contoso`.
9. **TypeScript strict.** Kein `any` außer für dokumentiert untypisierte Plattform-Objekte, dann mit lokalem Interface und einem Eintrag in `docs/UNTYPED-APIS.md`.
10. **Jeder Meilenstein endet grün.** `npm run build` und `npm run lint` müssen fehlerfrei durchlaufen, sonst ist der Meilenstein nicht fertig.
    Solange M1 kein baubares Projekt erzeugt hat, ist das Kriterium nicht anwendbar. Dann wird es als Befund gemeldet, nicht umgangen: kein Ersatzkommando, keine als grün ausgegebene Nichtausführung. Ab dem Ende von M1 gilt es unverändert.
    Werkzeuge, die die Arbeitsumgebung nicht bereitstellen kann, sind kein Befund. Sie werden nach `M0-CI` verschoben und dort ausgeführt. Das betrifft insbesondere `pac`.
11. **Du fasst keine fremde Solution an.** Die TaskandDecision-Lösung ist nicht Teil dieses Repos und wird nicht verändert.
12. **Optionsreihenfolge wird übernommen, nicht hergestellt.** Die Reihenfolge des von der Plattform zurückgegebenen Options-Arrays ist die Spaltenreihenfolge. Es wird nirgends sortiert, weder nach Wert noch nach Label. Dazu gehört ein Test mit absteigenden und mit gemischten Optionswerten, der fehlschlägt, sobald irgendwo sortiert wird.
13. **Keine periodischen Check-ins ohne Anlass, keine Wartebefehle auf CI.** Nach dem Abschlussbericht eines Meilensteins wird gewartet, nicht gepollt. Kein selbst gestellter Wecker, kein wiederholtes Nachsehen ohne ein Ereignis, das es auslöst, und **kein selbst gesetzter Wartebefehl auf ein Runner-Ergebnis**. Läuft ein Lauf beim Berichten noch, wird genau das als offener Punkt berichtet, mit Commit und Lauf benannt, und beim nächsten Aufruf nachgetragen. Trifft das Ergebnis vorher von selbst ein, erübrigt sich der Nachtrag.
14. **Herkunft des Scaffolds.** Ist die Power Platform CLI nicht verfügbar, wird der Projektdateisatz aus `microsoft/PowerApps-Samples`, Teilbaum `component-framework`, mit gepinnter Commit-SHA übernommen. Jede übernommene Datei wird mit Sample-Pfad und SHA belegt, jede Abweichung vom Original einzeln benannt.
    **Übernommen wird ausschließlich die Werkzeugkette**, also `package.json`, `tsconfig.json`, `pcfconfig.json`, die ESLint-Konfiguration und die `.pcfproj`. Handgeschriebene Werkzeugkettendateien bleiben ausgeschlossen.
    **Manifest und `index.ts` sind Deliverable**, kein Scaffold. Sie werden selbst geschrieben, niemals aus einem Sample übernommen, und enthalten weder Beispielkomponenten noch Beispiel-Properties.
    **Laufzeitentscheidungen des Controls sind keine Werkzeugkette.** Das gilt namentlich für die Versionen der Platform Libraries. Sie folgen nicht automatisch dem Sample, sondern werden begründet entschieden. Ein Sample belegt, was gebaut werden kann, nicht was gebaut werden soll.
15. **Platform-Library-Versionen laufen im Gleichschritt.** Die in `package.json` gepinnte Version einer Platform Library und die im Manifest deklarierte Version derselben Bibliothek müssen übereinstimmen. Eine Anhebung erfolgt für beide gemeinsam und mit Begründung im Changelog. Gegen eine neuere API zu bauen als zur Laufzeit angefordert wird, ist ein Fehler, kein Spielraum.

---

# Verifizierte Ausgangslage

Aus dem Solution-Export `TaskandDecision 1.0.1.10 managed` und aus dem Upstream-Repo geprüft. Diese Angaben brauchst du nur als Testdaten und Akzeptanzkontext, nicht als Codekonstanten.

**Tabelle `eo_decisionassessment`**

| Spalte | Typ | Details |
| --- | --- | --- |
| `eo_progress` | Choice, lokal (`eo_decisionassessment_eo_progress`) | 122180000 = `Draft `, 122180001 = `Work `, 122180002 = `Done ` (Labels mit Leerzeichen am Ende) |
| `eo_assessor` | Lookup auf `systemuser` | required |
| `eo_decision` | Lookup auf `fo_decisionprocess` | required |
| `eo_assessmentresult` | Choice | Optionen tragen `Color`, z. B. `#cfe3a8` |
| `eo_key` | Primärname | Autonummer `ASM-{SEQNUM:5}`, ReadOnlyInUI |

**View** `Active Decision Assessments`, `savedqueryid 7da12002-f179-f111-ab0e-6045bdde6ef9`, enthält im Layout `eo_key, eo_assessor, eo_discipline, eo_progress, eo_assessmentresult, eo_assessmentdate`. Die Associated View enthält nur `eo_key` und `createdon`.

**Platzierung** Subgrid `subgrid_assessors` auf dem Hauptformular von `fo_decisionprocess`, `RecordsPerPage = 20`.

**Serverseitige Kopplung** Ein Cloud Flow triggert auf Update von `eo_decisionassessment` mit `filteringattributes = eo_progress`. Eine Business Rule setzt den RequiredLevel von `eo_assessmentresult` abhängig von `eo_progress` und läuft ausschließlich clientseitig auf dem Formular.

**Upstream-Defekte** (in `index.ts` des Forks verifiziert, alle zu beheben)

- `card.innerHTML` mit ungeescapten Datensatzwerten und Optionslabels
- `groupByField` wird nur in `init()` gelesen, nie in `updateView()`
- `pendingOverrides[recordId]` wird bei Erfolg nie gelöscht
- `container.innerHTML = ""` und Vollaufbau bei jedem `updateView`
- rohes `fetch("/api/data/v9.2/...")` statt Plattform-APIs
- keine Auswertung von `dataset.paging`
- ausschließlich HTML5-Drag-Events, dadurch kein Touch
- keine ARIA-Rollen, keine Tastaturbedienung, `window.alert` und `window.confirm`
- Spaltenreihenfolge nach numerischem Optionswert statt konfigurierter Reihenfolge
- Optionsfarben werden ignoriert
- alle Strings hart englisch im Code
- `openForm` ohne Formularparameter, dadurch keine Vorbelegung von Zielspalte und Parent-Lookup
- `columnsLoadFailed` wird nie zurückgesetzt, ein einziger fehlgeschlagener Ladeversuch legt das Board bis zum Neuladen der Seite still.
  **Akzeptanzkriterium:** Der Fehlerzustand wird bei jedem Ladeversuch zurückgesetzt, und der Fehlerzustand bietet einen Wiederholversuch an.
- Anlegen erzeugt zwei Schreibvorgänge, Quick Create plus nachgelagertes `updateRecord`.
  **Akzeptanzkriterium:** Das Anlegen erzeugt genau einen Schreibvorgang.

---

# Zielarchitektur

**Konfiguration über `property-set` statt Freitextfelder.** Der Maker wählt Spalten aus, statt Logikalnamen zu tippen. Das ist der Kern des Umbaus: Tippfehler, falsche Feldtypen und "Spalte fehlt in der View" werden strukturell unmöglich.

**Manifest-Zielbild.** Die Versionsstrings der Platform Libraries gelten nach Regel 2 erst als bestätigt, wenn der Build sie akzeptiert.

```xml
<control namespace="Ayonto" constructor="KanbanBoard" version="1.0.0"
         display-name-key="Kanban Board" control-type="virtual">

  <data-set name="records" display-name-key="Records">
    <property-set name="groupBy"      of-type="OptionSet"        usage="bound" required="true" />
    <property-set name="cardTitle"    of-type-group="titleTypes" usage="input" required="true" />
    <property-set name="cardSubtitle" of-type-group="titleTypes" usage="input" required="false" />
    <property-set name="cardBadge"    of-type-group="titleTypes" usage="input" required="false" />
    <property-set name="sumValue"     of-type="Currency"         usage="input" required="false" />
  </data-set>

  <type-group name="titleTypes">
    <type>SingleLine.Text</type>
    <type>Lookup.Simple</type>
    <type>OptionSet</type>
    <type>DateAndTime.DateOnly</type>
  </type-group>

  <property name="wipLimits"     of-type="SingleLine.Text" usage="input" required="false" />
  <property name="allowDrag"     of-type="TwoOptions"      usage="input" />

  <resources>
    <code path="index.ts" order="1" />
    <platform-library name="React" version="16.14.0" />
    <platform-library name="Fluent" version="9.46.2" />
    <resx path="strings/KanbanBoard.1033.resx" version="1.0.0" />
    <resx path="strings/KanbanBoard.1031.resx" version="1.0.0" />
  </resources>

  <feature-usage>
    <uses-feature name="WebAPI" required="true" />
    <uses-feature name="Utility" required="true" />
  </feature-usage>
</control>
```

**Zielstruktur**

```
KanbanBoard/
  ControlManifest.Input.xml
  index.ts
  components/            Board, Column, Card, DragLayer, EmptyState, ErrorState
  hooks/                 useOptionMetadata, useDatasetRecords, useOptimisticMove, useKeyboardDnd
  services/              metadata.ts, writeService.ts, privileges.ts
  model/                 types.ts, grouping.ts, reconcile.ts
  strings/               KanbanBoard.1033.resx, KanbanBoard.1031.resx
  css/                   KanbanBoard.css
__tests__/
docs/
CHANGELOG.md
```

Die reine Logik in `model/` ist frei von PCF-Typen und damit ohne Harness testbar.

---

# Meilensteine

## audit

Kein Code. Du liest das Repo vollständig, gleichst es gegen die Liste der Upstream-Defekte ab und lieferst:

1. `docs/AUDIT.md` mit einer Tabelle: Defekt, Fundstelle mit Datei und Zeilennummer, Schweregrad, betroffener Meilenstein.
2. Zusätzlich gefundene Defekte, die oben nicht stehen.
3. Eine Liste aller Plattform-APIs, die der neue Aufbau braucht, mit Spalte "gegen Learn verifiziert ja/nein" und Link.
4. Eine Abweichungsliste zwischen dem Manifest-Zielbild oben und dem, was die Doku tatsächlich hergibt.

Danach stoppen.

## M1 Fundament

### Aufgabe 1: Scaffold, vor allem anderen

Das Scaffold steht am Anfang von M1. Ohne baubares Projekt gibt es weder Harness noch `npm run
build`, und jede Aussage über die Laufzeit wäre unbelegt.

```
pac pcf init --namespace Ayonto --name KanbanBoard --template dataset --framework react
```

Ist `pac` nicht verfügbar, greift Regel 14: Übernahme des Werkzeugkettensatzes aus
`microsoft/PowerApps-Samples` mit gepinnter SHA. Kein Warten auf die CLI, kein handgeschriebenes
Ersatzprojekt.

Danach Neuimplementierung gegen die Zielstruktur. `PipelineKanban/` bleibt unverändert im Repo als
Referenz und wird **nicht** kopiert. Kein Baustein wird aus dem alten Control übernommen, weder
Datei noch Funktion noch CSS-Regel.

### Aufgabe 2: Fallback-Kette für die Optionsmetadaten

Ob die von `context.utils.getEntityMetadata` zurückgegebene Attributsdefinition die Optionsliste
mitführt, ist nicht dokumentiert und wird nicht vorab geklärt. Statt darauf zu warten, baut
`services/metadata.ts` eine Kette, die beide Fälle abdeckt:

1. `context.utils.getEntityMetadata` versuchen. Führt die Antwort Wert, Label und Farbe mit, ist
   das die Quelle.
2. Andernfalls der Metadaten-Endpunkt, gekapselt in `services/metadata.ts`, Ergebnis gecacht.
   Niemals ein roher `fetch` in einer Komponente.

Welcher Zweig greift, wird **einmalig** protokolliert, nicht bei jedem Aufruf. `docs/API-NOTES.md`
benennt beide Zweige und hält ausdrücklich fest, dass das empirische Ergebnis offen ist, bis es aus
einer echten Umgebung vorliegt.

Bleibt der Metadaten-Endpunkt der einzige Weg, greift der dokumentierte Ausnahmefall aus Regel 9
mit Eintrag in `docs/UNTYPED-APIS.md`.

**In keinem Fall** werden die Optionen aus den vorhandenen Datensätzen abgeleitet. Eine Spalte,
für die gerade kein Datensatz existiert, würde sonst fehlen, und genau die leere Spalte ist das
Ziel eines Kanban-Boards.

### Aufgabe 3: Fundament

- Konfiguration vollständig über `property-set` gemäß Zielbild. Die Freitext-Properties `groupByField` und `valueField` entfallen ersatzlos.
- Spaltenreihenfolge aus dem zurückgegebenen Options-Array, unsortiert, nach Regel 12.
- Optionsfarben als Spaltenakzent, mit lesbarem Kontrast gegen den Text.
- Labels werden getrimmt, bevor sie in den Spaltenkopf gehen.
- Kartentitel, Untertitel und Badge aus den gebundenen Spalten, mit Fallback auf den Primärnamen, wenn ein Wert leer ist.
- Alle sichtbaren Strings aus resx für 1033 und 1031.
- `updateView` liest alle Properties neu, kein Zustand aus `init` bleibt hängen.
- Der Fehlerzustand des Metadatenabrufs wird bei jedem Ladeversuch zurückgesetzt und bietet einen Wiederholversuch an.
- Unit-Tests für `grouping.ts`, einschließlich des Reihenfolge-Tests aus Regel 12.

**Definition of Done:** Board rendert im Harness mit CSV-Testdaten, gruppiert korrekt, Titel und Farben stimmen, `npm run build` und `npm run lint` grün, `CHANGELOG.md` gepflegt, Version auf `1.0.0`. Ab hier gilt Regel 10 uneingeschränkt.

## M2 Interaktion und Barrierefreiheit

- Drag über Pointer Events statt HTML5-Drag, damit Maus, Stift und Touch identisch funktionieren. Eigener Drag-Layer.
- Vollständige Tastaturbedienung: Karte fokussieren, Leertaste greift, Pfeiltasten verschieben zwischen Spalten und innerhalb der Spalte, Leertaste legt ab, Escape bricht ab.
- `role="list"` und `role="listitem"`, sichtbarer Fokusring, `aria-live`-Region, die jeden Verschiebevorgang und jedes Ergebnis ansagt.
- `prefers-reduced-motion` respektieren.
- Paging über `dataset.paging` mit sichtbarem Zähler je Spalte statt stiller Kürzung.
- `context.mode.trackContainerResize(true)` und Auswertung von `allocatedWidth` für horizontales Scrollen bei vielen Spalten.
- Optimistischer Zustand als Zustandsautomat `pending / confirmed / reverted`, aufgelöst gegen den Dataset-Refresh. Der Upstream-Leak ist damit behoben.
- **Randbedingung React 16.** Die Plattform stellt React 16 bereit, nicht 18. Das heißt: kein `createRoot`, kein `useSyncExternalStore`, kein automatisches Batching außerhalb von Event-Handlern. Der Zustandsautomat wird darauf ausgelegt und nicht auf Verhalten gebaut, das erst React 18 zusichert.
- Tests für `reconcile.ts` inklusive des Falls "Fremdänderung während Pending".

**Definition of Done:** Board ist ohne Maus vollständig bedienbar, Touch-Drag funktioniert, kein Zustandsverlust bei `updateView`, Tests grün.

## M0-CI Fließband

Einzuordnen vor M3. Der Meilenstein holt nach, was die Arbeitsumgebung nicht leisten kann.

- GitHub-Actions-Workflow, der bei **jedem Push** `npm ci`, `npm run build`, `npm run lint` und
  `npm test` ausführt. Rot bedeutet rot, kein `continue-on-error`.
- Solution-Packaging über `microsoft/powerplatform-actions`. Der Workflow erzeugt aus dem
  gebauten Control eine Solution und legt sie als Artefakt ab.
- `npm audit` als eigener Schritt. Funde, die aus `pcf-scripts` und dessen transitiven
  Abhängigkeiten stammen, werden **getrennt** ausgewiesen von Funden aus Abhängigkeiten, die
  dieses Repository selbst gewählt hat. Nur die zweite Gruppe ist unmittelbar zu verantworten;
  die erste wird beobachtet und beim Anheben von `pcf-scripts` erneut geprüft.
- `docs/CI.md`: was der Workflow tut, welche Secrets er braucht und wie ein Lauf zu lesen ist.

**`pac` läuft ausschließlich hier.** In der Arbeitsumgebung wird die Power Platform CLI weder
erwartet noch installiert noch nachgebildet. Wer lokal etwas braucht, das nur `pac` liefert,
verschiebt es hierher statt es zu umgehen. Damit ist auch geklärt, wo die im Manifest gepinnten
Versionsstrings der Platform Libraries nach Regel 2 ihre Bestätigung finden: im ersten grünen
Build dieses Workflows.

**Definition of Done:** Der Workflow läuft auf einem Push grün durch, Build, Lint und Test sind
darin nachweislich ausgeführt worden, das Solution-Artefakt liegt vor, `docs/CI.md` ist gepflegt.

## M3 Governance

- `context.utils.hasEntityPrivilege` vor dem Rendern: kein Anlegen-Button ohne Create-Recht, kein Drag ohne Write-Recht, stattdessen ein erklärender Hinweis.
- Anlegen mit Formularparametern über `context.navigation.openForm(options, parameters)`: Zielspalte auf den Spaltenwert vorbelegt, Parent-Lookup vorbelegt, wenn das Control in einem Subgrid sitzt. Der zweite Parameter heißt in PCF `parameters`, nicht `formParameters`; ungültige Parameter lösen einen Fehler aus. Für den Parent-Kontext gilt Regel 9, sofern er über ein untypisiertes Objekt kommt.
- Fehler und Rückfragen über `context.navigation.openErrorDialog` und `openConfirmDialog` statt `window.alert` und `window.confirm`.
- Rollback des optimistischen Zustands bei Serverablehnung: Der Zustandsautomat aus M2 geht auf `reverted`, die Karte kehrt sichtbar in ihre Ausgangsspalte zurück, und der Grund wird angesagt.
- `docs/GOVERNANCE.md`: welche clientseitige Logik ein Drag umgeht und wo die Grenze dieses Repos verläuft.

**Ausdrücklich außerhalb dieses Repos:** die serverseitige Durchsetzung auf `Update` der Tabelle. Ein Drag umgeht clientseitige Formularlogik; das lässt sich nur serverseitig schließen, und das ist nicht Teil dieses Controls. `docs/GOVERNANCE.md` benennt die Lücke, schließt sie aber nicht.

**Definition of Done:** Rechteprüfung greift, Anlegen erzeugt mit genau einem Schreibvorgang einen vollständigen Datensatz ohne Nacharbeit, eine Serverablehnung führt zu einem sichtbaren Rollback.

## M4 Kür

- WIP-Limits je Spalte über `wipLimits`, Überschreitung sichtbar und optional blockierend.
- Sortierung innerhalb der Spalte aus `dataset.sorting`.
- Optionale Swimlanes über eine zweite gebundene Spalte.
- Kartenlayout kompakt und ausführlich.

**Definition of Done:** Jedes Feature abschaltbar, Standardverhalten unverändert gegenüber M3.

---

# Arbeitsweise

1. Zuerst lesen, dann planen, dann schreiben. Vor der ersten Änderung eines Meilensteins legst du einen kurzen Plan vor und nennst offene Verifikationsfragen.
2. Bei jeder Unsicherheit über eine Plattform-API: WebFetch auf `learn.microsoft.com`, Ergebnis in `docs/API-NOTES.md` mit Link festhalten, dann erst implementieren.
3. Commits in kleinen Schritten, Präfix `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`. Kein Commit, der nicht baut.
4. Nach jedem Meilenstein: `npm run build`, `npm run lint`, `npm test`, danach Bericht mit geänderten Dateien, offenen Punkten und dem, was du bewusst nicht getan hast.

# Abbruchkriterien

Du stoppst und fragst nach, statt zu raten, wenn:

- eine benötigte API sich nicht gegen die Doku verifizieren lässt,
- das Manifest-Zielbild vom Schema abweicht,
- eine Änderung den Anwendungsfall Decision Assessments hart in den generischen Code ziehen würde,
- ein Meilenstein nur grün wird, indem eine der Regeln oben verletzt wird.
