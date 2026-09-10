---
description: Rebuild the Pipeline Kanban PCF fork into the Ayonto Kanban Board control
argument-hint: [audit|M1|M2|M3|M4]
allowed-tools: Read, Write, Edit, Glob, Grep, WebFetch, Bash(npm:*), Bash(node:*), Bash(npx:*), Bash(pac:*), Bash(git status:*), Bash(git diff:*), Bash(git log:*)
---

# Auftrag

Du baust den Fork von `jawadAli1234/pipeline-kanban` zu einem produktionsreifen Dataverse-Dataset-Control um: **Ayonto Kanban Board**.

Zielumgebung ist eine Governance-Lösung bei 50Hertz (Power Platform, Dataverse only, kein Dynamics 365). Der erste Anwendungsfall sind Decision Assessments, gruppiert nach einer Choice-Spalte, mit dem Assessor als Kartentitel. Das Control muss aber generisch bleiben und darf nirgends auf diesen Anwendungsfall hart verdrahtet werden.

Ausgeführter Meilenstein: `$ARGUMENTS`. Ohne Argument führst du `audit` aus.

---

# Nicht verhandelbare Regeln

1. **Ein Meilenstein pro Aufruf.** Nach Abschluss stoppst du, berichtest und wartest. Kein Vorgriff auf den nächsten Meilenstein.
2. **Keine erfundenen APIs.** Jede PCF-, Client-API- oder Manifest-Aussage, die du nicht bereits im Repo verifiziert hast, prüfst du per WebFetch gegen `learn.microsoft.com`, bevor du sie verwendest. Findest du keine Bestätigung, implementierst du sie nicht, sondern meldest die offene Frage.
3. **Keine erfundenen Logikalnamen.** Die im Abschnitt "Verifizierte Ausgangslage" genannten Namen sind autoritativ. Alles andere kommt zur Laufzeit aus Metadaten oder aus der Maker-Konfiguration, niemals aus einer Annahme im Code.
4. **Kein `innerHTML` mit Daten.** Datensatzinhalte, Optionslabels und Feldwerte gehen ausschließlich durch React. Kein `dangerouslySetInnerHTML`.
5. **Keine Kommentare im ausgelieferten Code.** Erklärungen gehören in `docs/` und `CHANGELOG.md`, nicht zwischen die Zeilen.
6. **Changelog separat.** Jede Änderung wird in `CHANGELOG.md` nach Keep-a-Changelog geführt. Die Manifest-Version wird bei jedem Meilenstein erhöht.
7. **"50Hertz" wird immer vollständig ausgeschrieben**, nie abgekürzt. Weder in Code, Doku, Commit-Messages noch in Strings.
8. **Namespace ist `Ayonto`**, nicht `Contoso`.
9. **TypeScript strict.** Kein `any` außer für dokumentiert untypisierte Plattform-Objekte, dann mit lokalem Interface und einem Eintrag in `docs/UNTYPED-APIS.md`.
10. **Jeder Meilenstein endet grün.** `npm run build` und `npm run lint` müssen fehlerfrei durchlaufen, sonst ist der Meilenstein nicht fertig.
11. **Du fasst keine fremde Solution an.** Die TaskandDecision-Lösung ist nicht Teil dieses Repos und wird nicht verändert.

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
- `openForm` ohne `formParameters`, dadurch keine Vorbelegung von Zielspalte und Parent-Lookup

---

# Zielarchitektur

**Konfiguration über `property-set` statt Freitextfelder.** Der Maker wählt Spalten aus, statt Logikalnamen zu tippen. Das ist der Kern des Umbaus: Tippfehler, falsche Feldtypen und "Spalte fehlt in der View" werden strukturell unmöglich.

**Manifest-Zielbild** (Versionsstrings der Platform Libraries gegen die aktuelle Doku prüfen und ggf. korrigieren):

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

  <property name="writeMode"     of-type="Enum"            usage="input" />
  <property name="customApiName" of-type="SingleLine.Text" usage="input" required="false" />
  <property name="wipLimits"     of-type="SingleLine.Text" usage="input" required="false" />
  <property name="allowDrag"     of-type="TwoOptions"      usage="input" />

  <resources>
    <code path="index.ts" order="1" />
    <platform-library name="React" version="16.8.6" />
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

