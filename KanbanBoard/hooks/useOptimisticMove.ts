import * as React from "react";
import { EMPTY_REGISTRY, MoveEvent, reconcile } from "../model/reconcile";
import { MoveRegistry, OptionValue } from "../model/types";

export type MoveAction =
  | MoveEvent
  | { readonly kind: "datasetRefreshed"; readonly values: ReadonlyMap<string, OptionValue | null> };

export interface MoveWriter {
  readonly updateRecord: (
    entityName: string,
    recordId: string,
    payload: Record<string, unknown>
  ) => Promise<unknown>;
}

export function moveReducer(registry: MoveRegistry, action: MoveAction): MoveRegistry {
  if (action.kind !== "datasetRefreshed") {
    return reconcile(registry, action);
  }
  let next = registry;
  for (const recordId of [...registry.keys()]) {
    next = action.values.has(recordId)
      ? reconcile(next, { kind: "recordObserved", recordId, value: action.values.get(recordId) ?? null })
      : reconcile(next, { kind: "recordMissing", recordId });
  }
  return next;
}

export interface OptimisticMoveBinding {
  readonly registry: MoveRegistry;
  readonly move: (recordId: string, from: OptionValue | null, to: OptionValue | null) => Promise<boolean>;
  readonly observe: (values: ReadonlyMap<string, OptionValue | null>) => void;
}

export function useOptimisticMove(
  writer: MoveWriter,
  entityName: string,
  attributeName: string
): OptimisticMoveBinding {
  const [registry, dispatch] = React.useReducer(moveReducer, EMPTY_REGISTRY);

  const move = React.useCallback(
    async (recordId: string, from: OptionValue | null, to: OptionValue | null): Promise<boolean> => {
      dispatch({ kind: "moveStarted", recordId, from, to });
      try {
        await writer.updateRecord(entityName, recordId, { [attributeName]: to });
        dispatch({ kind: "serverConfirmed", recordId });
        return true;
      } catch {
        dispatch({ kind: "serverRejected", recordId });
        return false;
      }
    },
    [writer, entityName, attributeName]
  );

  const observe = React.useCallback((values: ReadonlyMap<string, OptionValue | null>) => {
    dispatch({ kind: "datasetRefreshed", values });
  }, []);

  return { registry, move, observe };
}
