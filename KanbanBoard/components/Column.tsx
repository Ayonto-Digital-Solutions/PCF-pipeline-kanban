import * as React from "react";
import { BoardColumn, CardRecord } from "../model/types";
import { accentFor, headerTintFor, readableTextOn } from "../model/contrast";
import { STRING, Translate } from "./strings";
import { columnCountLabel } from "./labels";
import { Card } from "./Card";
import { EmptyState } from "./EmptyState";

export interface ColumnProps {
  readonly column: BoardColumn;
  readonly hasNextPage: boolean;
  readonly translate: Translate;
  readonly draggable: boolean;
  readonly isDropTarget: boolean;
  readonly draggingRecordId: string | null;
  readonly onOpenRecord: (recordId: string) => void;
  readonly onCardPointerDown: (event: React.PointerEvent<HTMLButtonElement>, card: CardRecord) => void;
}

export const Column: React.FC<ColumnProps> = ({
  column,
  hasNextPage,
  translate,
  draggable,
  isDropTarget,
  draggingRecordId,
  onOpenRecord,
  onCardPointerDown,
}) => {
  const tint = headerTintFor(column.color);
  const headerStyle: React.CSSProperties = { backgroundColor: tint, color: readableTextOn(tint) };
  const accentStyle: React.CSSProperties = { backgroundColor: accentFor(column.color) };

  return (
    <section
      className={isDropTarget ? "ayonto-kanban-column is-drop-target" : "ayonto-kanban-column"}
      data-column-key={column.key}
      data-column-value={column.value === null ? "" : String(column.value)}
    >
      <header className="ayonto-kanban-column-head" style={headerStyle}>
        <span className="ayonto-kanban-column-accent" style={accentStyle} />
        <span className="ayonto-kanban-column-title">{column.label}</span>
        <span className="ayonto-kanban-column-count">
          {columnCountLabel(column.cards.length, hasNextPage, translate)}
        </span>
      </header>
      <div className="ayonto-kanban-column-body">
        {column.cards.length === 0 ? (
          <EmptyState message={translate(STRING.columnEmpty)} />
        ) : (
          column.cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              translate={translate}
              draggable={draggable}
              dragging={card.id === draggingRecordId}
              onOpen={onOpenRecord}
              onPointerDown={onCardPointerDown}
            />
          ))
        )}
      </div>
    </section>
  );
};
