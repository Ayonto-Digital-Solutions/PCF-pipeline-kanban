# Audit: Fork `pipeline-kanban` → Ayonto Kanban Board

Meilenstein `audit`. Kein Code geändert.

Geprüft wurde der vollständige Repo-Stand auf Commit `9099fae` (`PipelineKanban/index.ts`,
`PipelineKanban/ControlManifest.Input.xml`, `PipelineKanban/css/PipelineKanban.css`,
`README.md`, `DEPLOYMENT.md`, `.gitignore`). Alle Zeilenangaben beziehen sich auf diesen Stand.

## Zur Verifikationsquelle

Regel 2 verlangt die Prüfung jeder Plattformaussage gegen `learn.microsoft.com`. Dieser Host ist in
der Ausführungsumgebung durch die Egress-Policy gesperrt (HTTP 403 am CONNECT-Tunnel, sowohl über
WebFetch als auch über curl). Die Policy wird nicht umgangen.

Stattdessen wurde gegen das öffentliche Quell-Repository der Learn-Seiten geprüft:
`MicrosoftDocs/powerapps-docs`, Commit `a76d0d1`, Pfad `powerapps-docs/developer/component-framework/`.
Learn rendert seine Seiten aus genau diesen Dateien, die Inhalte sind also identisch. Jede
Verifikation unten nennt die zugehörige Learn-URL. Wo die Dokumentation eine Frage nicht beantwortet,
steht das ausdrücklich als „nein" in der Spalte, nicht als Vermutung.

---

## 1. Die zwölf gelisteten Upstream-Defekte

Alle zwölf sind bestätigt. Keiner war bereits behoben.

| # | Defekt | Fundstelle | Schweregrad | Meilenstein |
| --- | --- | --- | --- | --- |
| 1 | `innerHTML` mit ungeescapten Datensatzwerten und Optionslabels | `index.ts:107` (Fehlertext), `index.ts:190-198` (Optionslabel Z. 192, Summe Z. 195), `index.ts:221-224` (Kartentitel Z. 222, Feldwert Z. 223) | Kritisch | M1 |
| 2 | `groupByField` nur in `init()` gelesen, nie in `updateView()` | gesetzt `index.ts:47-49`, `updateView` `index.ts:55-58` liest keine Property neu | Hoch | M1 |
| 3 | `pendingOverrides[recordId]` bei Erfolg nie gelöscht | gesetzt `index.ts:270`, gelöscht nur im Fehlerpfad `index.ts:279`, gelesen `index.ts:151` | Hoch | M2 |
| 4 | `container.innerHTML = ""` und Vollaufbau bei jedem `updateView` | `index.ts:143-144`, zusätzlich `index.ts:107` und `index.ts:65` | Hoch | M1 |
| 5 | Rohes `fetch("/api/data/v9.2/...")` statt Plattform-API | `index.ts:72-79` | Hoch | M1 |
| 6 | Keine Auswertung von `dataset.paging` | repo-weit null Treffer auf `paging` | Hoch | M2 |
| 7 | Ausschließlich HTML5-Drag-Events, kein Touch | `index.ts:210`, `index.ts:226-230`, `index.ts:241-251` | Hoch | M2 |
| 8 | Keine ARIA-Rollen, keine Tastaturbedienung, `window.alert` / `window.confirm` | null Treffer auf `role=`, `aria`, `tabindex`, `focus`; `window.confirm` `index.ts:263`, `window.alert` `index.ts:280` und `index.ts:302` | Kritisch | M2 |
| 9 | Spaltenreihenfolge nach numerischem Optionswert | `index.ts:91` (`.sort((a, b) => a.value - b.value)`) | Mittel | M1 |
| 10 | Optionsfarben werden ignoriert | Interface ohne `Color` `index.ts:11-14`, Projektion ohne `Color` `index.ts:86-91` | Mittel | M1 |
| 11 | Alle Strings hart englisch im Code | `index.ts:51`, `97`, `115`, `119`, `135`, `197`, `214`, `263`, `280`, `302`; zusätzlich im Manifest `ControlManifest.Input.xml:4`, `11`, `18` (Literaltext in `display-name-key` statt resx-Schlüssel) | Mittel | M1 |
| 12 | `openForm` ohne Parameterobjekt, keine Vorbelegung | `index.ts:287`; die Nachkorrektur `index.ts:294-303` ist der Workaround, `README.md:49` dokumentiert ihn als bekannte Einschränkung | Hoch | M3 |

