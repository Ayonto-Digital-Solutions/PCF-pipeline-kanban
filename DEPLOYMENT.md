# Deployment Guide

## Part 1 — Installing the packaged solution

### Prerequisites
- A Dataverse environment with System Customizer or System Administrator access
- The managed solution `.zip` from this repo's [Releases](../../releases) page

### Steps

1. [make.powerapps.com](https://make.powerapps.com) → **Solutions → Import solution** → select the zip
2. Go to the table you want this on (e.g. Opportunity) → **Views** → open the view you want the board on
3. In the view designer toolbar, click **Components**
4. Click **Add a component**, find **Pipeline Kanban**, select it
5. Set the properties:
   - `groupByField` (required) — the **logical name** of a Choice column on that table, e.g. `msdyn_forecastcategory`
   - `valueField` (optional) — the **logical name** of a currency/number column to total per column, e.g. `estimatedvalue`
6. Enable for Web (and Mobile/Tablet if wanted)
7. **Save**, then **Save and publish**
8. Open the table's records list, use **Show As** in the toolbar to switch to the Pipeline Kanban view

### Finding a column's logical name

If you don't already know it, run this in the browser console on any record of that table:

```js
fetch(`/api/data/v9.2/EntityDefinitions(LogicalName='yourtablename')/Attributes?$select=LogicalName,DisplayName`, {
  headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json" }
})
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(
    d.value.filter(a => JSON.stringify(a.DisplayName).toLowerCase().includes('yoursearchterm'))
      .map(a => a.LogicalName), null, 2
  )));
```

Replace `yourtablename` (e.g. `opportunity`) and `yoursearchterm` (e.g. `forecast`) — this avoids guessing at a field's logical name, since it isn't always what the display name suggests (e.g. Forecast Category's real name is `msdyn_forecastcategory`, not `forecastcategory`).

## Part 2 — Building from source

### Prerequisites
- Node.js LTS, .NET SDK, Power Platform CLI (`dotnet tool install --global Microsoft.PowerApps.CLI.Tool`)
- `pac auth create --url https://yourorg.crm.dynamics.com`

### Scaffold and build

```
pac pcf init --namespace YourNamespace --name PipelineKanban --template dataset --run-npm-install
```

Copy this repo's `PipelineKanban/ControlManifest.Input.xml`, `index.ts`, and `css/PipelineKanban.css` into the generated folder, overwriting the placeholders.

```
npm start
```

Confirms a clean compile (the harness itself won't have real data to bind to — that's expected).

```
pac pcf push --publisher-prefix yourprefix
```

### Package for distribution

1. In the maker portal, create a solution containing this control (**Solutions → New solution → Add existing → Custom control → Pipeline Kanban**)
2. **Export → Managed** → this is the zip to attach to a GitHub Release

### Versioning reminder

Bump the `version` attribute in `ControlManifest.Input.xml` every time you change the code before re-pushing. Dataverse uses this to decide whether to actually replace the compiled bundle in the target environment — leaving it unchanged across real code changes risks an environment silently continuing to serve an old bundle even after a "successful" push or import. Verify by checking the deployed `bundle.js` in the browser's Network tab for a string unique to your latest change before trusting a fix has landed.

## A note on manually testing a Choice-field grouping

Before wiring the control onto a view, it's worth confirming the Choice field's actual configured options directly:

```js
fetch(`/api/data/v9.2/EntityDefinitions(LogicalName='yourtablename')/Attributes(LogicalName='yourfieldname')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet`, {
  headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", "Accept": "application/json" }
})
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d.OptionSet.Options.map(o => ({value: o.Value, label: o.Label.UserLocalizedLabel?.Label})), null, 2)));
```

This shows exactly what columns the board will render, using the same endpoint the control itself calls at runtime.
