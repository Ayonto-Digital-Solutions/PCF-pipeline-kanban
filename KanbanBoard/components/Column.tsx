import * as React from "react";
import { BoardColumn, CardRecord } from "../model/types";
import { accentFor, headerTintFor, readableTextOn } from "../model/contrast";
import { STRING, Translate } from "./strings";
import { columnAccessibleName, columnCountLabel } from "./labels";
import { Card } from "./Card";
import { EmptyState } from "./EmptyState";

export interface ColumnProps {
  readonly column: BoardColumn;
  readonly columnIndex: number;
  readonly hasNextPage: boolean;
  readonly translate: Translate;
  readonly draggable: boolean;
  readonly isDropTarget: boolean;
  readonly draggingRecordId: string | null;
  readonly grabbedRecordId: string | null;
  readonly onOpenRecord: (recordId: string) => void;
  readonly onCardPointerDown: (event: React.PointerEvent<HTMLButtonElement>, card: CardRecord) => void;
  readonly onCardKeyDown: (
    event: React.KeyboardEvent<HTMLButtonElement>,
    card: CardRecord,
    columnIndex: number,
    cardIndex: number
  ) => void;
}

export const Column: React.FC<ColumnProps> = ({
  column,
  columnIndex,
  hasNextPage,
  translate,
  draggable,
  isDropTarget,
  draggingRecordId,
  grabbedRecordId,
  onOpenRecord,
  onCardPointerDown,
  onCardKeyDown,
}) => {
  const tint = headerTintFor(column.color);
  const headerStyle: React.CSSProperties = { backgroundColor: tint, color: readableTextOn(tint) };
  const accentStyle: React.CSSProperties = { backgroundColor: accentFor(column.color) };

  return (
    <div
      className={isDropTarget ? "ayonto-kanban-column is-drop-target" : "ayonto-kanban-column"}
      data-column-key={column.key}
      data-column-value={column.value === null ? "" : String(column.value)}
      data-drop-target={isDropTarget ? "true" : "false"}
    >
      <div className="ayonto-kanban-column-head" style={headerStyle}>
        <span className="ayonto-kanban-column-accent" style={accentStyle} />
        <span className="ayonto-kanban-column-title">{column.label}</span>
        <span className="ayonto-kanban-column-count">
          {columnCountLabel(column.cards.length, hasNextPage, translate)}
        </span>
      </div>
      <div className="ayonto-kanban-column-body" role="list" aria-label={columnAccessibleName(column, translate)}>
        {column.cards.length === 0 ? (
          <EmptyState message={translate(STRING.columnEmpty)} />
        ) : (
          column.cards.map((card, cardIndex) => (
            <div className="ayonto-kanban-card-slot" role="listitem" key={card.id}>
              <Card
                card={card}
                translate={translate}
                draggable={draggable}
                dragging={card.id === draggingRecordId}
                grabbed={card.id === grabbedRecordId}
                onOpen={onOpenRecord}
                onPointerDown={onCardPointerDown}
                onKeyDown={(event, target) => {
                  onCardKeyDown(event, target, columnIndex, cardIndex);
                }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