Zu Defekt 9 gehört ein Widerspruch im Code selbst: der Kommentar `index.ts:132-133` behauptet
„in the Option Set's own defined order", während `index.ts:91` numerisch sortiert. Der Kommentar
beschreibt das Zielverhalten, nicht das implementierte.

---

## 2. Zusätzlich gefundene Defekte

### Kritisch

| # | Defekt | Fundstelle | Meilenstein |
| --- | --- | --- | --- |
| Z1 | **Es gibt kein npm-Projekt.** Kein `package.json`, `tsconfig.json`, `pcfconfig.json`, `.pcfproj`, keine ESLint-Konfiguration. `npm run build` bricht mit `ENOENT` ab, `npm run lint` und `npm test` existieren nicht. Regel 10 ist im aktuellen Zustand nicht erfüllbar. Zusätzlich importiert `index.ts:1` aus `./generated/ManifestTypes`, und `generated/` ist per `.gitignore:5` ausgeschlossen, existiert also nirgends. Der Fork ist ein Dateisatz zum Hineinkopieren in ein andernorts erzeugtes Projekt, kein baubares Projekt. `README.md:32-38` und `DEPLOYMENT.md:45-51` sagen das auch so. | Repo-Wurzel | M1, zwingend zuerst |
| Z2 | Namespace ist `Contoso`, Regel 8 verlangt `Ayonto` | `ControlManifest.Input.xml:3` | M1 |

### Hoch

| # | Defekt | Fundstelle | Meilenstein |
| --- | --- | --- | --- |
| Z3 | `columnsLoadFailed` wird nie zurückgesetzt. Nach einem einzigen fehlgeschlagenen Metadatenabruf kehrt `render()` dauerhaft früh zurück, das Board bleibt bis zum Neuladen der Seite tot. Kein Wiederholungspfad. | gesetzt `index.ts:95`, geprüft `index.ts:111`, deklariert `index.ts:31` | M1 |
| Z4 | `loadColumns()` wird in `init()` ohne `await` und ohne Abbruchmöglichkeit gestartet. Löst die Promise nach `destroy()` auf, rendert sie in einen abgehängten Container. | Start `index.ts:52`, Auflösung `index.ts:101`, `destroy` `index.ts:64-66` | M1 |
| Z5 | Anlegen erzeugt zwei Schreibvorgänge: Quick Create plus nachgelagertes `updateRecord`. Im Zielszenario feuert das den Cloud Flow auf `eo_progress` ein zweites Mal, und der Datensatz existiert kurzzeitig mit falschem Spaltenwert. Zudem läuft die clientseitige Business Rule nur auf dem Formular, sieht den nachträglich gesetzten Wert also nie. | `index.ts:285-307` | M3 |
| Z6 | Der Kartentitel ist fest der Primärname aus `getNamedReference().name`, nicht konfigurierbar. Im Zielszenario ist der Primärname `eo_key`, eine Autonummer `ASM-00001`. Die Karten zeigen damit Nummern statt des Assessors. Genau das ist der Grund für `cardTitle` im Zielbild. | `index.ts:213-214` | M1 |
| Z7 | `getValue(this.groupByField)` setzt voraus, dass die Spalte in der gebundenen View liegt. Fehlt sie, liefert `getValue` null und **alle** Datensätze landen stumm in „Unassigned" – ohne Fehlermeldung. Der Maker sieht ein plausibel aussehendes, falsches Board. | `index.ts:152` | M1, strukturell durch `property-set` behoben |

### Mittel

