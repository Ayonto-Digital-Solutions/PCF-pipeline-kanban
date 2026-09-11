import * as React from "react";
import { ColumnKey, OptionValue } from "../model/types";

export const DRAG_THRESHOLD_PX = 5;

export interface DropTarget {
  readonly key: ColumnKey;
  readonly value: OptionValue | null;
}

export type DragState =
  | { readonly phase: "idle" }
  | {
      readonly phase: "pressed";
      readonly recordId: string;
      readonly from: OptionValue | null;
      readonly pointerId: number;
      readonly originX: number;
      readonly originY: number;
    }
  | {
      readonly phase: "dragging";
      readonly recordId: string;
      readonly from: OptionValue | null;
      readonly pointerId: number;
      readonly x: number;
      readonly y: number;
      readonly target: DropTarget | null;
    };

export type DragEvent =
  | {
      readonly kind: "pressed";
      readonly recordId: string;
      readonly from: OptionValue | null;
      readonly pointerId: number;
      readonly x: number;
      readonly y: number;
    }
  | { readonly kind: "moved"; readonly pointerId: number; readonly x: number; readonly y: number }
  | { readonly kind: "overColumn"; readonly target: DropTarget | null }
  | { readonly kind: "released" }
  | { readonly kind: "cancelled" };

export const IDLE_DRAG: DragState = { phase: "idle" };

export function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

export function dragReducer(state: DragState, event: DragEvent): DragState {
  switch (event.kind) {
    case "pressed":
      return {
        phase: "pressed",
        recordId: event.recordId,
        from: event.from,
        pointerId: event.pointerId,
        originX: event.x,
        originY: event.y,
      };

    case "moved":
      if (state.phase === "idle" || state.pointerId !== event.pointerId) {
        return state;
      }
      if (state.phase === "pressed") {
        return distance(state.originX, state.originY, event.x, event.y) < DRAG_THRESHOLD_PX
          ? state
          : {
              phase: "dragging",
              recordId: state.recordId,
              from: state.from,
              pointerId: state.pointerId,
              x: event.x,
              y: event.y,
              target: null,
            };
      }
      return { ...state, x: event.x, y: event.y };

    case "overColumn":
      return state.phase === "dragging" ? { ...state, target: event.target } : state;

    case "released":
    case "cancelled":
      return IDLE_DRAG;

    default:
      return state;
  }
}

export interface DropOutcome {
  readonly recordId: string;
  readonly from: OptionValue | null;
  readonly to: OptionValue | null;
}

export function dropOutcome(state: DragState): DropOutcome | null {
  if (state.phase !== "dragging" || state.target === null) {
    return null;
  }
  if (state.target.value === state.from) {
    return null;
  }
  return { recordId: state.recordId, from: state.from, to: state.target.value };
}

export function isClick(state: DragState): boolean {
  return state.phase === "pressed";
}

export function readDropTarget(element: Element | null): DropTarget | null {
  const column = element === null ? null : element.closest("[data-column-key]");
  if (column === null) {
    return null;
  }
  const key = column.getAttribute("data-column-key");
  if (key === null) {
    return null;
  }
  const raw = column.getAttribute("data-column-value");
  if (raw === null || raw.length === 0) {
    return { key, value: null };
  }
  const value = Number(raw);
  return { key, value: Number.isFinite(value) ? value : null };
}

export interface CardDragBinding {
  readonly state: DragState;
  readonly dispatch: React.Dispatch<DragEvent>;
}

export function useCardDrag(): CardDragBinding {
  const [state, dispatch] = React.useReducer(dragReducer, IDLE_DRAG);
  return { state, dispatch };
}
