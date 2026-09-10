import * as React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Card } from "../KanbanBoard/components/Card";
import { ErrorState } from "../KanbanBoard/components/ErrorState";
import { STRING, Translate } from "../KanbanBoard/components/strings";
import { CardRecord } from "../KanbanBoard/model/types";

const translate: Translate = (key) => (key === STRING.cardUntitled ? "Ohne Bezeichnung" : key);

afterEach(() => {
  cleanup();
});

function card(overrides: Partial<CardRecord> = {}): CardRecord {
  return { id: "asm-1", title: "Marc", subtitle: null, badge: null, groupValue: null, ...overrides };
}

function renderCard(props: Partial<React.ComponentProps<typeof Card>> = {}) {
  return render(
    <Card
      card={card()}
      translate={translate}
      draggable={false}
      dragging={false}
      onOpen={vi.fn()}
      onPointerDown={vi.fn()}
      {...props}
    />
  );
}

describe("Card, Verdrahtung des Klicks", () => {
  it("meldet die Datensatz-ID beim Klick", () => {
    const onOpen = vi.fn();
    renderCard({ onOpen: onOpen });

    fireEvent.click(screen.getByRole("button"));

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith("asm-1");
  });

  it("meldet nichts, solange nicht geklickt wird", () => {
    const onOpen = vi.fn();
    renderCard({ onOpen: onOpen });

    expect(onOpen).not.toHaveBeenCalled();
  });

  it("ist ein Schaltflächenelement und damit von Haus aus fokussierbar", () => {
    renderCard();
    const element = screen.getByRole("button");

    expect(element.tagName).toBe("BUTTON");
    expect(element.getAttribute("type")).toBe("button");
  });

  it("zeigt Titel, Untertitel und Abzeichen, wenn alle gebunden sind", () => {
    renderCard({ card: card({ subtitle: "Statik", badge: "Kritisch" }) });

    expect(screen.getByText("Marc")).toBeDefined();
    expect(screen.getByText("Statik")).toBeDefined();
    expect(screen.getByText("Kritisch")).toBeDefined();
  });

  it("lässt Untertitel und Abzeichen weg, wenn nichts gebunden ist", () => {
    const { container } = renderCard();

    expect(container.querySelector(".ayonto-kanban-card-subtitle")).toBeNull();
    expect(container.querySelector(".ayonto-kanban-card-badge")).toBeNull();
  });

  it("nutzt die Ersatzbezeichnung, wenn kein Titel vorliegt", () => {
    renderCard({ card: card({ title: "" }) });

    expect(screen.getByText("Ohne Bezeichnung")).toBeDefined();
  });
});

describe("ErrorState, Verdrahtung der Wiederholung", () => {
  it("ruft onRetry beim Klick auf die Schaltfläche", () => {
    const onRetry = vi.fn();
    render(
      <ErrorState title="Fehler" detail="HTTP 503" retryLabel="Erneut versuchen" onRetry={onRetry} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Erneut versuchen" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("zeigt Titel und Ursache an", () => {
    render(
      <ErrorState title="Fehler" detail="HTTP 503" retryLabel="Erneut versuchen" onRetry={vi.fn()} />
    );

    expect(screen.getByText("Fehler")).toBeDefined();
    expect(screen.getByText("HTTP 503")).toBeDefined();
  });

  it("meldet nichts, solange nicht geklickt wird", () => {
    const onRetry = vi.fn();
    render(
      <ErrorState title="Fehler" detail="HTTP 503" retryLabel="Erneut versuchen" onRetry={onRetry} />
    );

    expect(onRetry).not.toHaveBeenCalled();
  });
});