| # | Defekt | Fundstelle | Meilenstein |
| --- | --- | --- | --- |
| Z8 | Kommentare im ausgelieferten Code, Regel 5 | `index.ts:33-34`, `68`, `104`, `132-133`, `154-159`, `257`, `261-262`, `289-293`, `309` | M1 |
| Z9 | `refresh()` nach jeder einzelnen Verschiebung und nach jedem Anlegen. Die Dokumentation nennt genau das als zu vermeiden. | `index.ts:277`, `index.ts:305` | M2 |
| Z10 | `-1` wird als In-Band-Sentinel für „Unassigned" benutzt und ist damit nicht von einem echten Optionswert `-1` unterscheidbar. Ob Dataverse negative Optionswerte vergibt, ist nicht verifiziert; ein Sentinel außerhalb des Wertebereichs ist unabhängig davon die robustere Lösung. | `index.ts:134-135`, `166`, `260`, `275`, `298` | M1 |
| Z11 | `.pk-col-total` erreicht **3,91:1** Kontrast (`#1F8A70` auf `#F4F5F8`) bei 12px Schrift. WCAG AA verlangt 4,5:1. Gemessen, nicht geschätzt. | `css/PipelineKanban.css:65-70` | M1 |
| Z12 | Keine `:focus`- oder `:focus-visible`-Regel im gesamten Stylesheet. Ohne sichtbaren Fokusring ist die in M2 geforderte Tastaturbedienung nicht wahrnehmbar. | `css/PipelineKanban.css`, null Treffer | M2 |
| Z13 | `uses-feature name="Utility"` ist als `required="true"` deklariert, `context.utils` wird aber nirgends verwendet. Die Deklaration ist unbegründet. | `ControlManifest.Input.xml:31` gegen null Treffer auf `context.utils` | M1 |
| Z14 | CSS ist nicht auf die generierte Control-Klasse begrenzt. Die `pk-`-Präfixe machen eine Kollision unwahrscheinlich, die dokumentierte Vorgabe lautet aber, auf `.Namespace\.ControlName` zu scopen. | `css/PipelineKanban.css` durchgehend | M1 |
| Z15 | `transition` ohne `prefers-reduced-motion`-Ausnahme | `css/PipelineKanban.css:77`, `93` | M2 |
| Z16 | Kein `touch-action` auf der Karte. Zusammen mit Defekt 7 ist Touch-Bedienung nicht nur unvollständig, sondern kollidiert mit dem Scrollen der Spalte. | `css/PipelineKanban.css:85-94` | M2 |
| Z17 | `toLocaleString(undefined, ...)` nutzt die Browser-Locale statt der Dataverse-Benutzereinstellungen. Zahl- und Währungsformat weichen damit vom Rest der Anwendung ab. | `index.ts:187` | M1 |

### Niedrig

| # | Defekt | Fundstelle | Meilenstein |
| --- | --- | --- | --- |
| Z18 | `notifyOutputChanged` wird gespeichert, aber nie aufgerufen; `getOutputs()` gibt konstant `{}` zurück. Toter Code. | `index.ts:23`, `44`, `60-62` | M1 |
| Z19 | `data-drop-target` und `data-add-to` werden gesetzt, aber nie gelesen. Die Handler arbeiten über Closures. | `index.ts:196-197` | M1 |
| Z20 | CSS-Variable `--pk-slate-soft` ist definiert und wird null Mal verwendet. | `css/PipelineKanban.css:5` | M1 |

---

## 3. Benötigte Plattform-APIs und ihr Verifikationsstand

