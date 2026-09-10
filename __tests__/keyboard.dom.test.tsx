import * as React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Board } from "../KanbanBoard/components/Board";
import { STRING, Translate } from "../KanbanBoard/components/strings";
import { PagingSummary } from "../KanbanBoard/hooks/useDatasetRecords";
import { useCardDrag } from "../KanbanBoard/hooks/useCardDrag";
import { useKeyboardDrag } from "../KanbanBoard/hooks/useKeyboardDrag";
import { BoardState, CardRecord, OptionValue } from "../KanbanBoard/model/types";

const DRAFT = 122180000;
const WORK = 122180001;

const TEXTS: Record<string, string> = {
  [STRING.columnEmpty]: "Keine Datensätze",
  [STRING.columnCountPartial]: "{0}+",
  [STRING.cardUntitled]: "Ohne Bezeichnung",
  [STRING.columnAccessibleName]: "{0}, {1} Datensätze",
  [STRING.a11yGrabbed]: "{0} aufgenommen, aktuell in {1}",
  [STRING.a11yTarget]: "Ziel {0}, Position {1} von {2}",
  [STRING.a11yDropped]: "{0} nach {1} verschoben",
  [STRING.a11yDropUnchanged]: "{0} bleibt in {1}, nichts gespeichert",
  [STRING.a11yCancelled]: "Abgebrochen, {0} bleibt in {1}",
  [STRING.a11yRejected]: "Verschieben abgelehnt, {0} bleibt in {1}",
};

const translate: Translate = (key) => TEXTS[key] ?? key;

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

function boardWith(cards: Record<string, readonly CardRecord[]>): BoardState {
  return {
    columns: [
      { key: "unassigned", label: "Ohne Zuordnung", color: null, value: null, cards: cards.unassigned ?? [] },
      { key: "option:122180000", label: "Draft", color: null, value: DRAFT, cards: cards.draft ?? [] },
      { key: "option:122180001", label: "Work", color: null, value: WORK, cards: cards.work ?? [] },
    ],
  };
}

interface HarnessProps {
  readonly accept: boolean;
  readonly onMoveSpy: (recordId: string, from: OptionValue | null, to: OptionValue | null) => void;
  readonly onOpenRecord: (recordId: string) => void;
}

const Harness: React.FC<HarnessProps> = ({ accept, onMoveSpy, onOpenRecord }) => {
  const [board, setBoard] = React.useState<BoardState>(boardWith({ draft: [card("asm-1", DRAFT)] }));
  const drag = useCardDrag();
  const keyboard = useKeyboardDrag();

  const onMove = async (
    recordId: string,
    from: OptionValue | null,
    to: OptionValue | null
  ): Promise<boolean> => {
    onMoveSpy(recordId, from, to);
    if (accept) {
      setBoard(boardWith({ work: [card(recordId, to)] }));
    }
    return Promise.resolve(accept);
  };

  return (
    <Board
      board={board}
      paging={PAGING}
      translate={translate}
      allowDrag
      drag={drag.state}
      dispatchDrag={drag.dispatch}
      keyboard={keyboard.state}
      dispatchKeyboard={keyboard.dispatch}
      onOpenRecord={onOpenRecord}
      onMove={onMove}
    />
  );
};

function cardButton(): HTMLElement {
  const element = screen.getByText("asm-1").closest("button");
  if (element === null) {
    throw new Error("Karte nicht gefunden");
  }
  return element;
}

function liveText(): string {
  return screen.getByRole("status").textContent ?? "";
}

function focusCard(): HTMLElement {
  const element = cardButton();
  element.focus();
  return element;
}

afterEach(() => {
  cleanup();
});

