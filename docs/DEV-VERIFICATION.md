# Prüfliste für den ersten DEV-Lauf

Was hier steht, kann keine Werkbank beantworten. Der Harness rendert gegen CSV, jsdom bildet
Browser-Schnittstellen nach, und das Fließband baut, ohne je einen Model-Driven-Host zu sehen. Jeder
Punkt nennt die konkrete Frage, wie sie zu beantworten ist, und was ein negativer Befund nach sich
zöge.

Die Liste ist beim ersten Lauf gegen eine echte Organisation abzuarbeiten. Befunde gehören zurück
in `docs/API-NOTES.md`, nicht nur in ein Gespräch.

---

## 1. Welcher Zweig in `services/metadata.ts` greift

**Frage.** Führt die von `context.utils.getEntityMetadata` zurückgegebene Attributsdefinition die
Optionsliste mit, also Wert und Label je Option? Oder greift der Metadaten-Endpunkt?

**Wie.** Das Control protokolliert den greifenden Zweig **einmalig** über `console.info`. Die
Browserkonsole beim ersten Laden des Boards öffnen. Die Meldung nennt den Zweig im Klartext.

**Warum das offen ist.** `OptionDescriptor` mit `Value`, `Label` und `Color` ist dokumentiert.
`AttributeMetadata` aus `getEntityMetadata` führt **keine** Options-Eigenschaft. Ob beide Enden zur
Laufzeit zusammenhängen, sagt die Dokumentation nirgends.

**Bei negativem Befund**, also wenn der Endpunkt greift: der rohe `fetch` bleibt dauerhaft der
einzige Weg. Dann ist er als dokumentierter Ausnahmefall nach Regel 9 zu führen, der Eintrag in
`docs/UNTYPED-APIS.md` von „beobachtet" auf „dauerhaft" zu heben, und es ist zu entscheiden, ob der
Endpunktaufruf ein Netzwerkbudget braucht, etwa längeres Caching über `sessionStorage`. Der
Zwischenspeicher gilt heute nur für die Lebensdauer des Controls.

---

## 2. `PointerEvent` und `elementFromPoint` im echten Browser

**Frage.** Funktioniert das Verschieben so, wie die Tests es behaupten?

**Wie.** Eine Karte mit der Maus in eine andere Spalte ziehen. Prüfen: Aufnahme erst nach kurzer
Bewegung, Karte bleibt gedämpft an ihrem Platz, der Drag-Layer folgt dem Zeiger, die Zielspalte wird
markiert, und beim Loslassen springt die Karte in die neue Spalte.

**Warum das offen ist.** jsdom 26 kennt `PointerEvent` nicht; `vitest.setup.ts` stellt einen Ersatz
bereit, der `MouseEvent` erweitert. `document.elementFromPoint` fehlt in jsdom ebenfalls und ist im
Test durch eine Attrappe ersetzt. **Der Zeigerpfad ist damit gegen Stellvertreter geprüft, nicht
gegen eine Browser-Implementierung.** Die Tests sichern die Verdrahtung, nicht das Verhalten.

Besonders unbelegt ist das Zusammenspiel von `setPointerCapture` mit `pointer-events: none` auf der
gezogenen Karte. Die Erwartung ist, dass die Erfassung Ereignisse weiter an die Karte liefert,
während `elementFromPoint` die Spalte darunter meldet. Das ist der Spezifikation nach richtig, hier
aber nirgends nachgewiesen.

**Bei negativem Befund**, also wenn `elementFromPoint` die gezogene Karte statt der Spalte meldet:
auf `document.elementsFromPoint` im Plural umstellen und den ersten Treffer wählen, der weder die
gezogene Karte noch der Drag-Layer ist.

---

## 3. Touch-Verschieben gegen Scrollen auf einem Tablet

**Frage.** Lässt sich eine Karte mit dem Finger aufnehmen, ohne dass das Board unbrauchbar zu
scrollen ist?

