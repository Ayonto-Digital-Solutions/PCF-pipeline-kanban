import { IInputs, IOutputs } from "./generated/ManifestTypes";

type EntityRecord = ComponentFramework.PropertyHelper.DataSetApi.EntityRecord;
type DataSet = ComponentFramework.PropertyTypes.DataSet;

interface ColumnOption {
  value: number;
  label: string;
}

interface OptionSetOption {
  Value: number;
  Label: { UserLocalizedLabel: { Label: string } | null };
}

interface PicklistMetadataResponse {
  OptionSet?: { Options: OptionSetOption[] };
}

export class PipelineKanban implements ComponentFramework.StandardControl<IInputs, IOutputs> {
  private container!: HTMLDivElement;
  private context!: ComponentFramework.Context<IInputs>;
  private notifyOutputChanged!: () => void;

  private entityTypeName = "";
  private groupByField = "";
  private valueField = "";

  private columns: ColumnOption[] = [];
  private columnsLoaded = false;
  private columnsLoadFailed = false;

  // Optimistic local override so a dragged card jumps columns immediately,
  // before the server round trip / dataset refresh confirms it.
  private pendingOverrides: Record<string, number> = {};

  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this.context = context;
    this.notifyOutputChanged = notifyOutputChanged;
    this.container = container;

    this.groupByField = context.parameters.groupByField.raw ?? "";
    this.valueField = context.parameters.valueField.raw ?? "";
    this.entityTypeName = context.parameters.records.getTargetEntityType();

