import * as React from "react";
import { BoardState, CardRecord, OptionValue } from "../model/types";
import { normalizeOptionValue } from "../model/grouping";
import { PagingSummary } from "../hooks/useDatasetRecords";
import { DragEvent, DragState, dropOutcome, readDropTarget } from "../hooks/useCardDrag";
import {
  KeyboardDragEvent,
  KeyboardDragState,
  keyboardDropOutcome,
} from "../hooks/useKeyboardDrag";
import { Translate } from "./strings";
import {
  cardTitleOf,
  grabbedAnnouncement,
  pagingNotice,
  resultAnnouncement,
  targetAnnouncement,
} from "./labels";
import { Column } from "./Column";
import { DragLayer } from "./DragLayer";
import { LiveRegion } from "./LiveRegion";

export interface BoardProps {
  readonly board: BoardState;
  readonly paging: PagingSummary;
  readonly translate: Translate;
  readonly allowDrag: boolean;
  readonly drag: DragState;
  readonly dispatchDrag: React.Dispatch<DragEvent>;
  readonly keyboard: KeyboardDragState;
  readonly dispatchKeyboard: React.Dispatch<KeyboardDragEvent>;
  readonly onOpenRecord: (recordId: string) => void;
  readonly onMove: (recordId: string, from: OptionValue | null, to: OptionValue | null) => Promise<boolean>;
}

const SPACE_KEYS = [" ", "Spacebar"];

export const Board: React.FC<BoardProps> = ({
  board,
  paging,
  translate,
  allowDrag,
  drag,
  dispatchDrag,
  keyboard,
  dispatchKeyboard,
  onOpenRecord,
  onMove,
}) => {
  const notice = pagingNotice(paging, translate);
  const suppressClick = React.useRef(false);
  const draggingCard = React.useRef<CardRecord | null>(null);
  const [announcement, setAnnouncement] = React.useState("");
  const [focusRecordId, setFocusRecordId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (focusRecordId === null) {
      return;
    }
    const element = document.querySelector<HTMLElement>(`[data-record-id="${focusRecordId}"]`);
    if (element !== null) {
      element.focus();
    }
  }, [focusRecordId, board]);

  const handleCardPointerDown = (event: React.PointerEvent<HTMLButtonElement>, card: CardRecord): void => {
    if (!allowDrag || event.button !== 0 || keyboard.phase === "grabbed") {
      return;
    }
    draggingCard.current = card;
    if (typeof event.currentTarget.setPointerCapture === "function") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    dispatchDrag({
      kind: "pressed",
      recordId: card.id,
      from: normalizeOptionValue(card.groupValue),
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
      dispatchDrag({
        kind: "overColumn",
        target: readDropTarget(document.elementFromPoint(event.clientX, event.clientY)),
      });
    }
  };

  const handlePointerUp = (): void => {
    const outcome = dropOutcome(drag);
    suppressClick.current = drag.phase === "dragging";
    if (outcome !== null) {
      void onMove(outcome.recordId, outcome.from, outcome.to);
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

  const settle = async (card: CardRecord, targetIndex: number): Promise<void> => {
    const target = board.columns[targetIndex];
    const origin = board.columns[keyboard.phase === "grabbed" ? keyboard.originColumnIndex : targetIndex];
    const outcome = keyboardDropOutcome(keyboard, target.value);
    dispatchKeyboard({ kind: "dropped" });
    setFocusRecordId(card.id);

    if (outcome === null) {
      setAnnouncement(resultAnnouncement("unchanged", cardTitleOf(card, translate), origin.label, translate));
      return;
    }

    setAnnouncement(resultAnnouncement("moved", cardTitleOf(card, translate), target.label, translate));
    const accepted = await onMove(outcome.recordId, outcome.from, outcome.to);
    if (!accepted) {
      setAnnouncement(resultAnnouncement("rejected", cardTitleOf(card, translate), origin.label, translate));
      setFocusRecordId(null);
      setFocusRecordId(card.id);
    }
  };

  const handleCardKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    card: CardRecord,
    columnIndex: number,
    cardIndex: number
  ): void => {
    if (!allowDrag) {
      return;
    }

    if (SPACE_KEYS.includes(event.key)) {
      event.preventDefault();
      if (keyboard.phase === "grabbed") {
        void settle(card, keyboard.columnIndex);
        return;
      }
      dispatchKeyboard({
        kind: "grabbed",
        recordId: card.id,
        from: normalizeOptionValue(card.groupValue),
        columnIndex,
        cardIndex,
      });
      setAnnouncement(grabbedAnnouncement(cardTitleOf(card, translate), board.columns[columnIndex].label, translate));
      return;
    }

    if (keyboard.phase !== "grabbed") {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      const origin = board.columns[keyboard.originColumnIndex];
      dispatchKeyboard({ kind: "cancelled" });
      setAnnouncement(resultAnnouncement("cancelled", cardTitleOf(card, translate), origin.label, translate));
      setFocusRecordId(card.id);
      return;
    }

    const columnDelta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (columnDelta !== 0) {
      event.preventDefault();
      const next = Math.min(board.columns.length - 1, Math.max(0, keyboard.columnIndex + columnDelta));
      dispatchKeyboard({ kind: "columnStep", delta: columnDelta, columnCount: board.columns.length });
      setAnnouncement(targetAnnouncement(board.columns[next].label, 0, board.columns[next].cards.length, translate));
      return;
    }

    const cardDelta = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
    if (cardDelta !== 0) {
      event.preventDefault();
      const column = board.columns[keyboard.columnIndex];
      const next = Math.min(Math.max(column.cards.length - 1, 0), Math.max(0, keyboard.cardIndex + cardDelta));
      dispatchKeyboard({ kind: "cardStep", delta: cardDelta, cardCount: column.cards.length });
      setAnnouncement(targetAnnouncement(column.label, next, column.cards.length, translate));
    }
  };

  const ghost = drag.phase === "dragging" && draggingCard.current !== null ? draggingCard.current : null;
  const keyboardTargetKey =
    keyboard.phase === "grabbed" ? board.columns[keyboard.columnIndex].key : null;

  return (
    <>
      {notice !== null ? <p className="ayonto-kanban-paging">{notice}</p> : null}
      <div
        className="ayonto-kanban-board"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {board.columns.map((column, columnIndex) => (
          <Column
            key={column.key}
            column={column}
            columnIndex={columnIndex}
            hasNextPage={paging.hasNextPage}
            translate={translate}
            draggable={allowDrag}
            isDropTarget={
              (drag.phase === "dragging" && drag.target !== null && drag.target.key === column.key) ||
              keyboardTargetKey === column.key
            }
            draggingRecordId={drag.phase === "dragging" ? drag.recordId : null}
            grabbedRecordId={keyboard.phase === "grabbed" ? keyboard.recordId : null}
            onOpenRecord={handleOpenRecord}
            onCardPointerDown={handleCardPointerDown}
            onCardKeyDown={handleCardKeyDown}
          />
        ))}
      </div>
      {ghost !== null && drag.phase === "dragging" ? (
        <DragLayer label={cardTitleOf(ghost, translate)} x={drag.x} y={drag.y} />
      ) : null}
      <LiveRegion message={announcement} />
    </>
  );
};