**Wie.** Auf einem echten Tablet, nicht in der Geräteemulation der Entwicklerwerkzeuge. Drei Gesten
prüfen: waagerecht über den Spaltenzwischenraum wischen soll das Board scrollen; senkrecht in einer
Spalte wischen soll die Spalte scrollen; eine Karte anfassen und seitwärts ziehen soll sie aufnehmen.

**Warum das offen ist.** `touch-action` steht auf `manipulation`, nicht auf `none`. Der Browser
entscheidet, ob eine Geste ein Scrollen ist, und schickt bei dieser Entscheidung `pointercancel`,
worauf die Geste sauber abbricht. Scrollen wird also nie blockiert. Der Preis ist, dass eine
scroll-ähnliche Fingergeste dem Scrollen den Vortritt lässt.

**Bei negativem Befund**, also wenn das Aufnehmen mit dem Finger unzuverlässig ist: Aufnahme über
einen Langdruck oder über einen sichtbaren Anfasser auf der Karte. **Nicht vorab bauen.** Erst
entscheiden, wenn jemand das Board auf einem Gerät in der Hand hatte.

---

## 4. Kontrast der Spaltenköpfe mit den tatsächlichen Optionsfarben

**Frage.** Bleibt der Kopftext auf den echten Farben des Optionsets lesbar, und ist der Akzentbalken
vom Spaltenhintergrund unterscheidbar?

**Wie.** Board gegen das reale Optionset öffnen. Die Kontrastprüfung der Browser-Entwicklerwerkzeuge
auf jeden Spaltentitel anwenden. Zusätzlich mit erzwungenen Farben prüfen, also im
Hochkontrastmodus des Betriebssystems.

**Warum das offen ist.** Die Berechnung ist gegen zehn Farben belegt, darunter `#cfe3a8` aus dem
Solution-Export. Belegt ist damit die Arithmetik, nicht die Darstellung. Die Aufhellung des
Kopfhintergrunds auf 18 Prozent über Weiß setzt außerdem voraus, dass der Host wirklich Weiß
darunterlegt; in einem dunklen Design stimmt diese Annahme nicht.

**Bei negativem Befund**, insbesondere im Hochkontrastmodus: die Aufhellung durch eine Berechnung
gegen die tatsächliche Hintergrundfarbe des Hosts ersetzen und `forced-colors` ausdrücklich
behandeln, statt sich auf feste Farbwerte zu verlassen.

---

## 5. Lädt `control-type="virtual"` mit `<data-set>` im Model-Driven-Host

**Frage.** Erscheint das Board auf dem Subgrid, oder bleibt der Platz leer?

**Wie.** Solution importieren, Control auf dem Subgrid `subgrid_assessors` des Hauptformulars von
`fo_decisionprocess` konfigurieren, Formular öffnen. Bei leerem Platz die Browserkonsole und das
Netzwerkprotokoll auf einen fehlgeschlagenen Bundle-Abruf prüfen.

**Warum das offen ist.** Kein Sample im offiziellen Repository ist zugleich virtual und dataset, und
keine Dokumentationsseite kombiniert beides. Belegt ist bisher nur, dass `pcf-scripts` die
Kombination durch Manifest- und Control-Validierung lässt und webpack sie baut. **Bauen ist nicht
Laden.**

**Bei negativem Befund**: das ist der einzige Punkt dieser Liste, der den Entwurf als Ganzes trifft.
Dann wäre auf `control-type="standard"` mit selbst mitgeliefertem React zurückzufallen, womit die
Platform Libraries entfallen, das Bundle deutlich wächst und die Fluent-Themenbindung verloren geht.
Vor dieser Kehrtwende wäre zu prüfen, ob nicht nur die Kombination virtual mit dataset scheitert,
sondern die Konfiguration über `property-set`.

---

## 5a. React 17 statt React 16 zur Laufzeit

**Frage.** Der Code ist gegen React 16.14 typisiert und getestet. Die Dokumentation sagt, dass eine
Model-Driven-App **React 17.0.2** lädt, obwohl das Manifest `16.14.0` anfordert. Bricht davon etwas?