    this.renderShell("Loading board\u2026");
    this.loadColumns();
  }

  public updateView(context: ComponentFramework.Context<IInputs>): void {
    this.context = context;
    this.render();
  }

  public getOutputs(): IOutputs {
    return {};
  }

  public destroy(): void {
    this.container.innerHTML = "";
  }

  // ---------- column metadata ----------

  private async loadColumns(): Promise<void> {
    try {
      const url =
        `/api/data/v9.2/EntityDefinitions(LogicalName='${this.entityTypeName}')` +
        `/Attributes(LogicalName='${this.groupByField}')` +
        `/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet`;

      const response = await fetch(url, {
        headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", Accept: "application/json" },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = (await response.json()) as PicklistMetadataResponse;
      const options = data.OptionSet?.Options ?? [];

      this.columns = options
        .map((o) => ({
          value: o.Value,
          label: o.Label.UserLocalizedLabel?.Label ?? `(${o.Value})`,
        }))
        .sort((a, b) => a.value - b.value);

      this.columnsLoaded = true;
    } catch (err) {
      this.columnsLoadFailed = true;
      this.renderShell(
        `Couldn't load columns for "${this.groupByField}" on "${this.entityTypeName}": ${(err as Error).message}`
      );
      return;
    }
    this.render();
  }

  // ---------- rendering ----------

  private renderShell(message: string): void {
    this.container.innerHTML = `<div class="pk-root"><div class="pk-status">${message}</div></div>`;
  }

  private render(): void {
    if (!this.columnsLoaded || this.columnsLoadFailed) return;

    const dataSet = this.context.parameters.records;
    if (dataSet.loading) {
      this.renderShell("Loading records\u2026");
      return;
    }
    if (dataSet.error) {
      this.renderShell(`Couldn't load records: ${dataSet.errorMessage ?? "unknown error"}`);
      return;
    }

    const records = dataSet.sortedRecordIds.map((id: string) => dataSet.records[id]);
    const grouped = this.groupRecords(records);

    const root = document.createElement("div");
    root.className = "pk-root";

    const board = document.createElement("div");
    board.className = "pk-board";

    // "Unassigned" column first for anything with no/unknown value, then the
    // real columns in the Option Set's own defined order.
    const unassigned = grouped.get(-1) ?? [];
    board.appendChild(this.buildColumn(-1, "Unassigned", unassigned));

    this.columns.forEach((col) => {
      const colRecords = grouped.get(col.value) ?? [];
      board.appendChild(this.buildColumn(col.value, col.label, colRecords));
    });

    root.appendChild(board);
    this.container.innerHTML = "";
    this.container.appendChild(root);
  }

  private groupRecords(records: EntityRecord[]): Map<number, EntityRecord[]> {
    const grouped = new Map<number, EntityRecord[]>();
    records.forEach((record) => {
      const recordId = record.getRecordId();
      const override = this.pendingOverrides[recordId];
      const rawValue = override !== undefined ? override : record.getValue(this.groupByField);

      // Normalize to a number before comparing — the dataset API's raw
      // value for a Choice/Option Set column isn't guaranteed to come back
      // as the same type as our column metadata (observed: a fresh fetch
      // can return it as a string, while the metadata endpoint gives us
      // numbers, so a strict === comparison silently failed for every
      // genuinely-set record on reload even though the write itself worked).
      const numericValue =
        rawValue === null || rawValue === undefined ? null : Number(rawValue);

      const isKnownValue =
        numericValue !== null && !Number.isNaN(numericValue) &&
        this.columns.some((c) => c.value === numericValue);
      const key = isKnownValue ? (numericValue as number) : -1;

      const bucket = grouped.get(key) ?? [];
      bucket.push(record);
      grouped.set(key, bucket);
    });
    return grouped;
  }

  private buildColumn(value: number, label: string, records: EntityRecord[]): HTMLElement {
    const col = document.createElement("div");
    col.className = "pk-column";
    col.dataset.columnValue = String(value);

    let totalText = "";
    if (this.valueField) {
      const total = records.reduce((sum, r) => {
        const raw = r.getValue(this.valueField) as number | string | null;
        const num = typeof raw === "number" ? raw : Number(raw);
        return sum + (Number.isFinite(num) ? num : 0);
      }, 0);
      totalText = `<div class="pk-col-total">${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>`;
    }

    col.innerHTML = `
      <div class="pk-col-head">
        <span class="pk-col-title">${label}</span>
        <span class="pk-col-count">${records.length}</span>
      </div>
      ${totalText}
      <div class="pk-col-body" data-drop-target="${value}"></div>
      <button class="pk-add-btn" data-add-to="${value}">+ New</button>
    `;

    const body = col.querySelector(".pk-col-body") as HTMLElement;
    records.forEach((record) => body.appendChild(this.buildCard(record)));

    this.attachColumnHandlers(col, value);
    return col;
  }

  private buildCard(record: EntityRecord): HTMLElement {
    const card = document.createElement("div");
    card.className = "pk-card";
    card.draggable = true;
    card.dataset.recordId = record.getRecordId();

    const ref = record.getNamedReference();
    const title = ref.name ?? "(no name)";
    const formattedValue = this.valueField ? record.getFormattedValue(this.valueField) : "";
    const valueLine =
      this.valueField && formattedValue
        ? `<div class="pk-card-value">${formattedValue}</div>`
        : "";

    card.innerHTML = `
      <div class="pk-card-title">${title}</div>
      ${valueLine}
    `;

    card.addEventListener("dragstart", (e) => {
      e.dataTransfer?.setData("text/plain", record.getRecordId());
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => card.classList.remove("dragging"));
    card.addEventListener("click", () => {
      this.context.parameters.records.openDatasetItem(ref);
    });

    return card;
  }

  private attachColumnHandlers(col: HTMLElement, columnValue: number): void {
    const body = col.querySelector(".pk-col-body") as HTMLElement;

    body.addEventListener("dragover", (e) => {
      e.preventDefault();
      body.classList.add("pk-drop-hover");
    });
    body.addEventListener("dragleave", () => body.classList.remove("pk-drop-hover"));
    body.addEventListener("drop", (e) => {
      e.preventDefault();
      body.classList.remove("pk-drop-hover");
      const recordId = e.dataTransfer?.getData("text/plain");
      if (recordId) this.moveCard(recordId, columnValue);
    });

    const addBtn = col.querySelector(".pk-add-btn") as HTMLButtonElement;
    addBtn.addEventListener("click", () => this.createInColumn(columnValue));
  }

  // ---------- actions ----------

  private async moveCard(recordId: string, newValue: number): Promise<void> {
    if (newValue === -1) {
      // Dragging into "Unassigned" would mean clearing the field — supported,
      // but confirm since it's an unusual action for a kanban board.
      const confirmed = window.confirm("Clear this record's stage value?");
      if (!confirmed) {
        this.render();
        return;
      }
    }

    this.pendingOverrides[recordId] = newValue;
    this.render();

    try {
      const payload: Record<string, unknown> = {};
      payload[this.groupByField] = newValue === -1 ? null : newValue;
      await this.context.webAPI.updateRecord(this.entityTypeName, recordId, payload);
      this.context.parameters.records.refresh();
    } catch (err) {
      delete this.pendingOverrides[recordId];
      window.alert(`Couldn't move record: ${(err as Error).message}`);
      this.render();
    }
  }

  private createInColumn(columnValue: number): void {
    this.context.navigation
      .openForm({ entityName: this.entityTypeName, useQuickCreateForm: true })
      .then(async (response) => {
        // The quick-create dialog defaults an unset Choice field to whatever
        // its first option happens to be — not "whichever column's + New
        // button was clicked." Explicitly set the real value on the record
        // that was actually saved, using the reference the platform gives
        // back on success.
        const saved = response?.savedEntityReference?.[0];
        if (saved) {
          const recordId = saved.id.replace(/[{}]/g, "");
          const payload: Record<string, unknown> = {};
          payload[this.groupByField] = columnValue === -1 ? null : columnValue;
          try {
            await this.context.webAPI.updateRecord(this.entityTypeName, recordId, payload);
          } catch (err) {
            window.alert(`Created, but couldn't set the stage: ${(err as Error).message}`);
          }
        }
        this.context.parameters.records.refresh();
        return;
      })
      .catch(() => {
        /* user cancelled quick create — nothing to do */
      });
  }
}
