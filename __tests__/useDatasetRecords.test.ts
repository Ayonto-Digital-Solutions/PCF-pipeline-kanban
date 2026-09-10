import { describe, expect, it } from "vitest";
import {
  ColumnBinding,
  DatasetLike,
  DatasetRecordLike,
  readPaging,
  toCardRecords,
} from "../KanbanBoard/hooks/useDatasetRecords";

const BINDING: ColumnBinding = {
  groupBy: "eo_progress",
  title: "eo_assessor",
  subtitle: "eo_discipline",
  badge: null,
};

function record(id: string, values: Record<string, unknown>, formatted: Record<string, string>, name = ""): DatasetRecordLike {
  return {
    getRecordId: () => id,
    getValue: (column) => values[column] ?? null,
    getFormattedValue: (column) => formatted[column] ?? "",
    getNamedReference: () => ({ name }),
  };
}

function dataset(
  ids: string[],
  records: Record<string, DatasetRecordLike | undefined>,
  paging: Partial<DatasetLike["paging"]> = {}
): DatasetLike {
  return {
    loading: false,
    error: false,
    sortedRecordIds: ids,
    records,
    paging: { hasNextPage: false, hasPreviousPage: false, pageSize: 20, totalResultCount: -1, ...paging },
  };
}

describe("toCardRecords, Übersetzung an der Grenze", () => {
  it("übersetzt in der Reihenfolge von sortedRecordIds", () => {
    const ds = dataset(["b", "a"], {
      a: record("a", {}, {}, "Erste"),
      b: record("b", {}, {}, "Zweite"),
    });

    expect(toCardRecords(ds, BINDING).map((c) => c.id)).toEqual(["b", "a"]);
  });

  it("überspringt eine ID, zu der kein Datensatz vorliegt", () => {
    const ds = dataset(["a", "fehlt"], { a: record("a", {}, {}, "Erste") });

    expect(toCardRecords(ds, BINDING).map((c) => c.id)).toEqual(["a"]);
  });

  it("nimmt den formatierten Wert der gebundenen Titelspalte", () => {
    const ds = dataset(["a"], { a: record("a", {}, { eo_assessor: "Marc" }, "ASM-00001") });

    expect(toCardRecords(ds, BINDING)[0].title).toBe("Marc");
  });

  it("fällt auf den Primärnamen zurück, wenn die Titelspalte leer ist", () => {
    const ds = dataset(["a"], { a: record("a", {}, { eo_assessor: "" }, "ASM-00001") });

    expect(toCardRecords(ds, BINDING)[0].title).toBe("ASM-00001");
  });

  it("lässt Untertitel und Abzeichen null, wenn nichts gebunden ist", () => {
    const ds = dataset(["a"], { a: record("a", {}, {}, "ASM-00001") });
    const card = toCardRecords(ds, { ...BINDING, subtitle: null })[0];

    expect(card.subtitle).toBeNull();
    expect(card.badge).toBeNull();
  });

  it("reicht einen numerischen Gruppierungswert durch", () => {
    const ds = dataset(["a"], { a: record("a", { eo_progress: 122180001 }, {}) });

    expect(toCardRecords(ds, BINDING)[0].groupValue).toBe(122180001);
  });

  it("reicht einen als Zeichenkette gelieferten Gruppierungswert durch", () => {
    const ds = dataset(["a"], { a: record("a", { eo_progress: "122180001" }, {}) });

    expect(toCardRecords(ds, BINDING)[0].groupValue).toBe("122180001");
  });

  it("macht aus einem unerwarteten Typ null statt einer Vermutung", () => {
    const ds = dataset(["a"], { a: record("a", { eo_progress: { id: 1 } }, {}) });

    expect(toCardRecords(ds, BINDING)[0].groupValue).toBeNull();
  });
});

describe("readPaging", () => {
  it("macht aus totalResultCount -1 ein null statt einer falschen Zahl", () => {
    expect(readPaging(dataset([], {}), 0).totalCount).toBeNull();
  });

  it("reicht eine echte Gesamtzahl durch", () => {
    expect(readPaging(dataset([], {}, { totalResultCount: 42 }), 20).totalCount).toBe(42);
  });

  it("zählt die geladenen Datensätze getrennt von der Gesamtzahl", () => {
    const summary = readPaging(dataset([], {}, { totalResultCount: 42 }), 20);

    expect(summary.loadedCount).toBe(20);
    expect(summary.totalCount).toBe(42);
  });

  it("reicht hasNextPage, hasPreviousPage und pageSize durch", () => {
    const summary = readPaging(dataset([], {}, { hasNextPage: true, hasPreviousPage: true, pageSize: 50 }), 50);

    expect(summary.hasNextPage).toBe(true);
    expect(summary.hasPreviousPage).toBe(true);
    expect(summary.pageSize).toBe(50);
  });
});
