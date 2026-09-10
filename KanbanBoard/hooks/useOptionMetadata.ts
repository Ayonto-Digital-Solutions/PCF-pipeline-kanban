import * as React from "react";
import { ColumnDefinition } from "../model/types";
import { MetadataBranch, OptionMetadataService } from "../services/metadata";

export type MetadataLoadState =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly options: readonly ColumnDefinition[]; readonly branch: MetadataBranch }
  | { readonly status: "error"; readonly message: string };

export type MetadataLoadEvent =
  | { readonly kind: "load" }
  | { readonly kind: "resolved"; readonly options: readonly ColumnDefinition[]; readonly branch: MetadataBranch }
  | { readonly kind: "failed"; readonly message: string }
  | { readonly kind: "retry" };

export const INITIAL_METADATA_STATE: MetadataLoadState = { status: "idle" };

export function metadataLoadReducer(state: MetadataLoadState, event: MetadataLoadEvent): MetadataLoadState {
  switch (event.kind) {
    case "load":
      return state.status === "loading" ? state : { status: "loading" };

    case "retry":
      return state.status === "error" ? { status: "loading" } : state;

    case "resolved":
      return { status: "ready", options: event.options, branch: event.branch };

    case "failed":
      return { status: "error", message: event.message };

    default:
      return state;
  }
}

export function messageOf(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return typeof error === "string" ? error : "unknown error";
}

export interface OptionMetadataBinding {
  readonly state: MetadataLoadState;
  readonly retry: () => void;
}

export function useOptionMetadata(
  service: OptionMetadataService,
  entityName: string,
  attributeName: string
): OptionMetadataBinding {
  const [state, dispatch] = React.useReducer(metadataLoadReducer, INITIAL_METADATA_STATE);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    dispatch({ kind: "load" });
    void (async () => {
      try {
        const result = await service.load(entityName, attributeName);
        if (!cancelled) {
          dispatch({ kind: "resolved", options: result.options, branch: result.branch });
        }
      } catch (error) {
        if (!cancelled) {
          dispatch({ kind: "failed", message: messageOf(error) });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [service, entityName, attributeName, attempt]);

  const retry = React.useCallback(() => {
    dispatch({ kind: "retry" });
    setAttempt((previous) => previous + 1);
  }, []);

  return { state, retry };
}
