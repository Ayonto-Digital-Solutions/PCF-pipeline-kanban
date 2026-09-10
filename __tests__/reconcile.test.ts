import { describe, expect, it } from "vitest";
import {
  EMPTY_REGISTRY,
  MoveEvent,
  applyOverrides,
  clearReverted,
  overrideFor,
  reconcile,
} from "../KanbanBoard/model/reconcile";
import { CardRecord, MoveRegistry } from "../KanbanBoard/model/types";

const DRAFT = 122180000;
const WORK = 122180001;
const DONE = 122180002;

function run(events: readonly MoveEvent[]): MoveRegistry {
  return events.reduce<MoveRegistry>((registry, event) => reconcile(registry, event), EMPTY_REGISTRY);
}

function started(recordId = "asm-1", from: number | null = DRAFT, to: number | null = WORK): MoveEvent {
  return { kind: "moveStarted", recordId, from, to };
}

describe("reconcile, Grundzustände", () => {
  it("führt eine angestoßene Verschiebung als pending", () => {
    const registry = run([started()]);

    expect(registry.get("asm-1")?.status).toBe("pending");
    expect(registry.get("asm-1")?.from).toBe(DRAFT);
    expect(registry.get("asm-1")?.to).toBe(WORK);
  });

  it("setzt bei Serverbestätigung auf confirmed", () => {
    const registry = run([started(), { kind: "serverConfirmed", recordId: "asm-1" }]);

    expect(registry.get("asm-1")?.status).toBe("confirmed");
  });

  it("setzt bei Serverablehnung auf reverted mit Grund rejected", () => {
    const registry = run([started(), { kind: "serverRejected", recordId: "asm-1" }]);

    expect(registry.get("asm-1")?.status).toBe("reverted");
    expect(registry.get("asm-1")?.reason).toBe("rejected");
  });

  it("ignoriert Ereignisse zu einem unbekannten Datensatz", () => {
    expect(reconcile(EMPTY_REGISTRY, { kind: "serverConfirmed", recordId: "unbekannt" }).size).toBe(0);
  });
});

describe("reconcile, Auflösung gegen den Refresh", () => {
  it("räumt den Eintrag ab, wenn der Refresh den erwarteten Wert zeigt", () => {
    const registry = run([
      started(),
      { kind: "serverConfirmed", recordId: "asm-1" },
      { kind: "recordObserved", recordId: "asm-1", value: WORK },
    ]);

    expect(registry.has("asm-1")).toBe(false);
  });

  it("bleibt pending, solange der Refresh noch den Ausgangswert zeigt", () => {
    const registry = run([started(), { kind: "recordObserved", recordId: "asm-1", value: DRAFT }]);

    expect(registry.get("asm-1")?.status).toBe("pending");
  });

  it("erkennt eine Fremdänderung während Pending und setzt auf reverted", () => {
    const registry = run([started(), { kind: "recordObserved", recordId: "asm-1", value: DONE }]);

    expect(registry.get("asm-1")?.status).toBe("reverted");
    expect(registry.get("asm-1")?.reason).toBe("foreignChange");
    expect(registry.get("asm-1")?.observed).toBe(DONE);
  });

  it("erkennt eine Fremdänderung auch nach der Serverbestätigung", () => {
    const registry = run([
      started(),
      { kind: "serverConfirmed", recordId: "asm-1" },
      { kind: "recordObserved", recordId: "asm-1", value: DONE },
    ]);

    expect(registry.get("asm-1")?.reason).toBe("foreignChange");
  });

  it("behandelt ein geleertes Feld als Fremdänderung, nicht als Auflösung", () => {
    const registry = run([started(), { kind: "recordObserved", recordId: "asm-1", value: null }]);

    expect(registry.get("asm-1")?.status).toBe("reverted");
    expect(registry.get("asm-1")?.observed).toBeNull();
  });

  it("löst eine Verschiebung nach Unassigned auf, wenn der Refresh null zeigt", () => {
    const registry = run([
      started("asm-1", DRAFT, null),
      { kind: "recordObserved", recordId: "asm-1", value: null },
    ]);

    expect(registry.has("asm-1")).toBe(false);
  });

  it("setzt auf reverted mit Grund recordGone, wenn der Datensatz während Pending verschwindet", () => {
    const registry = run([started(), { kind: "recordMissing", recordId: "asm-1" }]);

    expect(registry.get("asm-1")?.status).toBe("reverted");
    expect(registry.get("asm-1")?.reason).toBe("recordGone");
  });

  it("lässt einen bereits reverted Eintrag unverändert", () => {
    const registry = run([
      started(),
      { kind: "serverRejected", recordId: "asm-1" },
      { kind: "recordObserved", recordId: "asm-1", value: WORK },
    ]);

    expect(registry.get("asm-1")?.reason).toBe("rejected");
  });
});

describe("overrideFor und applyOverrides", () => {
  const records: readonly CardRecord[] = [
    { id: "asm-1", title: "Erste", subtitle: null, badge: null, groupValue: DRAFT },
    { id: "asm-2", title: "Zweite", subtitle: null, badge: null, groupValue: DONE },
  ];

  it("überschreibt den Gruppierungswert, solange die Verschiebung pending ist", () => {
    const registry = run([started()]);

    expect(applyOverrides(records, registry)[0].groupValue).toBe(WORK);
  });

  it("überschreibt weiterhin nach der Serverbestätigung", () => {
    const registry = run([started(), { kind: "serverConfirmed", recordId: "asm-1" }]);

    expect(overrideFor(registry, "asm-1")).toEqual({ value: WORK });
  });

  it("überschreibt nicht mehr, sobald der Eintrag reverted ist", () => {
    const registry = run([started(), { kind: "serverRejected", recordId: "asm-1" }]);

    expect(overrideFor(registry, "asm-1")).toBeNull();
    expect(applyOverrides(records, registry)[0].groupValue).toBe(DRAFT);
  });

  it("lässt Datensätze ohne Verschiebung unberührt und erhält die Reihenfolge", () => {
    const registry = run([started()]);
    const applied = applyOverrides(records, registry);

    expect(applied.map((r) => r.id)).toEqual(["asm-1", "asm-2"]);
    expect(applied[1]).toBe(records[1]);
  });
});

describe("clearReverted", () => {
  it("entfernt reverted Einträge und behält pending und confirmed", () => {
    let registry = run([
      started("asm-1"),
      started("asm-2"),
      started("asm-3"),
      { kind: "serverConfirmed", recordId: "asm-2" },
      { kind: "serverRejected", recordId: "asm-3" },
    ]);
    registry = clearReverted(registry);

    expect([...registry.keys()].sort()).toEqual(["asm-1", "asm-2"]);
  });

  it("hinterlässt keinen Eintrag, wenn jede Verschiebung aufgelöst ist", () => {
    const registry = run([
      started(),
      { kind: "serverConfirmed", recordId: "asm-1" },
      { kind: "recordObserved", recordId: "asm-1", value: WORK },
    ]);

    expect(clearReverted(registry).size).toBe(0);
  });
});
