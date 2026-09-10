import { describe, expect, it } from "vitest";
import {
  DRAG_THRESHOLD_PX,
  DragState,
  IDLE_DRAG,
  distance,
  dragReducer,
  dropOutcome,
  isClick,
} from "../KanbanBoard/hooks/useCardDrag";

const DRAFT = 122180000;
const WORK = 122180001;

function pressed(): DragState {
  return dragReducer(IDLE_DRAG, {
    kind: "pressed",
    recordId: "asm-1",
    from: DRAFT,
    pointerId: 7,
    x: 100,
    y: 100,
  });
}

function dragging(): DragState {
  return dragReducer(pressed(), { kind: "moved", pointerId: 7, x: 140, y: 100 });
}

describe("distance", () => {
  it("misst die Strecke zwischen zwei Punkten", () => {
    expect(distance(0, 0, 3, 4)).toBe(5);
  });
});

describe("dragReducer, Aufnahmeschwelle", () => {
  it("merkt sich den Druckpunkt, ohne schon zu ziehen", () => {
    const state = pressed();

    expect(state.phase).toBe("pressed");
    expect(isClick(state)).toBe(true);
  });

  it("bleibt unterhalb der Schwelle beim Druck, damit ein Klick ein Klick bleibt", () => {
    const state = dragReducer(pressed(), {
      kind: "moved",
      pointerId: 7,
      x: 100 + DRAG_THRESHOLD_PX - 1,
      y: 100,
    });

    expect(state.phase).toBe("pressed");
    expect(isClick(state)).toBe(true);
  });

  it("nimmt die Karte auf, sobald die Schwelle erreicht ist", () => {
    const state = dragReducer(pressed(), {
      kind: "moved",
      pointerId: 7,
      x: 100 + DRAG_THRESHOLD_PX,
      y: 100,
    });

    expect(state.phase).toBe("dragging");
    expect(isClick(state)).toBe(false);
  });

  it("ignoriert Bewegungen eines anderen Zeigers", () => {
    const before = pressed();
    const after = dragReducer(before, { kind: "moved", pointerId: 9, x: 400, y: 400 });

    expect(after).toBe(before);
  });

  it("ignoriert Bewegungen im Ruhezustand", () => {
    expect(dragReducer(IDLE_DRAG, { kind: "moved", pointerId: 7, x: 10, y: 10 })).toBe(IDLE_DRAG);
  });

  it("führt die Zeigerposition während des Ziehens nach", () => {
    const state = dragReducer(dragging(), { kind: "moved", pointerId: 7, x: 220, y: 180 });

    expect(state.phase === "dragging" ? [state.x, state.y] : null).toEqual([220, 180]);
  });
});

describe("dragReducer, Ablageziel", () => {
  it("merkt sich das Ziel während des Ziehens", () => {
    const state = dragReducer(dragging(), {
      kind: "overColumn",
      target: { key: "option:122180001", value: WORK },
    });

    expect(state.phase === "dragging" ? state.target?.key : null).toBe("option:122180001");
  });

  it("nimmt kein Ziel an, solange nur gedrückt wird", () => {
    const before = pressed();
    const after = dragReducer(before, { kind: "overColumn", target: { key: "x", value: WORK } });

    expect(after).toBe(before);
  });

  it("kehrt bei Loslassen in den Ruhezustand zurück", () => {
    expect(dragReducer(dragging(), { kind: "released" })).toBe(IDLE_DRAG);
  });

  it("kehrt bei Abbruch in den Ruhezustand zurück", () => {
    expect(dragReducer(dragging(), { kind: "cancelled" })).toBe(IDLE_DRAG);
  });
});

describe("dropOutcome", () => {
  it("schweigt im Ruhezustand", () => {
    expect(dropOutcome(IDLE_DRAG)).toBeNull();
  });

  it("schweigt, solange nur gedrückt wird", () => {
    expect(dropOutcome(pressed())).toBeNull();
  });

  it("schweigt, wenn über keiner Spalte losgelassen wird", () => {
    expect(dropOutcome(dragging())).toBeNull();
  });

  it("erzeugt keinen Schreibvorgang bei Ablage auf der Ursprungsspalte", () => {
    const state = dragReducer(dragging(), {
      kind: "overColumn",
      target: { key: "option:122180000", value: DRAFT },
    });

    expect(dropOutcome(state)).toBeNull();
  });

  it("erzeugt einen Verschiebevorgang bei Ablage auf einer anderen Spalte", () => {
    const state = dragReducer(dragging(), {
      kind: "overColumn",
      target: { key: "option:122180001", value: WORK },
    });

    expect(dropOutcome(state)).toEqual({ recordId: "asm-1", from: DRAFT, to: WORK });
  });

  it("erzeugt auch einen Vorgang für die Ablage in Ohne Zuordnung", () => {
    const state = dragReducer(dragging(), { kind: "overColumn", target: { key: "unassigned", value: null } });

    expect(dropOutcome(state)).toEqual({ recordId: "asm-1", from: DRAFT, to: null });
  });

  it("schweigt, wenn eine Karte ohne Zuordnung dort wieder abgelegt wird", () => {
    const fromUnassigned = dragReducer(
      dragReducer(IDLE_DRAG, { kind: "pressed", recordId: "asm-2", from: null, pointerId: 1, x: 0, y: 0 }),
      { kind: "moved", pointerId: 1, x: 50, y: 0 }
    );
    const state = dragReducer(fromUnassigned, {
      kind: "overColumn",
      target: { key: "unassigned", value: null },
    });

    expect(dropOutcome(state)).toBeNull();
  });
});
