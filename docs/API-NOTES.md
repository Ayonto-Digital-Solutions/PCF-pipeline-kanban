# API-Notizen

Verifikationsprotokoll nach Regel 2. Jede hier festgehaltene Aussage wurde gegen die
Primärdokumentation geprüft und muss in späteren Meilensteinen nicht erneut nachgeschlagen werden.
Was hier nicht steht, ist nicht verifiziert.

## Verifikationsweg

`learn.microsoft.com` ist in dieser Ausführungsumgebung durch die Egress-Policy gesperrt (HTTP 403
am CONNECT-Tunnel). Geprüft wurde deshalb gegen das öffentliche Quell-Repository, aus dem Learn
diese Seiten rendert:

- Repository `MicrosoftDocs/powerapps-docs`, Commit `a76d0d1`
- Pfad `powerapps-docs/developer/component-framework/`
- Abruf am 10.09.2026

Pfadabbildung: `powerapps-docs/developer/component-framework/<pfad>.md` entspricht
`https://learn.microsoft.com/en-us/power-apps/developer/component-framework/<pfad>`.

---

## Manifest-Schema

### `control`
[Learn](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/control)

- Pflicht: `namespace`, `constructor`, `display-name-key`, `version`.
- `control-type` ist optional; `virtual` kennzeichnet ein React-Control auf Basis der
  Plattform-React-Bibliothek.
- Kindelemente: `data-set` (0..n), `external-service-usage` (0..1), `property` (0..n),
  `resources` (genau 1), `type-group` (0..n), `property-dependencies` (0..n),
  `platform-action` (0..1).
- Anmerkung der Dokumentation: „Changing this value does not convert a component from one type to
  another." Das Umschalten auf `virtual` allein wandelt nichts um.
- Widerspruch in der Dokumentation: Diese Seite (Stand 24.03.2025) nennt virtuelle Controls Public
  Preview, `react-controls-platform-libraries` (Stand 10.10.2025) spricht von einem GA-Release.
  Ungeklärt.

### `property-set`
[Learn](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/property-set)

- Parent ist `dataset`.
- `name` und `display-name-key` sind Pflicht, `usage` ist ebenfalls Pflicht.
- `usage` akzeptiert `bound` oder `input`. `bound` bedeutet, die Komponente darf die Spalte ändern;
  `input` bedeutet lesenden Zugriff.
- **`of-type-group` ist zulässig** und benennt eine im Manifest definierte `type-group`.
- `of-type` und `required` sind optional, nur für modellgesteuerte Apps.
- Die Seite führt `types` als Kindelement (0..n). Die Seite `types` selbst nennt jedoch nur
  `property` als Parent. Inkonsistenz; für das Zielbild irrelevant, da `of-type-group` verwendet wird.

### `type-group` und `type`
[Learn type-group](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/type-group) ·
[Learn type](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/type)

- **Parent von `type-group` ist `control`**, nicht `data-set`. Mindestens ein `type`-Kind.
- Auflösung in Canvas-Apps: nur drei Gruppen sind auflösbar – Strings, Numbers, Dates. Enthält eine
  `type-group` einen Typ außerhalb dieser Gruppen oder mischt sie Gruppen, gewinnt **der zuerst
  gelistete Typ**. Für modellgesteuerte Apps spielt das keine Rolle.
- Das `type`-Element ist laut Dokumentation nur für modellgesteuerte Apps verfügbar.

### Zulässige `of-type`-Werte
[Learn type](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/type)

Für das Zielbild relevant und bestätigt: `Currency`, `DateAndTime.DateOnly`, `Enum`,
`Lookup.Simple`, `OptionSet`, `SingleLine.Text`, `TwoOptions`.

- **`Lookup.Simple`**: nur modellgesteuerte Apps. Beschreibung: „Allows for a single reference to a
  specific table. All custom lookups are this type."
- **Warnung der Dokumentation**: Enthält das Manifest mindestens ein Dataset, sollen Properties vom
  Typ `Lookup.Simple` in das `data-set`-Element eingebettet werden.
- **`Enum`** benötigt `<value>`-Kinder. Dokumentiertes Beispiel:
  ```xml
  <property name="YesNo" display-name-key="YesNo_Display_Key" of-type="Enum" usage="input" required="false">
    <value name="Yes" display-name-key="Yes">0</value>
    <value name="No" display-name-key="No">1</value>
  </property>
  ```
- Nicht unterstützt: `Lookup.Customer`, `Lookup.Owner`, `Lookup.PartyList`, `Lookup.Regarding`,
  `Status`, `Status Reason`, `Whole.Duration`, `Whole.Language`, `Whole.TimeZone`, Dateispalten.

