import * as React from "react";
import { BoardColumn } from "../model/types";
import { accentFor, headerTintFor, readableTextOn } from "../model/contrast";
import { STRING, Translate } from "./strings";
import { columnCountLabel } from "./labels";
import { Card } from "./Card";
import { EmptyState } from "./EmptyState";

export interface ColumnProps {
  readonly column: BoardColumn;
  readonly hasNextPage: boolean;
  readonly translate: Translate;
  readonly onOpenRecord: (recordId: string) => void;
}

export const Column: React.FC<ColumnProps> = ({ column, hasNextPage, translate, onOpenRecord }) => {
  const tint = headerTintFor(column.color);
  const headerStyle: React.CSSProperties = { backgroundColor: tint, color: readableTextOn(tint) };
  const accentStyle: React.CSSProperties = { backgroundColor: accentFor(column.color) };

  return (
    <section className="ayonto-kanban-column">
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
            <Card key={card.id} card={card} translate={translate} onOpen={onOpenRecord} />
          ))
        )}
      </div>
    </section>
  );
};
