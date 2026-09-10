# Untypisierte Plattform-Oberflächen

Register nach Regel 9. Jede Stelle, an der dieses Repository mit einem Plattformobjekt arbeitet,
dessen Gestalt die Dokumentation nicht vollständig festlegt, steht hier.

## Stand

**Kein `any` im Quelltext.** Alle unten genannten Stellen arbeiten mit `unknown` und verengen
schrittweise mit Typwächtern. Die Ausnahme aus Regel 9 wird damit derzeit nicht in Anspruch
genommen. Das Register führt die Stellen trotzdem, weil dort die gleiche Gefahr besteht: der
Vertrag ist nicht dokumentiert und kann sich ohne Ankündigung ändern.

## Die Stellen

### Die Antwort von `context.utils.getEntityMetadata`

- **Wo:** `KanbanBoard/services/metadata.ts`, `optionsFromEntityMetadata`
- **Was dokumentiert ist:** `EntityMetadata.metadata` als `Dictionary<AttributeMetadata>`;
  `AttributeMetadata` mit `DefaultValue`, `DisplayName`, `IsEditable`, `LogicalName`, `MaxLength`,
  `RequiredLevel`, `Type`. `ControlAttributes.OptionSet` als `OptionDescriptor` mit `Value`,
  `Label`, `Color`.
- **Was nicht dokumentiert ist:** dass diese beiden Enden zusammenhängen, dass also
  `metadata[attributeName]` eine `OptionSet`-Eigenschaft trägt. `AttributeMetadata` führt sie nicht.
- **Wie damit umgegangen wird:** als `unknown` entgegengenommen, strukturell geprüft, bei
  Fehlanzeige stiller Übergang auf Zweig 2. Kein Zugriff verlässt sich auf die Annahme.
- **Nebenbefund:** `ControlAttributes.OptionSet` ist in der Dokumentation als `OptionDescriptor`
  typisiert, nicht als `OptionDescriptor[]`, obwohl semantisch eine Menge gemeint ist. Der Leser in
  `readOptionArray` nimmt deshalb beides an, ein Array oder ein Objekt mit `Options`.

### Die Antwort des Metadaten-Endpunkts

- **Wo:** `KanbanBoard/services/metadata.ts`, `optionsFromMetadataEndpoint`
- **Was es ist:** eine rohe HTTP-Antwort, für die es keine Typen aus dem Component Framework gibt.
- **Wie damit umgegangen wird:** als `unknown` entgegengenommen und durch dieselben Typwächter
  geführt wie Zweig 1. Der Aufruf selbst ist in `services/metadata.ts` gekapselt und taucht in
  keiner Komponente auf.

### `EntityRecord.getValue`

- **Wo:** `KanbanBoard/hooks/useDatasetRecords.ts`, `toRawGroupValue`
- **Was dokumentiert ist:** dass `getValue` den Rohwert liefert. Welcher Laufzeittyp das für eine
  Choice-Spalte ist, sagt die Dokumentation nicht; im Upstream-Control kam der Wert beobachtet
  einmal als Zahl und einmal als Zeichenkette zurück.
- **Wie damit umgegangen wird:** als `unknown` entgegengenommen. Zahl und Zeichenkette werden
  durchgereicht, alles andere wird zu `null`. Die Normalisierung selbst liegt in `model/grouping.ts`
  und ist ohne Plattform testbar.

### `EntityRecord.getNamedReference().name`

- **Wo:** `KanbanBoard/hooks/useDatasetRecords.ts`, `toCardRecord`
- **Was dokumentiert ist:** die Referenz als solche.
- **Wie damit umgegangen wird:** `name` wird als möglicherweise fehlend behandelt und nur als
  Rückfall verwendet, wenn die gebundene Titelspalte leer ist.

### `allocatedWidth` und `allocatedHeight` im Test-Harness

- **Wo:** noch nicht im Quelltext, gehört zu M2.
- **Was dokumentiert ist:** im Test-Harness kommen beide Werte als **Zeichenkette** statt als Zahl
  zurück, ohne Wert als Leerstring statt `-1`.
- **Hinweis für M2:** die Umrechnung gehört an die Grenze, nicht in eine Komponente.
