import * as React from "react";
import { BoardState, CardRecord, OptionValue } from "../model/types";
import { PagingSummary } from "../hooks/useDatasetRecords";
import { DragEvent, DragState, dropOutcome, readDropTarget } from "../hooks/useCardDrag";
import { Translate } from "./strings";
import { cardTitleOf, pagingNotice } from "./labels";
import { Column } from "./Column";
import { DragLayer } from "./DragLayer";

export interface BoardProps {
  readonly board: BoardState;
  readonly paging: PagingSummary;
  readonly translate: Translate;
  readonly allowDrag: boolean;
  readonly drag: DragState;
  readonly dispatchDrag: React.Dispatch<DragEvent>;
  readonly onOpenRecord: (recordId: string) => void;
  readonly onMove: (recordId: string, from: OptionValue | null, to: OptionValue | null) => void;
}

export const Board: React.FC<BoardProps> = ({
  board,
  paging,
  translate,
  allowDrag,
  drag,
  dispatchDrag,
  onOpenRecord,
  onMove,
}) => {
  const notice = pagingNotice(paging, translate);
  const suppressClick = React.useRef(false);
  const draggingCard = React.useRef<CardRecord | null>(null);

  const handleCardPointerDown = (event: React.PointerEvent<HTMLButtonElement>, card: CardRecord): void => {
    if (!allowDrag || event.button !== 0) {
      return;
    }
    draggingCard.current = card;
    if (typeof event.currentTarget.setPointerCapture === "function") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    dispatchDrag({
      kind: "pressed",
      recordId: card.id,
      from: typeof card.groupValue === "number" ? card.groupValue : null,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (drag.phase === "idle") {
      return;
    }
    dispatchDrag({ kind: "moved", pointerId: event.pointerId, x: event.clientX, y: event.clientY });
    if (drag.phase === "dragging") {
      dispatchDrag({ kind: "overColumn", target: readDropTarget(document.elementFromPoint(event.clientX, event.clientY)) });
    }
  };

  const handlePointerUp = (): void => {
    const outcome = dropOutcome(drag);
    suppressClick.current = drag.phase === "dragging";
    if (outcome !== null) {
      onMove(outcome.recordId, outcome.from, outcome.to);
    }
    draggingCard.current = null;
    dispatchDrag({ kind: "released" });
  };

  const handlePointerCancel = (): void => {
    suppressClick.current = drag.phase === "dragging";
    draggingCard.current = null;
    dispatchDrag({ kind: "cancelled" });
  };

  const handleOpenRecord = (recordId: string): void => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    onOpenRecord(recordId);
  };

  const ghost = drag.phase === "dragging" && draggingCard.current !== null ? draggingCard.current : null;

  return (
    <>
      {notice !== null ? <p className="ayonto-kanban-paging">{notice}</p> : null}
      <div
        className="ayonto-kanban-board"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {board.columns.map((column) => (
          <Column
            key={column.key}
            column={column}
            hasNextPage={paging.hasNextPage}
            translate={translate}
            draggable={allowDrag}
            isDropTarget={drag.phase === "dragging" && drag.target !== null && drag.target.key === column.key}
            draggingRecordId={drag.phase === "dragging" ? drag.recordId : null}
            onOpenRecord={handleOpenRecord}
            onCardPointerDown={handleCardPointerDown}
          />
        ))}
      </div>
      {ghost !== null && drag.phase === "dragging" ? (
        <DragLayer label={cardTitleOf(ghost, translate)} x={drag.x} y={drag.y} />
      ) : null}
    </>
  );
};
