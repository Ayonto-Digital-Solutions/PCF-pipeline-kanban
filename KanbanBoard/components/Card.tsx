import * as React from "react";
import { CardRecord } from "../model/types";
import { Translate } from "./strings";
import { cardTitleOf } from "./labels";

export interface CardProps {
  readonly card: CardRecord;
  readonly translate: Translate;
  readonly draggable: boolean;
  readonly dragging: boolean;
  readonly grabbed: boolean;
  readonly onOpen: (recordId: string) => void;
  readonly onPointerDown: (event: React.PointerEvent<HTMLButtonElement>, card: CardRecord) => void;
  readonly onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>, card: CardRecord) => void;
}

function classNameFor(dragging: boolean, grabbed: boolean): string {
  const names = ["ayonto-kanban-card"];
  if (dragging) {
    names.push("is-dragging");
  }
  if (grabbed) {
    names.push("is-grabbed");
  }
  return names.join(" ");
}

export const Card: React.FC<CardProps> = ({
  card,
  translate,
  draggable,
  dragging,
  grabbed,
  onOpen,
  onPointerDown,
  onKeyDown,
}) => (
  <button
    type="button"
    className={classNameFor(dragging, grabbed)}
    data-record-id={card.id}
    data-draggable={draggable ? "true" : "false"}
    onPointerDown={(event) => {
      onPointerDown(event, card);
    }}
    onKeyDown={(event) => {
      onKeyDown(event, card);
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
