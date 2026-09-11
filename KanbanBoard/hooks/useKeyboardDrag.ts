import * as React from "react";
import { OptionValue } from "../model/types";

export type KeyboardDragState =
  | { readonly phase: "idle" }
  | {
      readonly phase: "grabbed";
      readonly recordId: string;
      readonly from: OptionValue | null;
      readonly originColumnIndex: number;
      readonly columnIndex: number;
      readonly cardIndex: number;
    };

export type KeyboardDragEvent =
  | {
      readonly kind: "grabbed";
      readonly recordId: string;
      readonly from: OptionValue | null;
      readonly columnIndex: number;
      readonly cardIndex: number;
    }
  | { readonly kind: "columnStep"; readonly delta: number; readonly columnCount: number }
  | { readonly kind: "cardStep"; readonly delta: number; readonly cardCount: number }
  | { readonly kind: "dropped" }
  | { readonly kind: "cancelled" };

export const IDLE_KEYBOARD_DRAG: KeyboardDragState = { phase: "idle" };

export function clampIndex(value: number, count: number): number {
  if (count <= 0) {
    return 0;
  }
  return Math.min(count - 1, Math.max(0, value));
}

export function keyboardDragReducer(
  state: KeyboardDragState,
  event: KeyboardDragEvent
): KeyboardDragState {
  if (event.kind === "grabbed") {
    return {
      phase: "grabbed",
      recordId: event.recordId,
      from: event.from,
      originColumnIndex: event.columnIndex,
      columnIndex: event.columnIndex,
      cardIndex: event.cardIndex,
    };
  }

  if (state.phase !== "grabbed") {
    return state;
  }

  switch (event.kind) {
    case "columnStep": {
      const columnIndex = clampIndex(state.columnIndex + event.delta, event.columnCount);
      return columnIndex === state.columnIndex ? state : { ...state, columnIndex, cardIndex: 0 };
    }

    case "cardStep": {
      const cardIndex = clampIndex(state.cardIndex + event.delta, event.cardCount);
      return cardIndex === state.cardIndex ? state : { ...state, cardIndex };
    }

    case "dropped":
    case "cancelled":
      return IDLE_KEYBOARD_DRAG;

    default:
      return state;
  }
}

export interface KeyboardDropOutcome {
  readonly recordId: string;
  readonly from: OptionValue | null;
  readonly to: OptionValue | null;
}

export function keyboardDropOutcome(
  state: KeyboardDragState,
  targetValue: OptionValue | null
): KeyboardDropOutcome | null {
  if (state.phase !== "grabbed" || state.columnIndex === state.originColumnIndex) {
    return null;
  }
  return { recordId: state.recordId, from: state.from, to: targetValue };
}

export interface KeyboardDragBinding {
  readonly state: KeyboardDragState;
  readonly dispatch: React.Dispatch<KeyboardDragEvent>;
}

export function useKeyboardDrag(): KeyboardDragBinding {
  const [state, dispatch] = React.useReducer(keyboardDragReducer, IDLE_KEYBOARD_DRAG);
  return { state, dispatch };
}
