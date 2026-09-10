import * as React from "react";
import { buildBoard, normalizeOptionValue } from "../model/grouping";
import { applyOverrides } from "../model/reconcile";
import { OptionValue } from "../model/types";
import { ColumnBinding, DatasetLike, useDatasetRecords } from "../hooks/useDatasetRecords";
import { useCardDrag } from "../hooks/useCardDrag";
import { useKeyboardDrag } from "../hooks/useKeyboardDrag";
import { MoveWriter, useOptimisticMove } from "../hooks/useOptimisticMove";
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
  readonly allowDrag: boolean;
  readonly writer: MoveWriter;
  readonly onOpenRecord: (recordId: string) => void;
  readonly onMoved: () => void;
}

export const BoardRoot: React.FC<BoardRootProps> = ({
  service,
  entityName,
  attributeName,
  dataset,
  binding,
  translate,
  allowDrag,
  writer,
  onOpenRecord,
  onMoved,
}) => {
  const metadata = useOptionMetadata(service, entityName, attributeName);
  const { records, paging } = useDatasetRecords(dataset, binding);
  const { registry, move, observe } = useOptimisticMove(writer, entityName, attributeName);
  const drag = useCardDrag();
  const keyboard = useKeyboardDrag();

  React.useEffect(() => {
    const values = new Map<string, OptionValue | null>();
    records.forEach((record) => {
      values.set(record.id, normalizeOptionValue(record.groupValue));
    });
    observe(values);
  }, [records, observe]);

  const handleMove = React.useCallback(
    async (recordId: string, from: OptionValue | null, to: OptionValue | null): Promise<boolean> => {
      const accepted = await move(recordId, from, to);
      onMoved();
      return accepted;
    },
    [move, onMoved]
  );

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
    records: applyOverrides(records, registry),
    unassignedLabel: translate(STRING.columnUnassigned),
  });

  return (
    <div className="ayonto-kanban-root">
      <Board
        board={board}
        paging={paging}
        translate={translate}
        allowDrag={allowDrag}
        drag={drag.state}
        dispatchDrag={drag.dispatch}
        keyboard={keyboard.state}
        dispatchKeyboard={keyboard.dispatch}
        onOpenRecord={onOpenRecord}
        onMove={handleMove}
      />
    </div>
  );
};
