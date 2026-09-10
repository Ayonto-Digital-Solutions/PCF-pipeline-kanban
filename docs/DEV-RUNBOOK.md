# Anleitung für den ersten DEV-Lauf

Diese Anleitung führt vom heutigen Stand des Repositories bis zu dem Punkt, an dem die neun Fragen
aus `docs/DEV-VERIFICATION.md` beantwortet sind. Sie legt kein `cdsproj` an, ändert keine Version und
enthält keinen Code. Sie beschreibt, was zu tun ist, und trennt dabei streng zwischen Belegtem und
Vermutetem.

## Belegstufen

Jeder Schritt trägt eine Marke:

| Marke | Bedeutung |
| --- | --- |
| **[Doku]** | Gegen die Microsoft-Dokumentation belegt. Die Quelle steht dabei. |
| **[Repo]** | Aus den Dateien dieses Repositories abgelesen. |
| **[Zu verifizieren]** | Weder belegt noch abgelesen. Vor Ort zu prüfen, nicht zu raten. |

Die Dokumentation wurde nicht auf `learn.microsoft.com` gelesen — der Zugriff ist aus dieser Umgebung
gesperrt — sondern in den Quellrepositories, aus denen Learn erzeugt wird:

- `MicrosoftDocs/powerapps-docs` bei SHA `a76d0d1`
- `MicrosoftDocs/power-platform` bei SHA `65b6c90b2e4264546679d429f2ef42f8a53d39a5`

Nach Regel 2 gilt das als Beleg, mit Ausnahme von Versionsangaben und Vorschau-gegen-GA-Aussagen.

**Nichts in Abschnitt 1 wurde ausgeführt.** In dieser Umgebung gibt es weder `pac` noch `msbuild`
noch `dotnet`. Die Befehle sind aus der Dokumentation übernommen und in ihren Parametern gegen die
CLI-Referenz geprüft; ob sie auf einem Windows-Rechner mit installierter CLI durchlaufen, ist damit
nicht gezeigt.

---

## Befunde aus dieser Recherche, die die Prüfliste ändern

Fünf Punkte sind bei der Vorbereitung dieser Anleitung aufgefallen. Sie stehen hier vorn, weil sie
die Planung betreffen, nicht nur die Durchführung.

### A. `dataset` und `react` sind in der CLI unabhängige Schalter

`pac pcf init` hat `--template` mit den Werten `field` und `dataset` und davon getrennt `--framework`
mit den Werten `none` und `react`. Die Referenz nennt keine Einschränkung, die die Kombination
ausschlösse. **[Doku: `power-platform/developer/cli/reference/pcf.md`, Abschnitt `pac pcf init`]**