### `platform-library`
[Learn](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/platform-library)

`name` akzeptiert ausschließlich `React` oder `Fluent`. Zulässige Versionen laut
[React controls & platform libraries](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/react-controls-platform-libraries):

| Bibliothek | npm-Paket | Zulässiger Bereich | Geladene Version |
| --- | --- | --- | --- |
| React | `react` | `16.14.0` | 17.0.2 (modellgesteuert), 16.14.0 (Canvas) |
| Fluent | `@fluentui/react` | `8.29.0` | 8.29.0 |
| Fluent | `@fluentui/react` | `8.121.1` | 8.121.1 |
| Fluent | `@fluentui/react-components` | `>=9.4.0 <=9.46.2` | 9.68.0 |

Fluent 8 und Fluent 9 dürfen nicht gemeinsam in einem Manifest stehen. Wird Fluent nicht genutzt,
soll das `platform-library`-Element für Fluent entfernt werden.

**Ein bestehendes Standard-Control lässt sich nicht in ein React-Control umwandeln.** Die
Dokumentation beantwortet das in der FAQ mit Nein und verlangt ein neues Projekt über
`pac pcf init … -fw react`, in das Manifest und `index.ts` portiert werden.

### `resources`, `css`, `resx`
[Learn resources](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/resources) ·
[Learn resx](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/resx)

- `resources` erlaubt `code` (genau 1), `css` (0..n), `img` (0..n), `resx` (0..n),
  `platform-library` (0..n), `dependency` (0..n). `css` und `platform-library` schließen sich nicht aus.
- `resx` verlangt `path` und `version`, beide Pflicht. Dokumentiertes Namensschema:
  `strings/<Name>.<LCID>.resx`.

### `data-set` und `feature-usage`
[Learn data-set](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/data-set) ·
[Learn feature-usage](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/feature-usage)

- `data-set` führt `cds-data-set-options` als Pflichtattribut für modellgesteuerte Apps. Das heutige
  Control liefert ohne dieses Attribut aus – ungeklärt, gegen `pac pcf push` zu prüfen.
- `feature-usage` nennt `control` als Parent; die Kindliste in `control` führt es nicht auf.
  Inkonsistenz ohne praktische Folge.

---

## Laufzeit-API

### Lebenszyklus eines React-Controls
[Learn init](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/react-control/init) ·
[Learn updateView](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/react-control/updateview)

- `init(context, notifyOutputChanged, state)` – **kein** `container`-Parameter.
- `updateView(context)` gibt ein `React.ReactElement` zurück.
- `trackContainerResize` soll in `init` aufgerufen werden, vor jedem Zugriff auf `allocatedWidth`
  oder `allocatedHeight`.
- An `updateView` übergebene Werte können null sein, solange die Daten nicht bereit sind.

### `context.utils`
[Learn getEntityMetadata](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/utility/getentitymetadata) ·
[Learn hasEntityPrivilege](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/utility/hasentityprivilege)

- `getEntityMetadata(entityName, attributes?)` → `Promise<EntityMetadata>`.
  `EntityMetadata` enthält `attributeNames`, `displayName`, `logicalName`, `primaryIdAttribute`,
  `primaryNameAttribute`, `metadata` (Dictionary von `AttributeMetadata`) und `privilegesByType`.
- `AttributeMetadata` enthält `DefaultValue`, `DisplayName`, `IsEditable`, `LogicalName`,
  `MaxLength`, `RequiredLevel`, `Type` – **keine** Options-Eigenschaft.
- `hasEntityPrivilege(entityTypeName, privilegeType, privilegeDepth)` → `boolean`.
  `privilegeType`: None 0, Create 1, Read 2, Write 3, Delete 4, Assign 5, Share 6, Append 7,
  AppendTo 8. `privilegeDepth`: None -1, Basic 0, Local 1, Deep 2, Global 3.
  **Liefert `false`, wenn die Metadaten nicht lokal zwischengespeichert sind.** Vorher
  `await context.utils.getEntityMetadata(entityTypeName)` aufrufen.

### Optionsmetadaten
[Learn OptionDescriptor](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/optiondescriptor) ·
[Learn Property](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/property)

- `OptionDescriptor` hat `Color` (string), `Label` (string), `Value` (number), `DefaultStatus`,
  `State`, `TransitionData`, `InvariantName`, `ParentValues`. Die Optionsfarbe ist damit erreichbar.
- Dokumentierter Weg dorthin: `ControlAttributes.OptionSet`. `ControlAttributes` ist als Typ von
  `Type`, `Precision`, `PrecisionSource`, `Format`, `Behavior`, `OptionSet` dokumentiert.
