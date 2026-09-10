import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Board } from "../KanbanBoard/components/Board";
import { Translate } from "../KanbanBoard/components/strings";
import { PagingSummary } from "../KanbanBoard/hooks/useDatasetRecords";
import { DRAG_THRESHOLD_PX, readDropTarget, useCardDrag } from "../KanbanBoard/hooks/useCardDrag";
import { BoardState, CardRecord, OptionValue } from "../KanbanBoard/model/types";

const DRAFT = 122180000;
const WORK = 122180001;

const translate: Translate = (key) => key;

const PAGING: PagingSummary = {
  loadedCount: 1,
  totalCount: 1,
  hasNextPage: false,
  hasPreviousPage: false,
  pageSize: 20,
};

function card(id: string, groupValue: OptionValue | null): CardRecord {
  return { id, title: id, subtitle: null, badge: null, groupValue };
}

const BOARD: BoardState = {
  columns: [
    { key: "unassigned", label: "Ohne Zuordnung", color: null, value: null, cards: [] },
    { key: "option:122180000", label: "Draft", color: null, value: DRAFT, cards: [card("asm-1", DRAFT)] },
    { key: "option:122180001", label: "Work", color: null, value: WORK, cards: [] },
  ],
};

interface HarnessProps {
  readonly allowDrag: boolean;
  readonly onOpenRecord: (recordId: string) => void;
  readonly onMove: (recordId: string, from: OptionValue | null, to: OptionValue | null) => void;
}

const Harness: React.FC<HarnessProps> = ({ allowDrag, onOpenRecord, onMove }) => {
  const drag = useCardDrag();
  return (
    <Board
      board={BOARD}
      paging={PAGING}
      translate={translate}
      allowDrag={allowDrag}
      drag={drag.state}
      dispatchDrag={drag.dispatch}
      onOpenRecord={onOpenRecord}
      onMove={onMove}
    />
  );
};

