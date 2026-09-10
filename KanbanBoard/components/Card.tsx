import * as React from "react";
import { CardRecord } from "../model/types";
import { Translate } from "./strings";
import { cardTitleOf } from "./labels";

export interface CardProps {
  readonly card: CardRecord;
  readonly translate: Translate;
  readonly onOpen: (recordId: string) => void;
}

export const Card: React.FC<CardProps> = ({ card, translate, onOpen }) => (
  <button type="button" className="ayonto-kanban-card" onClick={() => { onOpen(card.id); }}>
    <span className="ayonto-kanban-card-title">{cardTitleOf(card, translate)}</span>
    {card.subtitle !== null ? <span className="ayonto-kanban-card-subtitle">{card.subtitle}</span> : null}
    {card.badge !== null ? <span className="ayonto-kanban-card-badge">{card.badge}</span> : null}
  </button>
);