- `property.attributes` (Typ `FieldPropertyMetadata`) ist **nur gesetzt, wenn `usage="bound"`**.
  Dasselbe gilt für `property.formatted` und `property.security`.
- `FieldPropertyMetadata` hat keine eigene Dokumentationsseite. Fällt bei Verwendung unter Regel 9
  und gehört dann nach `docs/UNTYPED-APIS.md`.
- **Nicht verifiziert:** dass die Optionen in konfigurierter statt numerischer Reihenfolge geliefert
  werden. Am Harness zu prüfen, bevor M1 darauf baut.

### Dataset
[Learn DataSet](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/dataset) ·
[Learn Paging](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/paging)

- Eigenschaften: `columns`, `error`, `errorMessage`, `filtering`, `linking`, `loading`, `paging`,
  `records`, `sortedRecordIds`, `sorting`.
- `sorting` ist `SortStatus[]`, nur für Dataverse. Neusetzen der Sortierung setzt `filtering` zurück.
- `paging`: `firstPageNumber`, `hasNextPage`, `hasPreviousPage`, `lastPageNumber`, `pageNumber`,
  `pageSize`, `totalResultCount`. **`totalResultCount` ist `-1`, wenn kein Wert verfügbar ist.**
- Methoden: `loadExactPage`, `loadNextPage`, `loadPreviousPage`, `reset`, `setPageSize`.
- **`loadExactPage`, `loadNextPage` und `loadPreviousPage` unterstützen keine parallele Ausführung.**
  Jeder Aufruf löst `updateView` aus. Seitenwechsel müssen serialisiert werden.

### Layout
[Learn trackContainerResize](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/mode/trackcontainerresize) ·
[Learn updatedProperties](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/updatedproperties)

- `context.mode.trackContainerResize(true)` schaltet `allocatedWidth` und `allocatedHeight` im
  `updateView` frei.
- In modellgesteuerten Apps liefert `updateView` eine Pixelbreite in `allocatedWidth`, während
  `allocatedHeight` **stets `-1`** ist. In `init` sind beide `-1`.
- **Im Test-Harness (`npm start`) kommen beide Werte als String statt als Zahl**, ohne Wert als
  Leerstring statt `-1`. Für TypeScript strict relevant.
- Die Dokumentation hält Container-Tracking für Dataset-Komponenten in modellgesteuerten Apps für
  nicht notwendig und empfiehlt stattdessen `height: 100%` und `width: 100%`.
- `context.updatedProperties` enthält für modellgesteuerte Apps `layout` und `dataset`.

### Navigation
[Learn openForm](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/navigation/openform) ·
[Learn EntityFormOptions](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/entityformoptions) ·
[Learn openErrorDialog](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/navigation/openerrordialog) ·
[Learn openConfirmDialog](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/navigation/openconfirmdialog)

- **`context.navigation.openForm(options, parameters)`** – der zweite Parameter heißt `parameters`,
  nicht `formParameters`. Er ist ein Dictionary; **ungültige Parameter lösen einen Fehler aus**.
- Rückgabe: `Promise<OpenFormSuccessResponse>` mit einem Array `savedEntityReference`. Der im
  Upstream verwendete Zugriff `response.savedEntityReference[0]` ist damit dokumentiertes Verhalten
  und kein Defekt.
- `EntityFormOptions`: `createFromEntity` (`LookupValue`), `entityId`, `entityName`, `formId`,
  `height`, `openInNewWindow`, `useQuickCreateForm`, `width`, `windowPosition` (1 zentriert, 2 seitlich).
- **`createFromEntity`** belegt Standardwerte über gemappte Spalten vor. Typisierter Weg für den
  Parent-Bezug, ohne Zugriff auf ein untypisiertes Kontextobjekt.
- `openErrorDialog(options)` → `Promise`. `ErrorDialogOptions`: `details`, `errorCode`, `message`;
  `errorCode` oder `message` ist Pflicht.
- `openConfirmDialog(confirmStrings, options?)` → `Promise<ConfirmDialogResponse>` mit `confirmed`.
  `ConfirmDialogStrings`: `title`, `subtitle`, `text`, `confirmButtonLabel`, `cancelButtonLabel`.

### WebAPI
[Learn WebAPI](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/webapi)

`context.webAPI` hat **genau fünf** Methoden: `createRecord`, `deleteRecord`,
`retrieveMultipleRecords`, `retrieveRecord`, `updateRecord`.

