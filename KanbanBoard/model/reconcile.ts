import { CardRecord, MoveRegistry, MoveState, OptionValue, Override } from "./types";

export type MoveEvent =
  | { readonly kind: "moveStarted"; readonly recordId: string; readonly from: OptionValue | null; readonly to: OptionValue | null }
  | { readonly kind: "serverConfirmed"; readonly recordId: string }
  | { readonly kind: "serverRejected"; readonly recordId: string }
  | { readonly kind: "recordObserved"; readonly recordId: string; readonly value: OptionValue | null }
  | { readonly kind: "recordMissing"; readonly recordId: string };

export const EMPTY_REGISTRY: MoveRegistry = new Map<string, MoveState>();

function withEntry(registry: MoveRegistry, entry: MoveState): MoveRegistry {
  const next = new Map(registry);
  next.set(entry.recordId, entry);
  return next;
}

function without(registry: MoveRegistry, recordId: string): MoveRegistry {
  const next = new Map(registry);
  next.delete(recordId);
  return next;
}

export function reconcile(registry: MoveRegistry, event: MoveEvent): MoveRegistry {
  if (event.kind === "moveStarted") {
    return withEntry(registry, {
      recordId: event.recordId,
      from: event.from,
      to: event.to,
      status: "pending",
      reason: null,
      observed: null,
    });
  }

  const current = registry.get(event.recordId);
  if (current === undefined) {
    return registry;
  }

  switch (event.kind) {
    case "serverConfirmed":
      return current.status === "pending" ? withEntry(registry, { ...current, status: "confirmed" }) : registry;

    case "serverRejected":
      return current.status === "pending"
        ? withEntry(registry, { ...current, status: "reverted", reason: "rejected" })
        : registry;

    case "recordMissing":
      return current.status === "reverted"
        ? registry
        : withEntry(registry, { ...current, status: "reverted", reason: "recordGone" });

    case "recordObserved":
      if (current.status === "reverted") {
        return registry;
      }
      if (event.value === current.to) {
        return without(registry, event.recordId);
      }
      if (current.status === "pending" && event.value === current.from) {
        return registry;
      }
      return withEntry(registry, {
        ...current,
        status: "reverted",
        reason: "foreignChange",
        observed: event.value,
      });

    default:
      return registry;
  }
}

export function overrideFor(registry: MoveRegistry, recordId: string): Override | null {
  const entry = registry.get(recordId);
  if (entry === undefined || entry.status === "reverted") {
    return null;
  }
  return { value: entry.to };
}

export function applyOverrides(records: readonly CardRecord[], registry: MoveRegistry): readonly CardRecord[] {
  return records.map((record) => {
    const override = overrideFor(registry, record.id);
    return override === null ? record : { ...record, groupValue: override.value };
  });
}

export function clearReverted(registry: MoveRegistry): MoveRegistry {
  const next = new Map<string, MoveState>();
  registry.forEach((entry, recordId) => {
    if (entry.status !== "reverted") {
      next.set(recordId, entry);
    }
  });
  return next;
}