Das ist kein Beweis, dass ein virtuelles Dataset-Control lädt — die Parametermatrix eines
Generators sagt nichts über die Laufzeit. Es ist aber deutlich mehr, als `docs/DEV-VERIFICATION.md`
Punkt 5 heute festhält („keine Dokumentationsseite kombiniert beides"). Die Kombination ist im
Werkzeug vorgesehen, nicht bloß nicht verboten.

**Daraus folgt ein billiger Vorabtest**, der vor jedem Import läuft und dreißig Sekunden kostet:
`pac pcf init` in einem Wegwerfverzeichnis mit `-t dataset -fw react` aufrufen. Nimmt die CLI das an
und erzeugt sie ein Manifest mit `control-type="virtual"` und `<data-set>`, ist die Kombination vom
Hersteller vorgesehen. Lehnt sie ab, ist Punkt 5 beantwortet, bevor irgendetwas importiert wurde.
Siehe Abschnitt 3, Punkt 5.

### B. Der Host lädt andere Versionen, als das Manifest anfordert — dokumentiert

Die Tabelle der unterstützten Platform Libraries führt eine Spalte „Version loaded", die sich von der
angeforderten unterscheidet: **[Doku: `powerapps-docs/developer/component-framework/react-controls-platform-libraries.md`]**

| Name | npm-Paket | Zulässiger Bereich | Geladene Version |
| --- | --- | --- | --- |
| React | `react` | `16.14.0` | **17.0.2 (Model)**, 16.14.0 (Canvas) |
| Fluent | `@fluentui/react-components` | `>=9.4.0 <=9.46.2` | **9.68.0** |

Das ändert Punkt 6 der Prüfliste grundlegend. Die dort gestellte Frage („Lädt der Host React
`16.14.0` und Fluent `9.4.0`?") hat eine dokumentierte Antwort, und sie lautet nein — in einer
Model-Driven-App ist React `17.0.2` das Erwartete, Fluent `9.68.0` ebenso. Ein Befund von `16.14.0`
in einer Model-Driven-App wäre die Abweichung, nicht die Bestätigung.

Zwei Folgerungen:

1. Unser Manifest fordert Fluent `9.4.0` an, also den unteren Rand des zulässigen Bereichs. Das ist
   gültig. **[Doku, dieselbe Tabelle]**
2. **Der Code ist gegen React 16 typisiert und getestet, läuft aber gegen React 17.** React 17 hat
   das Event-Pooling abgeschafft und hängt die Delegation an den Wurzelcontainer statt an
   `document`. Unser Zeigerpfad benutzt native Pointer-Ereignisse, `setPointerCapture` und
   `document.elementFromPoint` und sollte davon unberührt sein; belegt ist das nicht. Das ist ein
   Risiko, das bisher nirgends benannt war, und es ist beim Verschieben einer Karte zu beobachten,
   nicht separat zu prüfen.

### C. `pac pcf push` umgeht die Versionspflicht — und das entscheidet die Frage packen gegen importieren

> „The `push` capability speeds up the inner-developer cycle development because it bypasses the code
> component versioning requirements and doesn't require that you build your solution (cdsproj) to
> import the code component."
> **[Doku: `powerapps-docs/developer/component-framework/import-custom-controls.md`]**

Dem steht die Regel für den regulären Weg gegenüber:

> „When deploying an update to a code component, the version in the `ControlManifest.Input.xml` must
> at minimum have its PATCH (the last part of the version) incremented for the change to be
> detected."
> **[Doku: `powerapps-docs/developer/component-framework/code-components-alm.md`]**

Ein Verifikationslauf ist genau der Fall, für den `push` gedacht ist: viele kleine Runden, jede mit
einer Codeänderung, jede sofort im Host zu sehen. Über den `cdsproj`-Weg kostete jede Runde eine
Versionserhöhung, sonst liefert die Model-Driven-App die zwischengespeicherte Fassung aus und man
prüft stundenlang gegen alten Code.

### D. `totalResultCount == -1` heißt „mehr als 5.000", nicht „unbekannt"

> „Unlike canvas apps, the `paging.totalResultCount` is used to display the total number of records in
> the current dataset. If this value is -1, it means there are more than 5,000 in the current dataset."
> **[Doku: `powerapps-docs/developer/component-framework/tutorial-create-model-driven-app-dataset-component.md`]**

`readPaging` bildet in `KanbanBoard/hooks/useDatasetRecords.ts:101` jeden negativen Wert auf `null`
ab, und die Anzeige fällt dann auf `Board_PagingUnknownTotal` zurück, also „{0} records loaded, more
are available". **[Repo]** Das Verhalten bleibt richtig. Die Bedeutung ist nur schärfer als gedacht:
`-1` ist kein Fehlerfall, sondern die Aussage „über 5.000". Für eine Assessment-Tabelle im
Governance-Umfeld ist das praktisch nie erreicht, der Fall ist also im DEV-Lauf kaum auslösbar.

### E. Unserem Manifest fehlt eine Höhenangabe für das Subgrid

Das offizielle Dataset-Beispiel führt eine Eingabeeigenschaft `SubGridHeight` und begründet sie so:

> „On model-driven apps forms, the code component container will have a constrained height based on
> the row span, but only on larger form factors. It won't be constrained on small form factors,
> meaning we need to provide a specific height. This is the purpose of the input property **Sub Grid
> Height**."
> **[Doku: dieselbe Tutorial-Seite]**

Ferner: „When code components are added to a model-driven table main grid or related records grid,
`allocatedHeight` will always return -1." **[Doku, ebenda]**

Unser Manifest hat keine solche Eigenschaft. **[Repo: `KanbanBoard/ControlManifest.Input.xml`]** Der
zu erwartende Fehlerfall ist damit nicht „lädt nicht", sondern „lädt mit Höhe null auf schmalen
Formfaktoren" — und das sähe im Browser genauso aus wie ein gescheitertes Laden. **Das ist die
gefährlichste Verwechslung dieses ganzen Laufs**, weil sie Punkt 5 falsch beantworten würde. Wie sie
auszuschließen ist, steht in Abschnitt 3 bei Punkt 5.

Behoben wird das hier nicht: eine Eigenschaft im Manifest wäre Code und eine Versionsänderung.

---

## 1. Was zum Packen fehlt

### 1.1 Was vorhanden ist

| Datei | Zustand |
| --- | --- |
| `KanbanBoard.pcfproj` | vorhanden, `<Name>KanbanBoard</Name>`, `OutputPath` auf `out\controls` **[Repo]** |
| `pcfconfig.json` | vorhanden, `outDir` auf `./out/controls` **[Repo]** |
| `KanbanBoard/ControlManifest.Input.xml` | vorhanden, Version `1.0.0` **[Repo]** |
| `out/controls/KanbanBoard/` | erzeugt, enthält `bundle.js`, `ControlManifest.xml`, `css/`, `strings/` **[Repo]** |

### 1.2 Was fehlt

1. **Ein `cdsproj`.** Es gibt keins im Repository. **[Repo: `find . -name "*.cdsproj"` ist leer]**
2. **Ein Herausgeber (Publisher) in der Zielumgebung**, mit einem Präfix, das zwei bis acht Zeichen
   lang ist, mit einem Buchstaben beginnt und nicht mit `mscrm`. **[Doku: CLI-Referenz zu
   `pac solution init` und `pac pcf push`]**
3. **Ein Authentifizierungsprofil** der Power Platform CLI für die Zielumgebung.
4. **Die CLI selbst.** In dieser Umgebung nicht vorhanden; der DEV-Lauf findet auf einem Rechner mit
   installiertem `pac` statt.
5. **Ein Produktionsbuild.** `npm run build` erzeugt per Vorgabe einen Entwicklungsbuild. Siehe 1.5.

### 1.3 Die Entscheidung: schieben statt packen

Die Dokumentation nennt zwei Wege. **[Doku: `code-components-alm.md`]**

| | `pac pcf push` | `cdsproj` + `msbuild` |
| --- | --- | --- |
| Braucht ein `cdsproj` | nein | ja |
| Versionserhöhung je Runde | **nein**, wird umgangen | ja, sonst greift der Cache |
| Zielsolution | `--solution-unique-name`, sonst eine temporäre `PowerAppsTools_<Präfix>` | die selbst angelegte |
| Ergebnis | unmanaged in der Entwicklungsumgebung | managed oder unmanaged, je nach Konfiguration |
| Geeignet für | die innere Entwicklungsschleife | Auslieferung nach TEST und PROD |

**Empfehlung für diesen Lauf: `pac pcf push`.** Begründung ist Befund C: der Verifikationslauf
besteht aus vielen kurzen Runden, und der `push`-Weg nimmt genau die Reibung heraus, die dabei
schmerzt. Das `cdsproj` wird gebraucht, sobald das Ergebnis nach TEST wandert — das ist M4-Arbeit,
nicht die dieses Laufs.

Der Preis ist benannt: `push` legt ohne `--solution-unique-name` eine temporäre Solution
`PowerAppsTools_<Präfix>` an. **[Doku: `code-components-alm.md`, Punkt 1 der Diagrammbeschreibung]**
Für eine Governance-Lösung bei 50Hertz ist das kein Auslieferungsartefakt, sondern ein Werkzeug der
Entwicklungsumgebung. Der Herausgeber muss trotzdem derselbe sein wie der spätere, sonst lässt sich
das Control später nicht in die eigentliche Solution übernehmen:

> „That solution must share the same solution publisher as used by the **PowerAppsTools** solution."
> **[Doku: ebenda, Punkt 2]**

Also gleich zu Beginn das endgültige Präfix wählen, nicht ein Wegwerfpräfix.

### 1.4 Die Befehle

Platzhalter in spitzen Klammern. Alle Befehle **[Doku]**, keiner ausgeführt.

```
# Einmalig: Authentifizierungsprofil anlegen
pac auth create --environment <UMGEBUNGS-URL-ODER-GUID> --name <PROFILNAME>

# Profil prüfen
pac auth list
pac org who
```

Zu `pac auth create`: die Seite `import-custom-controls.md` zeigt noch `--url`, die CLI-Referenz
führt stattdessen `--environment` („Default environment (ID, url, unique name, or partial name)")
und `--url` gar nicht mehr auf. **[Doku: `power-platform/developer/cli/reference/auth.md`]** Die
Referenz ist die jüngere Quelle; deshalb steht hier `--environment`. Falls die installierte
CLI-Fassung `--environment` nicht kennt, ist `--url <UMGEBUNGS-URL>` der Rückfall.
**[Zu verifizieren: welche der beiden die vorhandene CLI akzeptiert]**

```
# Abhängigkeiten und Produktionsbuild
npm ci
npm run build -- --buildMode production

# Schieben, aus dem Repositorywurzelverzeichnis
pac pcf push --publisher-prefix <PUBLISHER-PREFIX> --environment <UMGEBUNGS-URL-ODER-GUID>
```

Optional, wenn das Control in eine benannte Solution statt in `PowerAppsTools_<Präfix>` soll:

```
pac pcf push --publisher-prefix <PUBLISHER-PREFIX> --solution-unique-name <SOLUTION_UNIQUE_NAME>
```

Für spätere Runden nach einer Codeänderung genügt derselbe `push`-Befehl; `--incremental` schiebt
nur geänderte Dateien. **[Doku: CLI-Referenz zu `pac pcf push`]**

**Der Weg über ein `cdsproj`, nur zur Vollständigkeit — in diesem Lauf nicht auszuführen:**

```
mkdir Solutions
cd Solutions
pac solution init --publisher-name <HERAUSGEBERNAME> --publisher-prefix <PUBLISHER-PREFIX>
pac solution add-reference --path ..
msbuild /t:restore
msbuild /p:configuration=Release
```

Die erzeugte Datei liegt danach unter `bin\Debug\` beziehungsweise `bin\Release\`. **[Doku:
`import-custom-controls.md`: „After the build succeeds, find the generated solution files inside the
`\bin\debug\` folder"]** Debug erzeugt unmanaged, Release managed; überschreibbar durch
`<SolutionPackageType>` im `cdsproj`. **[Doku: ebenda und `code-components-alm.md`]** Der Import
liefe dann über `pac solution import --path <ZIP> --environment <URL> --publish-changes`.
**[Doku: CLI-Referenz zu `pac solution import`]**

### 1.5 Produktionsbuild — und eine Unstimmigkeit in der Doku

Die Tabelle in `code-components-alm.md` sagt:

| Befehl auf dem `pcfproj` | Ergebnis |
| --- | --- |
| `npm run build` | Entwicklungsbuild (Vorgabe) |
| `npm run build -- --buildMode production` | Release-Build |
| `pac pcf push` | Entwicklungsbuild, außer `PcfBuildMode` steht im `pcfproj` auf `production` |

**Zwei Dinge folgen daraus.**

Erstens: **`pac pcf push` erzeugt per Vorgabe einen Entwicklungsbuild.** Die Doku warnt ausdrücklich:
„Don't normally deploy a code component into Microsoft Dataverse that you built in development mode.
The component is often too large to import and might result in slower runtime performance."
Für die Verifikationsläufe ist das hinnehmbar und sogar hilfreich — unminimierter Code liest sich in
der Browserkonsole besser. Für eine Messung von Ladezeiten oder Bundlegröße ist es unbrauchbar.
Wer das ändern will, setzt `<PcfBuildMode>production</PcfBuildMode>` unter `<OutputPath>` im
`pcfproj`. Das ist eine Repository-Änderung und in diesem Lauf nicht vorgenommen.

Zweitens: dieselbe Seite schreibt an anderer Stelle `run build -- --buildMode release`, die Tabelle
dagegen `--buildMode production`. Die beiden Angaben widersprechen sich. Welchen Wert `pcf-scripts`
tatsächlich annimmt, ist hier nicht geprüft. **[Zu verifizieren: `npm run build -- --buildMode
production` und, falls das scheitert, `release`]**

Zur Einordnung: der heutige Entwicklungsbuild liegt bei **87.881 Byte** `bundle.js`. **[Repo:
`out/controls/KanbanBoard/bundle.js`]** Diese Zahl ist der Bezugspunkt für Abschnitt 4.

### 1.6 Eine Altlast im Repositorium

`DEPLOYMENT.md` im Wurzelverzeichnis stammt aus dem Upstream-Fork. Sie beschreibt ein Control namens
„Pipeline Kanban" mit Eigenschaften `groupByField` und `valueField`, konfiguriert über **Show As** auf
einer Ansicht. **[Repo]** Nichts davon trifft auf den heutigen Stand zu. Wer die Datei beim Import
zur Hand nimmt, wird in die Irre geführt. Sie ist nicht Gegenstand dieses Auftrags und bleibt
unverändert; sie gehört bereinigt, sobald der Import einmal funktioniert hat.

---

## 2. Reihenfolge des Imports und Konfiguration

### 2.1 Reihenfolge

1. Herausgeber in der DEV-Umgebung festlegen oder anlegen, Präfix notieren. **[Zu verifizieren:
   ob bei 50Hertz ein Herausgeber vorgegeben ist]**
2. `pac auth create` gegen DEV, `pac org who` zur Kontrolle.
3. `npm ci`, dann Produktionsbuild nach 1.5.
4. `pac pcf push` mit dem Präfix aus Schritt 1.
5. Prüfen, dass das Control in der Umgebung angekommen ist. **[Zu verifizieren: wo genau die
   Liste der Code-Komponenten in der heutigen Oberfläche steht]** Belegt ist nur, dass eine
   unmanaged Solution `PowerAppsTools_<Präfix>` entsteht, wenn keine Zielsolution genannt wurde.
6. Control auf dem Subgrid konfigurieren, siehe 2.2.
7. Speichern und **veröffentlichen**. Ohne Veröffentlichen greift die Änderung nicht. **[Doku:
   „**Save** and **Publish**", Tutorialseite]**
8. Formular öffnen und mit Abschnitt 3 beginnen.

### 2.2 Konfiguration im Formulardesigner

**Ziel laut Vorgabe:** Subgrid `subgrid_assessors` auf dem Hauptformular von `fo_decisionprocess`,
Ansicht *Active Decision Assessments*, `groupBy` auf `eo_progress`, `cardTitle` auf `eo_assessor`,
`RecordsPerPage` von 20 auf 100.

**Der dokumentierte Weg — aus einer Seite von 2022, die den klassischen Editor beschreibt:**

> „1. Open the **Account** form in the classic form editor. 2. Select the **Contacts** subgrid, and
> then select **Change Properties**. 3. Select the **Controls** tab. 4. Select **Add control** and
> then select the … code component. 5. Add the same properties as before … 6. Select the radio button
> for each form factor (web, phone, and tablet)…"
> **[Doku: Tutorialseite, Abschnitt „Configuring the code component on a form subgrid"]**

Mit dem ausdrücklichen Hinweis:

> „At this time, the new solution explorer experience does not support configuring code components,
> so you must use the classic solution editor to configure them inside model-driven apps."
> **[Doku: ebenda]**

**[Zu verifizieren]** Ob dieser Hinweis noch gilt. Die Seite trägt `ms.date: 05/27/2022`
beziehungsweise die Tutorialseite ein späteres Datum; der moderne Formulardesigner hat seither
Konfiguration von Code-Komponenten bekommen. Der Weg über den klassischen Editor ist der belegte, der
über den modernen der wahrscheinlich schnellere. **Konkrete Navigationspfade in der heutigen
Oberfläche werden hier nicht angegeben, weil sie nicht belegbar sind.** Wer den modernen Designer
benutzt und es funktioniert, hält den Pfad hier fest.

**Was der Maker in der Eigenschaftenliste sehen wird** — aus den resx-Dateien abgelesen, deutsche
Fassung in `KanbanBoard.1031.resx`: **[Repo]**

| Eigenschaft | Anzeigename (1033) | Pflicht | Zu setzen auf |
| --- | --- | --- | --- |
| `groupBy` | Group by | ja | `eo_progress` |
| `cardTitle` | Card title | ja | `eo_assessor` |
| `cardSubtitle` | Card subtitle | nein | leer lassen |
| `cardBadge` | Card badge | nein | leer lassen |
| `sumValue` | Sum column | nein | leer lassen, wirkt erst ab M4 |
| `wipLimits` | Work in progress limits | nein | leer lassen, wirkt erst ab M4 |
| `allowDrag` | Allow drag and drop | nein | **einschalten**, sonst ist Punkt 2 und 3 nicht prüfbar |

`groupBy` ist `usage="bound"`, also an eine Spalte des Datensatzes gebunden; die übrigen vier
Eigenschaften des Datensatzes sind `usage="input"` mit `of-type-group="titleTypes"`
(`SingleLine.Text`, `Lookup.Simple`, `OptionSet`, `DateAndTime.DateOnly`). **[Repo: Manifest]**

**Zur Ansicht und zur Seitengröße.** Dass `RecordsPerPage` von 20 auf 100 zu erhöhen ist, ist eine
Vorgabe aus dem Auftrag, keine belegte Notwendigkeit. Sie ist sinnvoll: bei 20 Datensätzen je Seite
zeigt jede Spalte einen unvollständigen Zähler mit `+`, und dann prüft man die Darstellung von
Teilmengen statt die des Boards. **[Zu verifizieren: wo `RecordsPerPage` in der heutigen Oberfläche
gesetzt wird — an der Ansicht oder an den Subgrid-Eigenschaften]**

**Formfaktoren.** Für Web, Telefon und Tablet je einzeln aktivieren. **[Doku: Schritt 6 oben]** Für
Punkt 3 der Prüfliste, das Verschieben mit dem Finger, ist Tablet zwingend.

### 2.3 Zwei Lücken, die hier auffallen und nicht behoben werden

1. **Keine Höheneigenschaft.** Siehe Befund E. Auf schmalen Formfaktoren kann der Container Höhe null
   haben. Falls das eintritt, ist die Abhilfe eine neue Eingabeeigenschaft im Manifest — Code, also
   nicht in diesem Lauf.
2. **`cds-data-set-options` fehlt.** Die Schemareferenz führt das Attribut am `<data-set>`-Element
   mit „Required: Yes" für Model-Driven-Apps. **[Doku:
   `powerapps-docs/developer/component-framework/manifest-schema-reference/data-set.md`]** Unser
   Manifest hat es nicht. **[Repo]** Falls Import oder Konfiguration daran scheitern, lautet der zu
   ergänzende Wert nach dem Beispiel derselben Seite
   `cds-data-set-options="displayCommandBar:true;displayViewSelector:true;displayQuickFind:true"`.
   Das Upstream-Control liefert ohne das Attribut aus, weshalb es bisher nicht ergänzt wurde.

---

## 3. Die neun Verifikationspunkte

Für jeden Punkt: was zu tun ist, woran das Ergebnis erkennbar ist, was zurückzumelden ist. Die
Rückmeldungen gehören nach `docs/API-NOTES.md`, nicht nur in ein Gespräch.

### Punkt 1 — Welcher Metadaten-Zweig greift

**Was zu tun ist.** Vor dem Öffnen des Formulars die Entwicklerwerkzeuge des Browsers mit F12 öffnen,
auf den Reiter **Konsole** wechseln, und dort **die Stufe „Info" einschalten**. In Chrome und Edge
sind `console.info`-Meldungen hinter dem Filter „Info" beziehungsweise „Verbose" verborgen und
erscheinen in der Vorgabeansicht **nicht**. Wer diesen Schritt auslässt, sieht nichts und schließt
daraus fälschlich, es werde nichts protokolliert. Danach das Formular laden.

**Wo die Meldung erscheint.** In der Konsole des Fensters, in dem das Formular läuft. Gibt der
Konsolenwähler mehrere Kontexte her, ist der des Formulars zu wählen, nicht `top`.
**[Zu verifizieren: ob eine Model-Driven-App das Formular im selben Kontext rendert oder in einem
eingebetteten Rahmen]**

**Woran das Ergebnis erkennbar ist.** Genau eine von zwei Zeichenketten, wörtlich:
**[Repo: `KanbanBoard/services/metadata.ts`, `logBranchOnce`]**

- `Option metadata resolved through context.utils.getEntityMetadata.`
- `Option metadata resolved through the metadata endpoint; getEntityMetadata did not carry value, label and colour.`

Drei Eigenschaften dieser Protokollierung, die man kennen muss, sonst deutet man sie falsch:

1. **Sie erscheint genau einmal je Control-Instanz.** `branchLogged` ist ein Modulzustand innerhalb
   der Instanz. Ein zweites Board auf demselben Formular protokolliert erneut, ein zweites Laden
   derselben Spalte nicht.
2. **Sie erscheint nur beim ersten Laden.** Der Zwischenspeicher in `load` ist nach Entität und
   Attribut geschlüsselt; ein Neuzeichnen des Formulars ohne Neuladen der Seite löst sie nicht aus.
   Wer die Meldung verpasst hat, lädt die Seite hart neu (Strg+F5).
3. **Ausbleiben ist ein dritter Befund, kein Nichtergebnis.** Erscheint keine der beiden Zeilen, ist
   entweder das Control gar nicht angelaufen (dann trifft Punkt 5), oder beide Zweige sind
   gescheitert — dann steht statt der Meldung die Fehleroberfläche „The board columns could not be
   loaded" im Board. **[Repo: `Error_Title` in den resx-Dateien]**

**Was zurückzumelden ist.** Die protokollierte Zeile wörtlich; ob sie beim ersten Laden erschien;
und, wenn der Endpunktzweig griff, aus dem Netzwerkreiter die Antwort auf den Aufruf von
`EntityDefinitions(LogicalName='…')/Attributes(…)/Microsoft.Dynamics.CRM.PicklistAttributeMetadata`
mit Statuscode. Zusätzlich: ob die Optionen eine Farbe mitführen — sichtbar daran, ob die Spaltenköpfe
farbige Akzentbalken tragen oder einheitlich grau bleiben.

### Punkt 2 — `PointerEvent` und `elementFromPoint` im echten Browser

**Was zu tun ist.** Mit der Maus eine Karte in eine andere Spalte ziehen. Fünf Teilbeobachtungen in
dieser Reihenfolge:

1. Ein Klick ohne Bewegung darf **nicht** ziehen, sondern soll den Datensatz öffnen. Die Aufnahme
   greift erst nach fünf Pixeln Bewegung. **[Repo: `DRAG_THRESHOLD_PX = 5` in
   `KanbanBoard/hooks/useCardDrag.ts`]**
2. Nach Überschreiten der Schwelle bleibt die Originalkarte gedämpft an ihrem Platz stehen.
3. Ein Drag-Layer folgt dem Zeiger.
4. Die Spalte unter dem Zeiger wird als Ziel hervorgehoben — **das** ist der Prüfpunkt für
   `elementFromPoint`.
5. Beim Loslassen springt die Karte in die neue Spalte und bleibt dort.

**Woran ein Fehlschlag erkennbar ist.** Bleibt Beobachtung 4 aus, obwohl der Drag-Layer sauber folgt,
meldet `elementFromPoint` die gezogene Karte oder den Layer statt der Spalte darunter. Das ist der in
`docs/DEV-VERIFICATION.md` vorgesehene Fall; die Abhilfe steht dort.

**Zusätzlich hier zu beobachten, wegen Befund B**: der Host lädt React 17, nicht 16. Ein Bruch
zeigte sich als Ereignis, das gar nicht ankommt, oder als Zustand, der nach dem Loslassen
zurückspringt. Wer so etwas sieht, notiert es als React-17-Verdacht statt als Zeigerfehler.

**Was zurückzumelden ist.** Für jede der fünf Teilbeobachtungen ja oder nein; bei einem Nein die
Konsolenausgabe und der Browser mit Version.

### Punkt 3 — Verschieben mit dem Finger gegen Scrollen

**Was zu tun ist.** Auf einem echten Tablet, nicht in der Geräteemulation. Drei Gesten:

| Geste | Erwartung |
| --- | --- |
| Waagerecht über den Zwischenraum zwischen Spalten wischen | Board scrollt waagerecht |
| Senkrecht innerhalb einer Spalte wischen | Spalte scrollt senkrecht |
| Karte anfassen und seitwärts ziehen | Karte wird aufgenommen |

**Woran das Ergebnis erkennbar ist.** Die dritte Geste ist die kritische. Bricht die Aufnahme ab und
das Board scrollt stattdessen, hat der Browser die Geste als Scrollen gewertet und `pointercancel`
geschickt — beabsichtigtes Verhalten bei `touch-action: manipulation`, aber wenn es *jedes Mal*
passiert, ist Aufnahme mit dem Finger praktisch unmöglich.

**Was zurückzumelden ist.** Je Geste das Ergebnis, dazu Gerät und Browser. Und eine Einschätzung, die
keine Messung ist: wie oft von zehn Versuchen die Aufnahme gelang. Unter etwa acht von zehn ist die
Abhilfe aus der Prüfliste zu erwägen — und erst dann, nicht vorher.

### Punkt 4 — Kontrast der Spaltenköpfe

**Was zu tun ist.** Board gegen das reale Optionset öffnen. Die Kontrastprüfung der
Entwicklerwerkzeuge auf jeden Spaltentitel anwenden. Danach den Hochkontrastmodus des Betriebssystems
einschalten und erneut sehen.

**Woran das Ergebnis erkennbar ist.** Der Kopftext soll mindestens 4,5:1 erreichen, der Akzentbalken
gegen den Spaltenhintergrund mindestens 3:1. **[Repo: `MINIMUM_NON_TEXT_CONTRAST = 3` in
`KanbanBoard/model/contrast.ts`]** Im Hochkontrastmodus ist die eigentliche Frage nicht der Kontrast,
sondern ob die Spalten überhaupt noch voneinander unterscheidbar sind, wenn das Betriebssystem alle
Farben überschreibt.

**Was zurückzumelden ist.** Je Spalte der gemessene Wert für den Titel und die tatsächliche
Optionsfarbe als Hexwert. Aus den Hexwerten lässt sich die Rechnung hier nachvollziehen; die
Messwerte allein reichen dafür nicht.

### Punkt 5 — Lädt das virtuelle Dataset-Control

**Vorab, ohne Umgebung, dreißig Sekunden** — der billigste Erkenntnisgewinn dieses ganzen Laufs:

```
pac pcf init -n Wegwerf -ns Wegwerf -t dataset -fw react -o <LEERES-VERZEICHNIS>
```

Nimmt die CLI das an, ist die Kombination im Werkzeug vorgesehen; das erzeugte
`ControlManifest.Input.xml` zeigt dann, wie der Hersteller sie schreibt — und ob es dabei Attribute
setzt, die unserem Manifest fehlen. Lehnt sie ab, ist Punkt 5 beantwortet, bevor irgendetwas
importiert wurde. **Das erzeugte Verzeichnis danach wegwerfen; nichts davon gehört ins
Repositorium.** Siehe Befund A.

**Was zu tun ist.** Nach Abschnitt 2 importieren und konfigurieren, Formular öffnen.

**Woran das Ergebnis erkennbar ist — und hier liegt die Falle.** Ein leerer Platz hat drei
verschiedene Ursachen, die im Browser gleich aussehen:

| Beobachtung | Deutung |
| --- | --- |
| Konsole zeigt einen Fehler zum Bundle-Abruf, Netzwerkreiter einen fehlgeschlagenen Aufruf | Das Bundle wird nicht geladen. Das ist der echte negative Befund. |
| Bundle wird geladen, Punkt-1-Meldung erscheint, aber nichts ist zu sehen | Das Control **läuft**. Der Container hat vermutlich Höhe null — Befund E. Kein negativer Befund für Punkt 5. |
| Weder Fehler noch Meldung, der Platz zeigt das gewohnte Subgrid | Das Control ist gar nicht konfiguriert oder die Veröffentlichung fehlt. |

**Der Container ist im Elementeninspektor zu prüfen, bevor irgendetwas als negativ gemeldet wird.**
Ein Element mit `height: 0` oder ohne Kinder unterscheidet die zweite Zeile von der ersten. Die
Verwechslung dieser beiden Fälle würde den ganzen Entwurf grundlos in Frage stellen.

**Was zurückzumelden ist.** Welche der drei Zeilen zutrifft; bei der ersten die Konsolenmeldung und
die fehlgeschlagene URL; bei der zweiten die berechnete Höhe des Containers aus dem Inspektor und der
Formfaktor, unter dem geprüft wurde. Und in jedem Fall: ob dieselbe Beobachtung auch auf breitem
Bildschirm gilt oder nur auf schmalem.

### Punkt 6 — Platform-Library-Versionen zur Laufzeit

**Diese Frage hat durch Befund B eine dokumentierte Erwartung bekommen.** Erwartet werden in einer
Model-Driven-App React `17.0.2` und Fluent `9.68.0`, nicht die angeforderten `16.14.0` und `9.4.0`.

**Was zu tun ist.** In der Konsole des laufenden Formulars auslesen, welche React-Fassung der Host
bereitstellt. **[Zu verifizieren: unter welchem globalen Namen die Plattform React ablegt — hier ist
kein Ausdruck belegt, und ein geratener wäre wertlos]** Ersatzweise über den Netzwerkreiter: nach den
Plattformbündeln filtern und die Dateinamen samt Versionsbestandteil notieren.

**Woran das Ergebnis erkennbar ist.** Drei Fälle:

- React `17.0.2` und Fluent `9.68.0`: dokumentationskonform. Punkt 6 ist damit beantwortet, und die
  Aufmerksamkeit verschiebt sich auf Punkt 2 — läuft unser gegen React 16 typisierter Code unter 17.
- Die angeforderten Fassungen `16.14.0` und `9.4.0`: Abweichung von der Doku, aber unkritisch, weil
  der Code genau dagegen gebaut ist.
- Etwas Drittes: nach Regel 15 sind `package.json` und Manifest gemeinsam nachzuziehen, mit
  Begründung im Changelog.

**Was zurückzumelden ist.** Die gefundenen Versionsstrings, die Quelle (Konsolenausdruck oder
Netzwerkeintrag), und ob im Bundle unseres Controls React tatsächlich fehlt — erkennbar an der Größe:
87.881 Byte im Entwicklungsbuild sind zu klein, um React und Fluent zu enthalten, was bestätigt, dass
die Platform Libraries beim Bauen wirksam waren. **[Repo]**

### Punkt 7 — Reihenfolge der Optionen

**Was zu tun ist.** Zwei Durchgänge. Erstens: Spaltenreihenfolge im Board mit der Reihenfolge im
Optionset-Editor vergleichen. Für `eo_progress` erwartet: `Draft`, `Work`, `Done`. Zweitens: eine
Option im Editor verschieben, veröffentlichen, Board hart neu laden.

**Woran das Ergebnis erkennbar ist.** Stimmt die Reihenfolge nach dem Verschieben mit, liefert die
Plattform die konfigurierte Reihenfolge. Bleibt sie oder wird sie numerisch nach dem Optionswert
sortiert, tut sie es nicht. Der Code sortiert nirgends — Regel 12 —, jede Reihenfolge im Board kommt
also von der Plattform. **[Repo: `KanbanBoard/model/grouping.ts`]**

**Zu beachten:** der Zwischenspeicher in `metadata.ts` gilt für die Lebensdauer der Control-Instanz.
Nach dem Veröffentlichen ist hart neu zu laden, sonst prüft man gegen den Zwischenspeicher.

**Was zurückzumelden ist.** Die Reihenfolge vor und nach dem Verschieben, jeweils als Liste der
Spaltentitel, und die zugehörigen numerischen Optionswerte. Erst aus beidem zusammen ist ablesbar, ob
numerisch sortiert wurde oder die konfigurierte Reihenfolge durchkam.

### Punkt 8 — Zusammenspiel mit der serverseitigen Kopplung

**Was zu tun ist.** Eine Karte per Board verschieben und zweierlei beobachten:

1. Läuft der Cloud Flow mit `filteringattributes = eo_progress` an? Im Flow-Ausführungsverlauf
   nachsehen, mit Zeitstempel.
2. Greift die Business Rule, die den RequiredLevel von `eo_assessmentresult` abhängig von
   `eo_progress` setzt? Danach denselben Datensatz im Formular öffnen und sehen, ob das Formular den
   Zustand als gültig ansieht.

**Woran das Ergebnis erkennbar ist.** Der Flow läuft an oder nicht — das ist eindeutig. Bei der
Business Rule ist die Erwartung, dass sie **nicht** greift: sie läuft ausschließlich clientseitig auf
dem Formular, und ein Verschieben per Board schreibt über `context.webAPI.updateRecord`. Der Beleg
dafür ist ein Datensatz, der nach dem Verschieben in einem Zustand steht, den das Formular so nicht
zugelassen hätte — etwa `eo_progress = Done` bei leerem `eo_assessmentresult`.

**Was zurückzumelden ist.** Für den Flow: angelaufen ja oder nein, mit Ausführungs-ID. Für die
Business Rule: der Zustand des Datensatzes nach dem Verschieben und was das Formular dazu sagt, wenn
man ihn danach öffnet. Diese Rückmeldung ist der Ausgangsstoff für `docs/GOVERNANCE.md` in M3.

### Punkt 9 — Die kleineren Punkte

| Frage | Was zu tun ist | Woran erkennbar | Was zu melden ist |
| --- | --- | --- | --- |
| Ist `Lookup.Simple` für `cardTitle` anwählbar? | Beim Konfigurieren die Auswahlliste für **Card title** öffnen | Erscheint `eo_assessor` darin? | Die vollständige Liste der angebotenen Spalten |
| Braucht `<data-set>` das Attribut `cds-data-set-options`? | Import und Konfiguration ohne das Attribut durchführen | Scheitert etwas mit einer Meldung, die Befehlsleiste, Ansichtswähler oder Schnellsuche nennt? | Die Meldung wörtlich |
| Lösen die resx-Zeichenketten in 1031 auf? | Benutzersprache auf Deutsch stellen, Board hart neu laden | Stehen deutsche Beschriftungen im Board, oder englische, oder die Schlüsselnamen selbst? | Ein Bildschirmfoto der Spaltenköpfe und der Eigenschaftenliste |
| Zählt der Spaltenzähler mit `+` richtig? | Ansicht mit mehr Datensätzen als `RecordsPerPage` | Zeigt eine Spalte `20+` statt `20`? | Der angezeigte Zähler, `RecordsPerPage` und die tatsächliche Datensatzzahl |
| Sind virtuelle Controls Preview oder GA? | Unabhängig klären, nicht am Verhalten ablesen | — | Die Aussage samt Quelle |

Zur letzten Zeile ein Hinweis, der die Frage nicht beantwortet, aber verortet: die Seite
`react-controls-platform-libraries.md` mit `ms.date: 10/10/2025` spricht an einer Stelle von „With GA
release, all existing virtual controls will continue to function", an anderer von „after this feature
reaches general availability". Die beiden Formulierungen widersprechen sich in der Zeitform. Nach
Regel 2 sind Vorschau-gegen-GA-Aussagen ausdrücklich von der Doku-Verifikation ausgenommen; für eine
Governance-Lösung bei 50Hertz bleibt das eine Freigabefrage an Microsoft, keine technische.

---

## 4. Rückweg von `virtual` auf `standard`

Nur für den Fall, dass Punkt 5 negativ ausfällt — also die erste Zeile der Tabelle dort, ein
tatsächlich nicht geladenes Bundle, nicht ein Container ohne Höhe. **Dies ist eine Abschätzung, keine
Umsetzung.**

### 4.1 Was die Dokumentation zum Umschalten sagt

Zwei Aussagen, beide **[Doku:
`powerapps-docs/developer/component-framework/react-controls-platform-libraries.md`]**:

> Zum `control-type`-Attribut: „Changing this value does not convert a component from one type to
> another."

> FAQ: „Q: Can I convert an existing standard control to a React control using platform libraries?
> A: No. You must create a new control using the new template and then update the manifest and
> index.ts methods."

Die FAQ beschreibt die Gegenrichtung, aber die erste Aussage ist richtungsneutral. **Das Umlegen des
Attributs allein genügt nicht.** Der belegte Weg ist ein neues Projekt aus der Standardvorlage
(`pac pcf init -t dataset` ohne `-fw react`) und ein Übertragen des Inhalts. Was dabei übertragen
wird, ist der Punkt der folgenden Abschätzung.

### 4.2 Was sich ändern müsste

| Datei | Änderung | Umfang |
| --- | --- | --- |
| `KanbanBoard/ControlManifest.Input.xml` | `control-type="virtual"` auf `standard`; beide `<platform-library>`-Elemente entfernen | zwei Zeilen weg, ein Attribut geändert |
| `KanbanBoard/index.ts` | `ReactControl` auf `StandardControl`; `init` bekommt den Container-`div`; `updateView` gibt `void` statt `ReactElement` zurück; `ReactDOM.render` in `updateView`, `unmountComponentAtNode` in `destroy` | eine Datei, etwa fünfzehn Zeilen |
| `package.json` | keine Änderung an `react`/`react-dom` nötig — sie sind bereits reguläre Abhängigkeiten und werden dann eben mitgebündelt | keine |
| `KanbanBoard/components/ErrorState.tsx` | siehe 4.3 | eine Zeile oder eine kleine Umschreibung |
| `docs/CI.md` | Bundlegröße und Abhängigkeitsanteil neu erheben | Text |
| Die Regeln 14 und 15 im Command | Regel 15 zur Versionsparität zwischen `package.json` und Manifest wird gegenstandslos, weil es keine `platform-library` mehr gibt | Text |

**Was sich nicht ändert.** Das ist der eigentliche Wert dieser Abschätzung: Modellschicht, Hooks,
Dienste, alle Komponenten außer `ErrorState.tsx`, sämtliche 218 Tests, die CSS-Datei, beide
resx-Dateien und die gesamte Ablaufsteuerung bleiben unberührt. Der Zuschnitt hat sich hier
ausgezahlt — `index.ts` ist die einzige Datei, die die Plattformschnittstelle kennt, und alles andere
hängt an `BoardRoot` und dessen Eigenschaften. **[Repo]**

### 4.3 Fluent — die einzige nicht offensichtliche Stelle

Von allen Dateien unter `KanbanBoard/` importiert **genau eine** aus `@fluentui/react-components`:
`ErrorState.tsx`, und zwar `Button`. **[Repo: `grep -rn "@fluentui" KanbanBoard/`]**

Damit stehen zwei Wege offen:

1. **Fluent mitbündeln.** Ein Fluent-9-`Button` zieht Griffel und dessen Laufzeit mit. Das ist die
   teuerste Zeile der ganzen Umstellung, für einen einzigen Knopf.
2. **Den `Button` durch ein natives `<button>` ersetzen**, gestaltet über `KanbanBoard.css`. Genau
   das tut `Card.tsx` bereits. **[Repo]** Damit entfiele Fluent vollständig aus dem Bundle, und die
   Umstellung bestünde in React 16 plus unserem eigenen Code.

**Weg 2 ist der empfohlene**, und er ist auch der ehrlichere: die Fluent-Themenbindung an den Host
ist beim Verlust der Platform Libraries ohnehin dahin. Ein mitgebündeltes Fluent bringt dann nicht
das Design des Hosts mit, sondern das Vorgabedesign von Fluent — und das sähe im Formular fremder aus
als ein Knopf in unserem eigenen CSS.

### 4.4 Was die Umstellung kostet

- **Bundlegröße.** Heute 87.881 Byte im Entwicklungsbuild. **[Repo]** Hinzu kämen React und
  React-DOM in Fassung 16.14 und, auf Weg 1, Fluent 9 mit Griffel. Eine Zahl steht hier bewusst
  nicht: sie ist nach der Umstellung in einer Minute zu messen und wäre vorher geraten.
- **Themenbindung.** Entfällt. Die Doku nennt „Design and theme alignment with the Power Apps Fluent
  design system" ausdrücklich als Nutzen der Platform Libraries. **[Doku: dieselbe Seite]**
- **Regel 15.** Wird gegenstandslos.
- **Die React-Fassung.** Mit dem Rückfall liefe der Code gegen React `16.14.0`, also gegen genau die
  Fassung, gegen die er typisiert und getestet ist. Das Risiko aus Befund B verschwände.
  Ein kleiner Trost an einer Stelle, an der es sonst wenige gibt.

### 4.5 Was vor der Kehrtwende zu prüfen wäre

Aus `docs/DEV-VERIFICATION.md` Punkt 5, hier bekräftigt und um Befund A und E erweitert: **erst
ausschließen, dass es an etwas anderem lag.** In dieser Reihenfolge:

1. Container ohne Höhe statt fehlendem Bundle — Befund E, siehe die Tabelle bei Punkt 5.
2. Fehlendes `cds-data-set-options` — Punkt 9.
3. Die Konfiguration über `property-set` statt die Kombination virtual mit dataset.
4. Der Vorabtest mit `pac pcf init -t dataset -fw react` — Befund A. Erzeugt die CLI das Gerüst
   anstandslos, ist ein Scheitern beim Laden mit hoher Wahrscheinlichkeit **nicht** der Kombination
   anzulasten, sondern unserem Manifest.

Erst wenn alle vier ausgeschlossen sind, ist der Rückweg das Thema.
