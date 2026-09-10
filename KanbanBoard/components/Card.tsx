import * as React from "react";
import { CardRecord } from "../model/types";
import { Translate } from "./strings";
import { cardTitleOf } from "./labels";

export interface CardProps {
  readonly card: CardRecord;
  readonly translate: Translate;
  readonly draggable: boolean;
  readonly dragging: boolean;
  readonly onOpen: (recordId: string) => void;
  readonly onPointerDown: (event: React.PointerEvent<HTMLButtonElement>, card: CardRecord) => void;
}

export const Card: React.FC<CardProps> = ({ card, translate, draggable, dragging, onOpen, onPointerDown }) => (
  <button
    type="button"
    className={dragging ? "ayonto-kanban-card is-dragging" : "ayonto-kanban-card"}
    data-record-id={card.id}
    data-draggable={draggable ? "true" : "false"}
    onPointerDown={(event) => {
      onPointerDown(event, card);
    }}
    onClick={() => {
      onOpen(card.id);
    }}
  >
    <span className="ayonto-kanban-card-title">{cardTitleOf(card, translate)}</span>
    {card.subtitle !== null ? <span className="ayonto-kanban-card-subtitle">{card.subtitle}</span> : null}
    {card.badge !== null ? <span className="ayonto-kanban-card-badge">{card.badge}</span> : null}
  </button>
);
