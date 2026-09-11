import { describe, expect, it } from "vitest";
import {
  IDLE_KEYBOARD_DRAG,
  KeyboardDragState,
  clampIndex,
  keyboardDragReducer,
  keyboardDropOutcome,
} from "../KanbanBoard/hooks/useKeyboardDrag";

const DRAFT = 122180000;
const WORK = 122180001;

function grabbed(columnIndex = 1, cardIndex = 0): KeyboardDragState {
  return keyboardDragReducer(IDLE_KEYBOARD_DRAG, {
    kind: "grabbed",
    recordId: "asm-1",
    from: DRAFT,
    columnIndex,
    cardIndex,
  });
}

describe("clampIndex", () => {
  it("hält den Wert im Bereich", () => {
    expect(clampIndex(5, 3)).toBe(2);
    expect(clampIndex(-2, 3)).toBe(0);
    expect(clampIndex(1, 3)).toBe(1);
  });

  it("liefert bei leerer Menge null", () => {
    expect(clampIndex(3, 0)).toBe(0);
  });
});

describe("keyboardDragReducer", () => {
  it("nimmt eine Karte auf und merkt sich die Ausgangsspalte", () => {
    const state = grabbed(1, 2);

    expect(state.phase).toBe("grabbed");
    expect(state.phase === "grabbed" ? state.originColumnIndex : null).toBe(1);
    expect(state.phase === "grabbed" ? state.cardIndex : null).toBe(2);
  });

  it("ignoriert Schritte im Ruhezustand", () => {
    expect(keyboardDragReducer(IDLE_KEYBOARD_DRAG, { kind: "columnStep", delta: 1, columnCount: 3 })).toBe(
      IDLE_KEYBOARD_DRAG
    );
  });

  it("wechselt die Zielspalte und setzt die Position zurück", () => {
    const state = keyboardDragReducer(grabbed(1, 2), { kind: "columnStep", delta: 1, columnCount: 3 });

    expect(state.phase === "grabbed" ? [state.columnIndex, state.cardIndex] : null).toEqual([2, 0]);
  });

  it("bleibt am rechten Rand stehen", () => {
    const state = keyboardDragReducer(grabbed(2, 0), { kind: "columnStep", delta: 1, columnCount: 3 });

    expect(state.phase === "grabbed" ? state.columnIndex : null).toBe(2);
  });

  it("bleibt am linken Rand stehen", () => {
    const state = keyboardDragReducer(grabbed(0, 0), { kind: "columnStep", delta: -1, columnCount: 3 });

    expect(state.phase === "grabbed" ? state.columnIndex : null).toBe(0);
  });

  it("verschiebt die Position innerhalb der Spalte", () => {
    const state = keyboardDragReducer(grabbed(1, 0), { kind: "cardStep", delta: 1, cardCount: 3 });

    expect(state.phase === "grabbed" ? state.cardIndex : null).toBe(1);
  });

  it("bleibt am unteren Rand der Spalte stehen", () => {
    const state = keyboardDragReducer(grabbed(1, 2), { kind: "cardStep", delta: 1, cardCount: 3 });

    expect(state.phase === "grabbed" ? state.cardIndex : null).toBe(2);
  });

  it("kehrt beim Ablegen in den Ruhezustand zurück", () => {
    expect(keyboardDragReducer(grabbed(), { kind: "dropped" })).toBe(IDLE_KEYBOARD_DRAG);
  });

  it("kehrt beim Abbruch in den Ruhezustand zurück", () => {
    expect(keyboardDragReducer(grabbed(), { kind: "cancelled" })).toBe(IDLE_KEYBOARD_DRAG);
  });
});

describe("keyboardDropOutcome", () => {
  it("schweigt im Ruhezustand", () => {
    expect(keyboardDropOutcome(IDLE_KEYBOARD_DRAG, WORK)).toBeNull();
  });

  it("erzeugt keinen Schreibvorgang, wenn die Spalte dieselbe geblieben ist", () => {
    expect(keyboardDropOutcome(grabbed(1, 0), DRAFT)).toBeNull();
  });

  it("erzeugt auch dann keinen, wenn nur die Position verändert wurde", () => {
    const moved = keyboardDragReducer(grabbed(1, 0), { kind: "cardStep", delta: 1, cardCount: 3 });

    expect(keyboardDropOutcome(moved, DRAFT)).toBeNull();
  });

  it("erzeugt einen Vorgang nach einem Spaltenwechsel", () => {
    const moved = keyboardDragReducer(grabbed(1, 0), { kind: "columnStep", delta: 1, columnCount: 3 });

    expect(keyboardDropOutcome(moved, WORK)).toEqual({ recordId: "asm-1", from: DRAFT, to: WORK });
  });
});