**Was belegt ist.** Die Tabelle der unterstützten Platform Libraries führt eine eigene Spalte
„Version loaded": angefordert `16.14.0`, geladen `17.0.2 (Model)` und `16.14.0 (Canvas)`. Quelle:
`powerapps-docs/developer/component-framework/react-controls-platform-libraries.md`. Für Fluent gilt
dasselbe, siehe Punkt 6.

**Was der Code dazu hergibt.** Die naheliegende Sorge ist die verlegte Ereignisdelegation: React 17
hängt seine Listener an den Wurzelcontainer statt an `document`. Das bricht Code, der selbst einen
nativen Listener auf `document` hängt und sich auf die Reihenfolge gegenüber React verlässt, oder der
mit `stopPropagation` einen solchen Listener aufhalten will.

Der Code wurde daraufhin durchgesehen. Das Ergebnis:

| Geprüft | Befund |
| --- | --- |
| `addEventListener` auf `document` oder `window` | **kein einziges Vorkommen** im gesamten Control |
| Handler-Registrierung | ausschließlich über React-Props: `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel`, `onKeyDown`, `onClick` |
| Blasenweg | Zeigerereignisse blasen von der Karte zum `div.ayonto-kanban-board`, beide innerhalb unseres Teilbaums. Nie über den Wurzelcontainer hinaus |
| `stopPropagation` | kein Vorkommen |
| `document.`-Zugriffe | zwei, beide **nicht** ereignisbezogen: `querySelector` für die Fokuswiederherstellung, `elementFromPoint` für die Trefferprüfung |
| Asynchrones Lesen von Ereignisfeldern | keines. `clientX`, `clientY`, `pointerId`, `button` und `currentTarget` werden synchron gelesen, bevor irgendetwas wartet |

**Damit ist das Risiko kleiner, als es zunächst aussah.** Kein Punkt im Code erwartet Ereignisse am
`document`, und keiner verlässt sich auf Blasen über den Wurzelcontainer hinaus. Zwei weitere
Unterschiede wirken sogar in unsere Richtung:

- **Event-Pooling.** React 17 hat es abgeschafft. Code, der ein Ereignisobjekt aufbewahrt und später
  liest, war unter 16 kaputt und ist unter 17 in Ordnung. Unserer tut es ohnehin nicht, aber die
  Änderung kann hier nichts brechen, sondern nur entschärfen.
- **Bündelung von Zustandsänderungen.** React 17 bündelt außerhalb von Ereignishandlern weiterhin
  nicht; das kam erst mit 18. Die Faltung in `useOptimisticMove`, die den `datasetRefreshed`-Fall
  bewusst in **eine** Dispatch-Aktion zusammenzieht, bleibt also richtig und wäre auch unter 18 noch
  richtig.

**Was offen bleibt.** Dass der Code keine dieser Annahmen trifft, ist geprüft; dass die Kombination
aus `setPointerCapture`, `pointer-events: none` auf der gezogenen Karte und der Delegation am
Wurzelcontainer sich unter React 17 im Browser so verhält wie unter jsdom mit dem Stellvertreter aus
`vitest.setup.ts`, ist **nicht** geprüft. Das ist derselbe Vorbehalt wie in Punkt 2 und wird dort
mitbeantwortet.

**Wie zu prüfen.** Nicht als eigener Handgriff. Beim Abarbeiten von Punkt 2 mitbeobachten und einen
Bruch anders einordnen als einen Zeigerfehler: ein Ereignis, das gar nicht ankommt, oder ein Zustand,
der nach dem Loslassen zurückspringt, sind React-Verdacht. Eine Zielspalte, die nicht markiert wird,
während der Drag-Layer sauber folgt, ist `elementFromPoint`.

**Bei negativem Befund.** Erst die geladene React-Fassung aus Punkt 6 feststellen, dann entscheiden.
Ein Anheben von `@types/react` auf 17 wäre die kleine Antwort; sie ändert nur Typen, nicht das
Verhalten, und sie widerspricht Regel 15, solange das Manifest `16.14.0` anfordert. Die Doku sagt
ausdrücklich, dass `16.14.0` der anzufordernde Wert ist und der Host eine höhere verträgliche Fassung
lädt — die angeforderte Fassung ist also **nicht** falsch und gehört nicht angehoben.

