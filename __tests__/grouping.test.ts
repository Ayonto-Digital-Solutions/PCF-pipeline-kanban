import { describe, expect, it } from "vitest";
import { buildBoard, normalizeOptionValue } from "../KanbanBoard/model/grouping";
import { CardRecord, ColumnDefinition, RawGroupValue, UNASSIGNED_KEY } from "../KanbanBoard/model/types";

function option(value: number, label: string, color: string | null = null): ColumnDefinition {
  return { value, label, color };
}

function card(id: string, groupValue: RawGroupValue): CardRecord {
  return { id, title: id, subtitle: null, badge: null, groupValue };
}

function labelsOf(options: readonly ColumnDefinition[], records: readonly CardRecord[]): string[] {
  return buildBoard({ options, records, unassignedLabel: "Ohne Zuordnung" }).columns.map((c) => c.label);
}

describe("buildBoard, Reihenfolge", () => {
  it("übernimmt absteigend vergebene Optionswerte in der gelieferten Reihenfolge", () => {
    const options = [option(122180002, "Done"), option(122180001, "Work"), option(122180000, "Draft")];

    expect(labelsOf(options, [])).toEqual(["Ohne Zuordnung", "Done", "Work", "Draft"]);
  });

  it("sortiert auch bei Lücken und einer nachträglich eingeschobenen Option nicht", () => {
    const options = [option(100, "Eins"), option(300, "Drei"), option(200, "Zwei, später ergänzt")];

    expect(labelsOf(options, [])).toEqual(["Ohne Zuordnung", "Eins", "Drei", "Zwei, später ergänzt"]);
  });

  it("stellt die Unassigned-Spalte an den Anfang", () => {
    const board = buildBoard({ options: [option(1, "A")], records: [], unassignedLabel: "Ohne Zuordnung" });

    expect(board.columns[0].key).toBe(UNASSIGNED_KEY);
    expect(board.columns[0].value).toBeNull();
  });
});

describe("buildBoard, Spalten und Karten", () => {
  it("hält eine Spalte ohne Datensätze sichtbar", () => {
    const options = [option(1, "Voll"), option(2, "Leer")];
    const board = buildBoard({ options, records: [card("a", 1)], unassignedLabel: "Ohne Zuordnung" });

    expect(board.columns.map((c) => c.label)).toEqual(["Ohne Zuordnung", "Voll", "Leer"]);
    expect(board.columns[2].cards).toHaveLength(0);
  });

  it("trimmt Optionslabels für den Spaltenkopf", () => {
    expect(labelsOf([option(122180000, "Draft "), option(122180001, "Work ")], [])).toEqual([
      "Ohne Zuordnung",
      "Draft",
      "Work",
    ]);
  });

  it("behält die Reihenfolge der Datensätze innerhalb einer Spalte", () => {
    const board = buildBoard({
      options: [option(1, "A")],
      records: [card("dritter", 1), card("erster", 1), card("zweiter", 1)],
      unassignedLabel: "Ohne Zuordnung",
    });

    expect(board.columns[1].cards.map((c) => c.id)).toEqual(["dritter", "erster", "zweiter"]);
  });

  it("gibt die Optionsfarbe an die Spalte weiter", () => {
    const board = buildBoard({
      options: [option(1, "A", "#cfe3a8")],
      records: [],
      unassignedLabel: "Ohne Zuordnung",
    });

    expect(board.columns[1].color).toBe("#cfe3a8");
  });
});

describe("buildBoard, Zuordnung eines Datensatzes", () => {
  const options = [option(122180000, "Draft"), option(122180001, "Work")];

  function keyFor(groupValue: RawGroupValue): string {
    const board = buildBoard({ options, records: [card("x", groupValue)], unassignedLabel: "Ohne Zuordnung" });
    const column = board.columns.find((c) => c.cards.some((r) => r.id === "x"));
    return column === undefined ? "" : column.key;
  }

  it("ordnet einen Gruppierungswert zu, der als String statt als Zahl kommt", () => {
    expect(keyFor("122180001")).toBe("option:122180001");
  });

  it("ordnet auch einen String mit umgebenden Leerzeichen zu", () => {
    expect(keyFor(" 122180000 ")).toBe("option:122180000");
  });

  it("legt null in die Unassigned-Spalte", () => {
    expect(keyFor(null)).toBe(UNASSIGNED_KEY);
  });

  it("legt undefined in die Unassigned-Spalte", () => {
    expect(keyFor(undefined)).toBe(UNASSIGNED_KEY);
  });

  it("legt einen unbekannten Optionswert in die Unassigned-Spalte", () => {
    expect(keyFor(999)).toBe(UNASSIGNED_KEY);
  });

  it("legt einen nicht numerischen String in die Unassigned-Spalte", () => {
    expect(keyFor("Draft")).toBe(UNASSIGNED_KEY);
  });
});

describe("normalizeOptionValue", () => {
  it("behandelt den leeren String nicht als Null", () => {
    expect(normalizeOptionValue("")).toBeNull();
    expect(normalizeOptionValue("   ")).toBeNull();
  });

  it("verwirft NaN und Unendlich", () => {
    expect(normalizeOptionValue(Number.NaN)).toBeNull();
    expect(normalizeOptionValue(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("erhält negative Optionswerte", () => {
    expect(normalizeOptionValue(-1)).toBe(-1);
    expect(normalizeOptionValue("-1")).toBe(-1);
  });
});