- Umstellung auf `control-type="virtual"` mit React und Fluent als Platform Libraries.
- Konfiguration vollständig über `property-set` gemäß Zielbild. Die Freitext-Properties `groupByField` und `valueField` entfallen ersatzlos.
- Optionsmetadaten über `context.utils.getEntityMetadata` statt Roh-`fetch`.
- Spaltenreihenfolge aus der konfigurierten Optionset-Reihenfolge, nicht nach numerischem Wert.
- Optionsfarben aus den Metadaten als Spaltenakzent, mit lesbarem Kontrast gegen den Text.
- Labels werden getrimmt, bevor sie in den Spaltenkopf gehen.
- Kartentitel, Untertitel und Badge aus den gebundenen Spalten, mit Fallback auf den Primärnamen, wenn ein Wert leer ist.
- Alle sichtbaren Strings aus resx für 1033 und 1031.
- `updateView` liest alle Properties neu, kein Zustand aus `init` bleibt hängen.
- Unit-Tests für `grouping.ts`.

**Definition of Done:** Board rendert im Harness mit CSV-Testdaten, gruppiert korrekt, Titel und Farben stimmen, `npm run build` und `npm run lint` grün, `CHANGELOG.md` gepflegt, Version auf `1.0.0`.

## M2 Interaktion und Barrierefreiheit

- Drag über Pointer Events statt HTML5-Drag, damit Maus, Stift und Touch identisch funktionieren. Eigener Drag-Layer.
- Vollständige Tastaturbedienung: Karte fokussieren, Leertaste greift, Pfeiltasten verschieben zwischen Spalten und innerhalb der Spalte, Leertaste legt ab, Escape bricht ab.
- `role="list"` und `role="listitem"`, sichtbarer Fokusring, `aria-live`-Region, die jeden Verschiebevorgang und jedes Ergebnis ansagt.
- `prefers-reduced-motion` respektieren.
- Paging über `dataset.paging` mit sichtbarem Zähler je Spalte statt stiller Kürzung.
- `context.mode.trackContainerResize(true)` und Auswertung von `allocatedWidth` für horizontales Scrollen bei vielen Spalten.
- Optimistischer Zustand als Zustandsautomat `pending / confirmed / reverted`, aufgelöst gegen den Dataset-Refresh. Der Upstream-Leak ist damit behoben.
- Tests für `reconcile.ts` inklusive des Falls "Fremdänderung während Pending".

**Definition of Done:** Board ist ohne Maus vollständig bedienbar, Touch-Drag funktioniert, kein Zustandsverlust bei `updateView`, Tests grün.

## M3 Governance

- Property `writeMode` mit den Werten `webapi` und `customapi`. Bei `customapi` wird eine Dataverse Custom API mit Datensatz-ID, Zielspalte und Zielwert aufgerufen, sodass Validierung serverseitig greift und für Formular und Board identisch ist.
- `context.utils.hasEntityPrivilege` vor dem Rendern: kein Anlegen-Button ohne Create-Recht, kein Drag ohne Write-Recht, stattdessen ein erklärender Hinweis.
- Anlegen mit `formParameters`: Zielspalte auf den Spaltenwert vorbelegt, Parent-Lookup vorbelegt, wenn das Control in einem Subgrid sitzt. Für den Parent-Kontext gilt Regel 9, das Objekt ist untypisiert.
- Fehler und Rückfragen über `context.navigation.openErrorDialog` und `openConfirmDialog` statt `window.alert` und `window.confirm`.
- `docs/GOVERNANCE.md`: welche clientseitige Logik ein Drag umgeht und wie `customapi` das schließt.

**Definition of Done:** Beide Schreibmodi nachweislich funktionsfähig, Rechteprüfung greift, Anlegen erzeugt einen vollständigen Datensatz ohne Nacharbeit.

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