describe("Rollen und zugängliche Namen", () => {
  it("gibt jeder Spalte eine Liste mit Namen aus Label und Anzahl", () => {
    render(<Harness accept onMoveSpy={vi.fn()} onOpenRecord={vi.fn()} />);

    expect(screen.getByRole("list", { name: "Draft, 1 Datensätze" })).toBeDefined();
    expect(screen.getByRole("list", { name: "Work, 0 Datensätze" })).toBeDefined();
  });

  it("legt jede Karte in ein Listenelement", () => {
    render(<Harness accept onMoveSpy={vi.fn()} onOpenRecord={vi.fn()} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("hält eine höfliche Live-Region bereit", () => {
    render(<Harness accept onMoveSpy={vi.fn()} onOpenRecord={vi.fn()} />);
    const region = screen.getByRole("status");

    expect(region.getAttribute("aria-live")).toBe("polite");
    expect(region.textContent).toBe("");
  });
});

describe("Tastaturpfad", () => {
  it("nimmt die Karte mit der Leertaste auf und sagt es an", () => {
    render(<Harness accept onMoveSpy={vi.fn()} onOpenRecord={vi.fn()} />);
    const element = focusCard();

    fireEvent.keyDown(element, { key: " " });

    expect(liveText()).toContain("asm-1 aufgenommen, aktuell in Draft");
    expect(cardButton().className).toContain("is-grabbed");
  });

  it("öffnet den Datensatz nicht, wenn die Leertaste aufnimmt", () => {
    const onOpenRecord = vi.fn();
    render(<Harness accept onMoveSpy={vi.fn()} onOpenRecord={onOpenRecord} />);
    const element = focusCard();

    fireEvent.keyDown(element, { key: " " });

    expect(onOpenRecord).not.toHaveBeenCalled();
  });

  it("wechselt mit der Pfeiltaste die Zielspalte und sagt das Ziel an", () => {
    render(<Harness accept onMoveSpy={vi.fn()} onOpenRecord={vi.fn()} />);
    const element = focusCard();

    fireEvent.keyDown(element, { key: " " });
    fireEvent.keyDown(element, { key: "ArrowRight" });

    expect(liveText()).toContain("Ziel Work");
    expect(document.querySelector('[data-column-key="option:122180001"]')?.getAttribute("data-drop-target")).toBe(
      "true"
    );
  });

  it("bleibt am Rand stehen, statt über die letzte Spalte hinauszulaufen", () => {
    render(<Harness accept onMoveSpy={vi.fn()} onOpenRecord={vi.fn()} />);
    const element = focusCard();

    fireEvent.keyDown(element, { key: " " });
    fireEvent.keyDown(element, { key: "ArrowRight" });
    fireEvent.keyDown(element, { key: "ArrowRight" });

    expect(liveText()).toContain("Ziel Work");
  });

  it("verschiebt beim Ablegen und behält den Fokus auf der Karte", async () => {
    const onMoveSpy = vi.fn();
    render(<Harness accept onMoveSpy={onMoveSpy} onOpenRecord={vi.fn()} />);
    const element = focusCard();

    fireEvent.keyDown(element, { key: " " });
    fireEvent.keyDown(element, { key: "ArrowRight" });
    fireEvent.keyDown(element, { key: " " });

    expect(onMoveSpy).toHaveBeenCalledWith("asm-1", DRAFT, WORK);
    await waitFor(() => {
      expect(document.activeElement?.getAttribute("data-record-id")).toBe("asm-1");
    });
    expect(document.activeElement?.closest("[data-column-key]")?.getAttribute("data-column-key")).toBe(
      "option:122180001"
    );
    expect(liveText()).toContain("asm-1 nach Work verschoben");
  });

  it("schreibt nichts, wenn auf der Ursprungsspalte abgelegt wird", () => {
    const onMoveSpy = vi.fn();
    render(<Harness accept onMoveSpy={onMoveSpy} onOpenRecord={vi.fn()} />);
    const element = focusCard();

    fireEvent.keyDown(element, { key: " " });
    fireEvent.keyDown(element, { key: " " });

    expect(onMoveSpy).not.toHaveBeenCalled();
    expect(liveText()).toContain("asm-1 bleibt in Draft, nichts gespeichert");
  });

  it("bricht mit Escape ab, schreibt nichts und lässt den Fokus auf der Karte", async () => {
    const onMoveSpy = vi.fn();
    render(<Harness accept onMoveSpy={onMoveSpy} onOpenRecord={vi.fn()} />);
    const element = focusCard();

    fireEvent.keyDown(element, { key: " " });
    fireEvent.keyDown(element, { key: "ArrowRight" });
    fireEvent.keyDown(element, { key: "Escape" });

    expect(onMoveSpy).not.toHaveBeenCalled();
    expect(liveText()).toContain("Abgebrochen, asm-1 bleibt in Draft");
    await waitFor(() => {
      expect(document.activeElement?.getAttribute("data-record-id")).toBe("asm-1");
    });
    expect(cardButton().className).not.toContain("is-grabbed");
  });

  it("sagt eine Ablehnung durch den Server an und lässt den Fokus auf der Karte", async () => {
    const onMoveSpy = vi.fn();
    render(<Harness accept={false} onMoveSpy={onMoveSpy} onOpenRecord={vi.fn()} />);
    const element = focusCard();

    fireEvent.keyDown(element, { key: " " });
    fireEvent.keyDown(element, { key: "ArrowRight" });
    fireEvent.keyDown(element, { key: " " });

    await waitFor(() => {
      expect(liveText()).toContain("Verschieben abgelehnt, asm-1 bleibt in Draft");
    });
    expect(document.activeElement?.getAttribute("data-record-id")).toBe("asm-1");
    expect(document.activeElement?.closest("[data-column-key]")?.getAttribute("data-column-key")).toBe(
      "option:122180000"
    );
  });
});