function columnElement(key: string): Element {
  const element = document.querySelector(`[data-column-key="${key}"]`);
  if (element === null) {
    throw new Error(`Spalte ${key} nicht gefunden`);
  }
  return element;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("readDropTarget", () => {
  beforeEach(() => {
    render(<Harness allowDrag onOpenRecord={vi.fn()} onMove={vi.fn()} />);
  });

  it("liest Schlüssel und Wert einer Optionsspalte", () => {
    expect(readDropTarget(columnElement("option:122180001"))).toEqual({
      key: "option:122180001",
      value: WORK,
    });
  });

  it("liest die Spalte Ohne Zuordnung mit dem Wert null", () => {
    expect(readDropTarget(columnElement("unassigned"))).toEqual({ key: "unassigned", value: null });
  });

  it("findet die Spalte auch von einem Nachfahren aus", () => {
    expect(readDropTarget(screen.getByText("asm-1"))?.key).toBe("option:122180000");
  });

  it("gibt null zurück, wenn es keine Spalte über dem Punkt gibt", () => {
    expect(readDropTarget(null)).toBeNull();
    expect(readDropTarget(document.body)).toBeNull();
  });
});

describe("Board, Zeigerbedienung", () => {
  beforeEach(() => {
    Object.defineProperty(document, "elementFromPoint", {
      configurable: true,
      writable: true,
      value: (): Element | null => null,
    });
  });

  function grab(x: number): HTMLElement {
    const element = screen.getByText("asm-1").closest("button");
    if (element === null) {
      throw new Error("Karte nicht gefunden");
    }
    fireEvent.pointerDown(element, { pointerId: 1, button: 0, clientX: x, clientY: 100 });
    return element;
  }

  it("öffnet den Datensatz, wenn unterhalb der Schwelle losgelassen wird", () => {
    const onOpenRecord = vi.fn();
    const onMove = vi.fn();
    render(<Harness allowDrag onOpenRecord={onOpenRecord} onMove={onMove} />);
    const element = grab(100);

    fireEvent.pointerMove(element, { pointerId: 1, clientX: 100 + DRAG_THRESHOLD_PX - 1, clientY: 100 });
    fireEvent.pointerUp(element, { pointerId: 1 });
    fireEvent.click(element);

    expect(onOpenRecord).toHaveBeenCalledWith("asm-1");
    expect(onMove).not.toHaveBeenCalled();
  });

  it("verschiebt statt zu öffnen, wenn über einer anderen Spalte losgelassen wird", () => {
    const onOpenRecord = vi.fn();
    const onMove = vi.fn();
    render(<Harness allowDrag onOpenRecord={onOpenRecord} onMove={onMove} />);
    const element = grab(100);
    vi.spyOn(document, "elementFromPoint").mockReturnValue(columnElement("option:122180001"));

    fireEvent.pointerMove(element, { pointerId: 1, clientX: 400, clientY: 100 });
    fireEvent.pointerMove(element, { pointerId: 1, clientX: 401, clientY: 100 });
    fireEvent.pointerUp(element, { pointerId: 1 });
    fireEvent.click(element);

    expect(onMove).toHaveBeenCalledWith("asm-1", DRAFT, WORK);
    expect(onOpenRecord).not.toHaveBeenCalled();
  });

  it("erzeugt keinen Verschiebevorgang bei Ablage auf der Ursprungsspalte", () => {
    const onMove = vi.fn();
    render(<Harness allowDrag onOpenRecord={vi.fn()} onMove={onMove} />);
    const element = grab(100);
    vi.spyOn(document, "elementFromPoint").mockReturnValue(columnElement("option:122180000"));

    fireEvent.pointerMove(element, { pointerId: 1, clientX: 400, clientY: 100 });
    fireEvent.pointerMove(element, { pointerId: 1, clientX: 401, clientY: 100 });
    fireEvent.pointerUp(element, { pointerId: 1 });

    expect(onMove).not.toHaveBeenCalled();
  });

  it("bricht bei pointercancel ab, ohne zu verschieben oder zu öffnen", () => {
    const onOpenRecord = vi.fn();
    const onMove = vi.fn();
    render(<Harness allowDrag onOpenRecord={onOpenRecord} onMove={onMove} />);
    const element = grab(100);
    vi.spyOn(document, "elementFromPoint").mockReturnValue(columnElement("option:122180001"));

    fireEvent.pointerMove(element, { pointerId: 1, clientX: 400, clientY: 100 });
    fireEvent.pointerMove(element, { pointerId: 1, clientX: 401, clientY: 100 });
    fireEvent.pointerCancel(element, { pointerId: 1 });
    fireEvent.click(element);

    expect(onMove).not.toHaveBeenCalled();
    expect(onOpenRecord).not.toHaveBeenCalled();
  });

  it("nimmt keine Karte auf, solange allowDrag aus ist", () => {
    const onOpenRecord = vi.fn();
    const onMove = vi.fn();
    render(<Harness allowDrag={false} onOpenRecord={onOpenRecord} onMove={onMove} />);
    const element = grab(100);
    vi.spyOn(document, "elementFromPoint").mockReturnValue(columnElement("option:122180001"));

    fireEvent.pointerMove(element, { pointerId: 1, clientX: 400, clientY: 100 });
    fireEvent.pointerUp(element, { pointerId: 1 });
    fireEvent.click(element);

    expect(onMove).not.toHaveBeenCalled();
    expect(onOpenRecord).toHaveBeenCalledWith("asm-1");
  });

  it("markiert die Zielspalte sichtbar, während darüber gezogen wird", () => {
    render(<Harness allowDrag onOpenRecord={vi.fn()} onMove={vi.fn()} />);
    const element = grab(100);
    vi.spyOn(document, "elementFromPoint").mockReturnValue(columnElement("option:122180001"));

    fireEvent.pointerMove(element, { pointerId: 1, clientX: 400, clientY: 100 });
    fireEvent.pointerMove(element, { pointerId: 1, clientX: 401, clientY: 100 });

    expect(columnElement("option:122180001").className).toContain("is-drop-target");
    expect(columnElement("option:122180000").className).not.toContain("is-drop-target");
  });

  it("zeigt während des Ziehens einen Drag-Layer", () => {
    const { container } = render(<Harness allowDrag onOpenRecord={vi.fn()} onMove={vi.fn()} />);
    const element = grab(100);

    expect(container.querySelector(".ayonto-kanban-drag-layer")).toBeNull();
    fireEvent.pointerMove(element, { pointerId: 1, clientX: 400, clientY: 100 });

    expect(document.querySelector(".ayonto-kanban-drag-layer")).not.toBeNull();
  });
});
