import { describe, expect, it } from "vitest";
import { moveReducer } from "../KanbanBoard/hooks/useOptimisticMove";
import { EMPTY_REGISTRY } from "../KanbanBoard/model/reconcile";
import { MoveRegistry, OptionValue } from "../KanbanBoard/model/types";

const DRAFT = 122180000;
const WORK = 122180001;
const DONE = 122180002;

function pendingFor(ids: readonly string[]): MoveRegistry {
  return ids.reduce<MoveRegistry>(
    (registry, recordId) => moveReducer(registry, { kind: "moveStarted", recordId, from: DRAFT, to: WORK }),
    EMPTY_REGISTRY
  );
}

function refresh(values: readonly (readonly [string, OptionValue | null])[]) {
  return { kind: "datasetRefreshed", values: new Map(values) } as const;
}

describe("moveReducer, Weiterreichen an reconcile", () => {
  it("behandelt gewöhnliche Ereignisse wie reconcile", () => {
    const registry = moveReducer(EMPTY_REGISTRY, { kind: "moveStarted", recordId: "a", from: DRAFT, to: WORK });

    expect(registry.get("a")?.status).toBe("pending");
  });

  it("reicht eine Serverablehnung durch", () => {
    const registry = moveReducer(pendingFor(["a"]), { kind: "serverRejected", recordId: "a" });

    expect(registry.get("a")?.reason).toBe("rejected");
  });
});

describe("moveReducer, datasetRefreshed", () => {
  it("räumt einen Eintrag ab, dessen erwarteter Wert angekommen ist", () => {
    const registry = moveReducer(pendingFor(["a"]), refresh([["a", WORK]]));

    expect(registry.has("a")).toBe(false);
  });

  it("erkennt eine Fremdänderung", () => {
    const registry = moveReducer(pendingFor(["a"]), refresh([["a", DONE]]));

    expect(registry.get("a")?.reason).toBe("foreignChange");
  });

  it("behandelt einen fehlenden Datensatz als recordGone", () => {
    const registry = moveReducer(pendingFor(["a"]), refresh([]));

    expect(registry.get("a")?.reason).toBe("recordGone");
  });

  it("unterscheidet einen beobachteten null-Wert von einem fehlenden Datensatz", () => {
    const registry = moveReducer(pendingFor(["a"]), refresh([["a", null]]));

    expect(registry.get("a")?.reason).toBe("foreignChange");
  });

  it("löst mehrere Datensätze in einem einzigen Vorgang auf", () => {
    const registry = moveReducer(pendingFor(["a", "b", "c"]), refresh([
      ["a", WORK],
      ["b", DONE],
    ]));

    expect(registry.has("a")).toBe(false);
    expect(registry.get("b")?.reason).toBe("foreignChange");
    expect(registry.get("c")?.reason).toBe("recordGone");
  });

  it("lässt einen Eintrag pending, solange noch der Ausgangswert zu sehen ist", () => {
    const registry = moveReducer(pendingFor(["a"]), refresh([["a", DRAFT]]));

    expect(registry.get("a")?.status).toBe("pending");
  });

  it("lässt ein leeres Register unverändert", () => {
    expect(moveReducer(EMPTY_REGISTRY, refresh([["a", WORK]])).size).toBe(0);
  });
});