| API | Gebraucht für | Verifiziert | Ergebnis | Link |
| --- | --- | --- | --- | --- |
| `control-type="virtual"` | M1 | ja | Gültig. Die Dokumentation bezeichnet virtuelle Controls an einer Stelle als Public Preview, an anderer als GA. Siehe Offene Punkte. | [control](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/control) |
| `platform-library` React / Fluent | M1 | ja | Zulässige Bereiche: React genau `16.14.0`, Fluent 9 `>=9.4.0 <=9.46.2`. | [platform-library](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/platform-library) |
| `property-set` mit `of-type-group` | M1 | ja | `of-type-group` ist ein zulässiges Attribut auf `property-set`. `usage` ist Pflicht und akzeptiert `bound` oder `input`. | [property-set](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/property-set) |
| `type-group` / `type` | M1 | ja | Kind von `control`, nicht von `data-set`. `Lookup.Simple` ist gültig, ausschließlich für modellgesteuerte Apps. | [type-group](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/type-group), [type](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/type) |
| `of-type="Enum"` | M3 | ja | Gültig, benötigt aber `<value>`-Kindelemente. Siehe Abweichung A4. | [type](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/type) |
| `resx` | M1 | ja | `path` und `version` beide Pflicht. Namensschema `<Name>.<LCID>.resx` durch Beispiel belegt. | [resx](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/manifest-schema-reference/resx) |
| `context.resources.getString(id)` | M1 | ja | Vorhanden, modellgesteuerte und Canvas-Apps. | [getString](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/resources/getstring) |
| `context.utils.getEntityMetadata(entityName, attributes?)` | M1, M3 | ja | Liefert `Promise<EntityMetadata>` mit `primaryNameAttribute` und `metadata`. | [getEntityMetadata](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/utility/getentitymetadata) |
| Optionsfarben und -labels | M1 | teilweise | `OptionDescriptor` hat `Color`, `Label`, `Value`. Der dokumentierte Weg dorthin führt über `ControlAttributes.OptionSet`, nicht über `AttributeMetadata` – dort ist keine Options-Eigenschaft dokumentiert. Siehe Offene Punkte. | [OptionDescriptor](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/optiondescriptor), [AttributeMetadata](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/attributemetadata) |
| `property.attributes` | M1 | ja | Nur gesetzt, wenn `usage="bound"`. Bei `usage="input"` fehlen `attributes`, `formatted` und `security`. Der Typ `FieldPropertyMetadata` hat keine eigene Dokumentationsseite. | [Property](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/property) |
| `context.utils.hasEntityPrivilege(...)` | M3 | ja | Vorhanden. Wichtig: liefert `false`, wenn die Metadaten nicht im lokalen Cache sind; vorher `getEntityMetadata` awaiten. | [hasEntityPrivilege](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/utility/hasentityprivilege) |
| `dataset.paging` | M2 | ja | `totalResultCount` (`-1`, wenn nicht verfügbar), `hasNextPage`, `pageSize`, `loadNextPage`, `setPageSize`, `reset`, `loadExactPage`. Seitenwechsel dürfen nicht parallel laufen und lösen jeweils `updateView` aus. | [Paging](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/paging) |
| `dataset.sorting` | M4 | ja | Typ `SortStatus[]`, nur Dataverse. Neusetzen der Sortierung setzt das Filtering zurück. | [DataSet](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/dataset) |
| `context.mode.trackContainerResize(true)` / `allocatedWidth` | M2 | ja | Vorhanden, in `init` aufzurufen. In modellgesteuerten Apps ist `allocatedHeight` im `updateView` stets `-1`. Im Test-Harness kommen beide Werte als **String** statt als Zahl. | [trackContainerResize](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/mode/trackcontainerresize) |
| `context.updatedProperties` | M1, M2 | ja | Für modellgesteuerte Apps `layout` und `dataset`. | [updatedProperties](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/updatedproperties) |
| `context.navigation.openForm(options, parameters)` | M3 | ja | Der zweite Parameter heißt `parameters`, nicht `formParameters`. Rückgabe `Promise<OpenFormSuccessResponse>` mit `savedEntityReference`. Ungültige Parameter lösen einen Fehler aus. | [openForm](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/navigation/openform) |
| `EntityFormOptions.createFromEntity` | M3 | ja | Dokumentierter, typisierter Weg zur Vorbelegung über gemappte Spalten. Bessere Alternative zum untypisierten Parent-Kontext. | [EntityFormOptions](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/entityformoptions) |
| `context.navigation.openErrorDialog(options)` | M3 | ja | Vorhanden, `message` oder `errorCode` ist Pflicht. | [openErrorDialog](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/navigation/openerrordialog) |
| `context.navigation.openConfirmDialog(strings, options?)` | M3 | ja | Vorhanden, liefert `{ confirmed: boolean }`. | [openConfirmDialog](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/navigation/openconfirmdialog) |
| `context.webAPI.updateRecord` | M1, M3 | ja | Vorhanden. | [WebAPI](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/webapi) |
| **Custom API aus PCF aufrufen** | **M3** | **nein** | **`context.webAPI` hat exakt fünf Methoden: `createRecord`, `deleteRecord`, `retrieveMultipleRecords`, `retrieveRecord`, `updateRecord`. Kein `execute`. Eine Volltextsuche über die gesamte Component-Framework-Dokumentation liefert null Treffer für „Custom API" und für `webAPI.execute`. Der in M3 geforderte `customapi`-Schreibmodus hat keinen dokumentierten Weg.** | [WebAPI](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/webapi) |
| `ReactControl.init` / `updateView` | M1 | ja | `init(context, notifyOutputChanged, state)` ohne Container, `updateView` liefert ein `React.ReactElement`. Werte können null sein, solange Daten nicht bereit sind. | [ReactControl.init](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/react-control/init), [updateView](https://learn.microsoft.com/en-us/power-apps/developer/component-framework/reference/react-control/updateview) |

---

## 4. Abweichungen zwischen Manifest-Zielbild und Schema

| # | Zielbild | Was die Dokumentation hergibt | Konsequenz |
| --- | --- | --- | --- |
| A1 | `<platform-library name="React" version="16.8.6" />` | Zulässig für React ist **`16.14.0`**. `16.8.6` liegt außerhalb. Fluent `9.46.2` ist korrekt und zugleich das obere Ende des zulässigen Bereichs. | **Korrigieren auf `16.14.0`.** Fluent bleibt. |
| A2 | Umstellung des bestehenden Controls auf `control-type="virtual"` | Die Dokumentation beantwortet die Frage „Kann ich ein bestehendes Standard-Control in ein React-Control umwandeln?" ausdrücklich mit **Nein**. Ein neues Projekt mit `pac pcf init -fw react` ist nötig, danach werden Manifest und `index.ts` portiert. Das Attribut allein wandelt nichts um. | **M1 muss neu scaffolden, nicht umschreiben.** Zusammen mit Z1 ist das ohnehin der einzige gangbare Weg. |
| A3 | `display-name-key="Kanban Board"` | `display-name-key` ist Pflicht, liegt im Zielbild aber als Literaltext statt als resx-Schlüssel vor. | Auf resx-Schlüssel umstellen, sonst bleibt „alle sichtbaren Strings aus resx" verletzt. |
| A4 | `<property name="writeMode" of-type="Enum" usage="input" />` | `Enum` ist gültig, das dokumentierte Beispiel zeigt aber zwingend `<value name="…" display-name-key="…">0</value>`-Kinder. Das selbstschließende Element definiert keine Werte. | **`<value>`-Kinder für `webapi` und `customapi` ergänzen.** |
| A5 | `<data-set name="records" display-name-key="Records">` | Die Dokumentation führt `cds-data-set-options` als **Pflichtattribut** für modellgesteuerte Apps. Weder das Zielbild noch das heutige Manifest setzen es. | Gegen `pac pcf push` verifizieren. Vermutlich Dokumentationsungenauigkeit, da das heutige Control ohne dieses Attribut ausgeliefert wird. Nicht raten. |
| A6 | Zielstruktur nennt `css/KanbanBoard.css`, das `<resources>`-Zielbild enthält aber kein `<css>`-Element | `<css>` ist als Kind von `<resources>` zulässig (0 bis n) und schließt `platform-library` nicht aus. | Entweder `<css>` ergänzen oder die Datei streichen und vollständig über Fluent stylen. Der Widerspruch im Zielbild muss aufgelöst werden. |
| A7 | `type-group titleTypes` mischt `SingleLine.Text`, `Lookup.Simple`, `OptionSet`, `DateAndTime.DateOnly` | Für modellgesteuerte Apps unproblematisch. Für Canvas-Apps gilt: `Lookup.Simple` und `OptionSet` gehören keiner auflösbaren Gruppe an, deshalb gewinnt der **erste** gelistete Typ, hier `SingleLine.Text`. `Lookup.Simple` und das `type`-Element selbst sind ohnehin nur für modellgesteuerte Apps verfügbar. | Kein Problem für das Zielszenario. Falls Canvas je dazukommt, ist die Reihenfolge im `type-group` bedeutungstragend. |
| A8 | `cardTitle`, `cardSubtitle`, `cardBadge`, `sumValue` mit `usage="input"` | `property.attributes`, `property.formatted` und `property.security` sind **nur bei `usage="bound"`** gesetzt. | Für reine Anzeige richtig so. Sollten für diese Spalten je Metadaten oder Feldsicherheit gebraucht werden, trägt `input` das nicht. Bewusst so entscheiden. |
| A9 | `<feature-usage>` im `<control>` | `feature-usage.md` nennt `control` als Parent. Die Kindliste in `control.md` führt `feature-usage` allerdings nicht auf. | Dokumentationsinkonsistenz, keine Änderung nötig. Das heutige Manifest nutzt es bereits erfolgreich. |

Positiv bestätigt, ohne Abweichung: `groupBy` als `of-type="OptionSet" usage="bound"`, `sumValue`
als `Currency`, `allowDrag` als `TwoOptions`, `customApiName` und `wipLimits` als `SingleLine.Text`,
die Platzierung von `type-group` als Kind von `control`, das resx-Namensschema für 1033 und 1031.

Außerdem stützt eine Warnung in der Typtabelle das Zielbild ausdrücklich: enthält ein Manifest
mindestens ein Dataset, sollen Properties vom Typ `Lookup.Simple` in das `data-set`-Element
eingebettet werden. Genau dort steht `cardTitle` im Zielbild.

---

## 5. Offene Punkte, die vor dem jeweiligen Meilenstein zu klären sind

1. **M3, blockierend: Custom API aus PCF.** Es gibt keinen dokumentierten Weg. `context.webAPI` hat
   kein `execute`. Die verbleibenden Optionen sind das globale `Xrm.WebApi.online.execute` – laut
   Dokumentation ein nicht unterstütztes, untypisiertes Plattformobjekt – oder ein rohes `fetch`,
   das Defekt 5 und Regel 4 widerspräche. Vor M3 zu entscheiden.
2. **M1: Herkunft der Optionsmetadaten.** `OptionDescriptor` mit `Color` ist dokumentiert,
   `AttributeMetadata` aus `getEntityMetadata` dokumentiert aber keine Options-Eigenschaft. Der
   dokumentierte Weg führt über `ControlAttributes.OptionSet` und damit über die gebundene
   `groupBy`-Property, nicht über `getEntityMetadata`. M1 formuliert es andersherum. Zusätzlich ist
   `ControlAttributes.OptionSet` als `OptionDescriptor` typisiert, nicht als `OptionDescriptor[]`,
   obwohl semantisch eine Menge gemeint ist. Am Harness zu verifizieren.
3. **M1: Reihenfolge der Optionen.** Dass die Metadaten die konfigurierte Reihenfolge liefern und
   nicht die numerische, ist nirgends zugesichert. M1 verlangt genau das. Am realen Optionset zu
   prüfen, bevor darauf gebaut wird.
4. **Virtuelle Controls: Preview oder GA.** `control.md` (Stand 24.03.2025) nennt sie Public
   Preview, `react-controls-platform-libraries.md` (Stand 10.10.2025) spricht von einem GA-Release
   und verlangt CLI ≥ 1.37. Für eine Governance-Lösung ist dieser Unterschied relevant und sollte
   vor M1 geklärt werden.
5. **M2: Zähler je Spalte.** Paging ist eine Eigenschaft des Datasets, nicht der einzelnen Spalte.
   Ein ehrlicher Zähler je Spalte kann nur die geladenen Datensätze zählen; `totalResultCount` gilt
   für die gesamte Abfrage und ist `-1`, wenn nicht verfügbar. M2 sollte formulieren, was der
   Zähler aussagt.
6. **M3: Parent-Kontext.** Die Dokumentation sagt ausdrücklich, dass Code-Komponenten nicht von
   `formContext` abhängen dürfen. `createFromEntity` ist der dokumentierte, typisierte Ersatz und
   vermeidet den in M3 vorgesehenen untypisierten Zugriff samt Eintrag in `docs/UNTYPED-APIS.md`.
7. **A5** und **A6** aus der Abweichungstabelle.

---

## 6. Regel 10 im Meilenstein `audit`

`npm run build` und `npm run lint` konnten nicht ausgeführt werden, weil es kein npm-Projekt gibt
(Defekt Z1). Der Meilenstein `audit` ändert ausdrücklich keinen Code, es gibt also nichts zu bauen.
Die Manifest-Version bleibt bei `0.4.0`: Regel 6 knüpft die Erhöhung an eine Änderung, und der
Audit-Lauf ändert das Control nicht. Ab M1 gilt Regel 10 uneingeschränkt, und die Herstellung eines
baubaren Projekts ist dessen erste Aufgabe.