**Es gibt kein `execute`.** Eine Volltextsuche über die gesamte Component-Framework-Dokumentation
liefert null Treffer für „Custom API" und für `webAPI.execute`. Der in M3 vorgesehene
`customapi`-Schreibmodus hat damit keinen dokumentierten Weg und ist vor M3 zu klären.

`context.webAPI` steht in Canvas-Apps nicht zur Verfügung.

### Lokalisierung
[Learn getString](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/resources/getstring)

`context.resources.getString(id)`, verfügbar in modellgesteuerten und Canvas-Apps.
`context.resources.getResource` ist nur für modellgesteuerte Apps verfügbar.

---

## Die Fallback-Kette für die Optionsmetadaten

Umgesetzt in `KanbanBoard/services/metadata.ts`. Sie existiert, weil die Dokumentation eine Frage
offenlässt und wir sie nicht durch eine Annahme ersetzen.

**Die offene Frage.** `OptionDescriptor` mit `Value`, `Label` und `Color` ist dokumentiert.
`ControlAttributes.OptionSet` ist als Weg dorthin dokumentiert. `EntityMetadata.metadata` ist als
`Dictionary<AttributeMetadata>` dokumentiert, und `AttributeMetadata` führt **keine**
Options-Eigenschaft. Ob die von `context.utils.getEntityMetadata` zurückgegebene
Attributsdefinition zur Laufzeit trotzdem eine Optionsliste mitführt, sagt die Dokumentation
nirgends. **Das empirische Ergebnis steht aus**, bis es aus einer echten Umgebung vorliegt; im
Test-Harness lässt es sich nicht beantworten.

**Zweig 1, bevorzugt.** `context.utils.getEntityMetadata(entityName, [attributeName])`. Aus der
Antwort wird `metadata[attributeName].OptionSet` gelesen. Der Zweig gilt als tragfähig, wenn eine
nicht leere Optionsliste gefunden wird **und jeder** Eintrag einen endlichen numerischen `Value`,
ein `Label` als Zeichenkette oder in der `UserLocalizedLabel`-Form, und eine vorhandene
`Color`-Eigenschaft trägt. `Color` darf `null` sein, fehlen darf sie nicht. Wirft der Aufruf, gilt
das als Fehlanzeige, nicht als Fehler.

**Zweig 2, nur bei Fehlanzeige.** Der Metadaten-Endpunkt, gekapselt in `services/metadata.ts` und
nirgends sonst. Ein roher `fetch` in einer Komponente bleibt ausgeschlossen.

**Gemeinsam für beide Zweige.** Das Ergebnis wird je `entityName:attributeName` zwischengespeichert.
Welcher Zweig gegriffen hat, wird **einmalig** protokolliert, nicht bei jedem Aufruf. Liefert kein
Zweig Optionen, wirft der Dienst. Eine leere Optionsliste gilt als Fehlanzeige, nicht als Ergebnis.

**In keinem Zweig** werden Optionen aus den vorhandenen Datensätzen abgeleitet. Eine Spalte, für die
gerade kein Datensatz existiert, würde sonst fehlen, und genau die leere Spalte ist das Ziel eines
Kanban-Boards.

---

## Dokumentierte Vorgaben, die den Umbau betreffen
[Learn Best practices](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/code-components-best-practices)

- Netzwerkressourcen wie Metadaten in `init` anfordern, nicht erst in `updateView`. Solange die
  Antwort aussteht, muss die Komponente einen Ladezustand anzeigen.
- Ressourcen in `destroy` aufräumen. Bei React `ReactDOM.unmountComponentAtNode`.
- `refresh()` auf einer Dataset-Property nicht unnötig aufrufen.
- Aufrufe an `context.webAPI` in Anzahl und Nutzlast begrenzen; jeder Aufruf zählt gegen API-
  Kontingente und Service-Protection-Grenzen.
- **Nicht von `formContext` abhängen.** Code-Komponenten müssen über modellgesteuerte Apps,
  Canvas-Apps und Dashboards hinweg funktionieren.
- Keine undokumentierten internen Methoden auf `ComponentFramework.Context` verwenden. Zugriff auf
  das Host-DOM außerhalb der Komponentengrenze ist nicht unterstützt.
- Barrierefreiheit: Tastaturalternativen zu Maus- und Touch-Ereignissen bereitstellen, ARIA-
  Attribute setzen, damit Screenreader die Oberfläche korrekt ansagen.
- CSS auf die Komponente scopen, über die automatisch erzeugte Klasse am Container-DIV, Schema
  `.Namespace\.ControlName`.
- Keine Web-Storage-Objekte (`localStorage`, `sessionStorage`) verwenden.
- Netzwerkaufrufe immer asynchron.
