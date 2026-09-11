import { describe, expect, it } from "vitest";
import { cardTitleOf, columnCountLabel, pagingNotice } from "../KanbanBoard/components/labels";
import { STRING, Translate, format } from "../KanbanBoard/components/strings";
import { PagingSummary } from "../KanbanBoard/hooks/useDatasetRecords";
import { CardRecord } from "../KanbanBoard/model/types";

const GERMAN: Record<string, string> = {
  [STRING.columnCountPartial]: "{0}+",
  [STRING.boardPagingKnownTotal]: "{0} von {1} Datensätzen geladen",
  [STRING.boardPagingUnknownTotal]: "{0} Datensätze geladen, weitere sind vorhanden",
  [STRING.cardUntitled]: "Ohne Bezeichnung",
};

const translate: Translate = (key) => GERMAN[key] ?? key;

function paging(overrides: Partial<PagingSummary> = {}): PagingSummary {
  return {
    loadedCount: 20,
    totalCount: 42,
    hasNextPage: false,
    hasPreviousPage: false,
    pageSize: 20,
    ...overrides,
  };
}

function card(title: string): CardRecord {
  return { id: "a", title, subtitle: null, badge: null, groupValue: null };
}

describe("format", () => {
  it("ersetzt Platzhalter der Reihe nach", () => {
    expect(format("{0} von {1}", "20", "42")).toBe("20 von 42");
  });

  it("lässt einen Platzhalter stehen, für den kein Wert vorliegt", () => {
    expect(format("{0} von {1}", "20")).toBe("20 von {1}");
  });

  it("ersetzt denselben Platzhalter mehrfach", () => {
    expect(format("{0} und {0}", "x")).toBe("x und x");
  });

  it("lässt eine Vorlage ohne Platzhalter unverändert", () => {
    expect(format("Ohne Zuordnung")).toBe("Ohne Zuordnung");
  });
});

describe("columnCountLabel", () => {
  it("zeigt die reine Zahl, solange alles geladen ist", () => {
    expect(columnCountLabel(7, false, translate)).toBe("7");
  });

  it("markiert die Zahl als unvollständig, sobald es weitere Seiten gibt", () => {
    expect(columnCountLabel(7, true, translate)).toBe("7+");
  });

  it("markiert auch eine leere Spalte als unvollständig", () => {
    expect(columnCountLabel(0, true, translate)).toBe("0+");
  });
});

describe("pagingNotice", () => {
  it("schweigt, solange alles geladen ist", () => {
    expect(pagingNotice(paging(), translate)).toBeNull();
  });

  it("nennt geladen und gesamt, wenn die Gesamtzahl bekannt ist", () => {
    expect(pagingNotice(paging({ hasNextPage: true }), translate)).toBe("20 von 42 Datensätzen geladen");
  });

  it("nennt nur die geladenen, wenn die Gesamtzahl fehlt", () => {
    expect(pagingNotice(paging({ hasNextPage: true, totalCount: null }), translate)).toBe(
      "20 Datensätze geladen, weitere sind vorhanden"
    );
  });
});

describe("cardTitleOf", () => {
  it("nimmt den Titel, wenn einer da ist", () => {
    expect(cardTitleOf(card("Marc"), translate)).toBe("Marc");
  });

  it("fällt auf die Ersatzbezeichnung zurück, wenn Titel und Primärname leer waren", () => {
    expect(cardTitleOf(card(""), translate)).toBe("Ohne Bezeichnung");
  });
});
