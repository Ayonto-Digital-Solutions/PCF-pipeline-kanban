import * as React from "react";
import { buildBoard } from "../model/grouping";
import { ColumnBinding, DatasetLike, useDatasetRecords } from "../hooks/useDatasetRecords";
import { useOptionMetadata } from "../hooks/useOptionMetadata";
import { OptionMetadataService } from "../services/metadata";
import { STRING, Translate } from "./strings";
import { Board } from "./Board";
import { ErrorState } from "./ErrorState";

export interface BoardRootProps {
  readonly service: OptionMetadataService;
  readonly entityName: string;
  readonly attributeName: string;
  readonly dataset: DatasetLike;
  readonly binding: ColumnBinding;
  readonly translate: Translate;
  readonly onOpenRecord: (recordId: string) => void;
}

export const BoardRoot: React.FC<BoardRootProps> = ({
  service,
  entityName,
  attributeName,
  dataset,
  binding,
  translate,
  onOpenRecord,
}) => {
  const metadata = useOptionMetadata(service, entityName, attributeName);
  const { records, paging } = useDatasetRecords(dataset, binding);

  if (metadata.state.status === "error") {
    return (
      <div className="ayonto-kanban-root">
        <ErrorState
          title={translate(STRING.errorTitle)}
          detail={metadata.state.message}
          retryLabel={translate(STRING.errorRetry)}
          onRetry={metadata.retry}
        />
      </div>
    );
  }

  if (metadata.state.status !== "ready" || dataset.loading) {
    return (
      <div className="ayonto-kanban-root">
        <p className="ayonto-kanban-loading">{translate(STRING.boardLoading)}</p>
      </div>
    );
  }

  const board = buildBoard({
    options: metadata.state.options,
    records,
    unassignedLabel: translate(STRING.columnUnassigned),
  });

  return (
    <div className="ayonto-kanban-root">
      <Board board={board} paging={paging} translate={translate} onOpenRecord={onOpenRecord} />
    </div>
  );
};