---

## 6. Platform-Library-Versionen zur Laufzeit

**Frage.** Lädt der Host React `16.14.0` und Fluent `9.4.0`, wie das Manifest sie anfordert?

**Wie.** Im Netzwerkprotokoll nach den Plattformbündeln sehen. Im Bundle des Controls stehen die
Aliasse `Reactv16` und `FluentUIReactv940`.

**Warum das offen ist.** Regel 2 nimmt Versionsstrings ausdrücklich von der Doku-Verifikation aus;
sie gelten erst als bestätigt, wenn der Build sie akzeptiert. Das ist geschehen. Ob der Host sie zur
Laufzeit auch bereitstellt, ist eine andere Frage.

**Bei negativem Befund**: die vom Host tatsächlich angebotene Fassung übernehmen, in `package.json`
und Manifest gemeinsam nach Regel 15, mit Begründung im Changelog.

---

## 7. Reihenfolge der Optionen

**Frage.** Liefert die Plattform die Optionen in der im Optionset konfigurierten Reihenfolge?

**Wie.** Die Reihenfolge der Spalten im Board mit der Reihenfolge im Optionset-Editor vergleichen.
Für `eo_progress` erwartet: `Draft`, `Work`, `Done`. Danach eine Option im Editor verschieben,
veröffentlichen, Board neu laden.

**Warum das offen ist.** Regel 12 verlangt, das gelieferte Array unverändert zu übernehmen, und der
Code sortiert nirgends. Dass das Array die konfigurierte Reihenfolge trägt, ist nirgends zugesichert.

**Bei negativem Befund**, etwa numerischer Reihenfolge: Regel 12 bleibt richtig, aber die
Spaltenreihenfolge wird zu einer Maker-Einstellung, weil die Plattform sie nicht liefert.

---

## 8. Zusammenspiel mit der serverseitigen Kopplung

**Frage.** Was löst ein Verschieben per Board aus, das ein Verschieben per Formular nicht auslöst?

**Wie.** Eine Karte verschieben und beobachten: läuft der Cloud Flow mit
`filteringattributes = eo_progress` an? Greift die Business Rule, die den RequiredLevel von
`eo_assessmentresult` abhängig von `eo_progress` setzt?

**Warum das offen ist.** Die Business Rule läuft ausschließlich clientseitig auf dem Formular. Ein
Verschieben per Board schreibt über `context.webAPI.updateRecord` und umgeht sie damit
zwangsläufig.

**Bei negativem Befund**, also wenn Datensätze in einem Zustand landen, den das Formular nicht
zuließe: das ist der Inhalt von `docs/GOVERNANCE.md` in M3. Die serverseitige Durchsetzung liegt
ausdrücklich außerhalb dieses Repositories, die Lücke ist aber zu benennen und zu beziffern.

---

## 9. Kleinere offene Punkte

| Frage | Wie zu prüfen | Bei negativem Befund |
| --- | --- | --- |
| Ist `Lookup.Simple` für `cardTitle` im Maker anwählbar? | Control konfigurieren und prüfen, ob `eo_assessor` in der Auswahl erscheint | Rückfall auf eine gebundene Textspalte; der Assessor-Name käme dann nicht direkt |
| Braucht `<data-set>` das Attribut `cds-data-set-options`? | Import und Konfiguration ohne das Attribut | Attribut ergänzen; die Dokumentation führt es als Pflicht, das Upstream-Control liefert ohne es aus |
| Lösen die resx-Zeichenketten in 1031 auf? | Benutzersprache auf Deutsch stellen, Board laden | Namensschema und `<resx>`-Einträge prüfen; heute nur durch Manifest-Validierung belegt |
| Zählt der Spaltenzähler mit `+` richtig? | Subgrid mit `RecordsPerPage = 20` und mehr als zwanzig Datensätzen | Paging-Auswertung prüfen; `totalResultCount` kann `-1` sein |
| Sind virtuelle Controls Preview oder GA? | Unabhängig klären, nicht am Verhalten ablesen | Für eine Governance-Lösung ist das eine Freigabefrage, keine technische |
