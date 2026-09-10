import * as React from "react";
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { BoardRoot } from "./components/BoardRoot";
import {
  DatasetLike,
  resolveBinding,
  resolveGroupByAttribute,
} from "./hooks/useDatasetRecords";
import {
  OptionMetadataService,
  createOptionMetadataService,
  fetchOptionSetMetadata,
} from "./services/metadata";

export class KanbanBoard implements ComponentFramework.ReactControl<IInputs, IOutputs> {
  private service!: OptionMetadataService;
  private context!: ComponentFramework.Context<IInputs>;

  public init(
    context: ComponentFramework.Context<IInputs>,
    _notifyOutputChanged: () => void,
    _state: ComponentFramework.Dictionary
  ): void {
    this.context = context;
    this.service = createOptionMetadataService({
      getEntityMetadata: (entityName, attributes) => this.context.utils.getEntityMetadata(entityName, attributes),
      fetchMetadataEndpoint: fetchOptionSetMetadata,
      log: (message) => {
        globalThis.console.info(message);
      },
    });
  }

  public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
    this.context = context;
    const dataset = context.parameters.records as unknown as DatasetLike;

    return React.createElement(BoardRoot, {
      service: this.service,
      entityName: context.parameters.records.getTargetEntityType(),
      attributeName: resolveGroupByAttribute(dataset) ?? "",
      dataset,
      binding: resolveBinding(dataset),
      translate: (key: string) => context.resources.getString(key),
      allowDrag: context.parameters.allowDrag.raw,
      writer: {
        updateRecord: (entityName, recordId, payload) =>
          context.webAPI.updateRecord(entityName, recordId, payload),
      },
      onMoved: () => {
        context.parameters.records.refresh();
      },
      onOpenRecord: (recordId: string) => {
        const record = context.parameters.records.records[recordId];
        if (record !== undefined) {
          context.parameters.records.openDatasetItem(record.getNamedReference());
        }
      },
    });
  }

  public getOutputs(): IOutputs {
    return {};
  }

  public destroy(): void {
    return;
  }
}
