import { describe, expect, it } from "vitest";
import {
  INITIAL_METADATA_STATE,
  MetadataLoadState,
  messageOf,
  metadataLoadReducer,
} from "../KanbanBoard/hooks/useOptionMetadata";

const OPTIONS = [{ value: 1, label: "Draft", color: null }];

const ERROR_STATE: MetadataLoadState = { status: "error", message: "Metadaten nicht erreichbar" };

describe("metadataLoadReducer, Grundpfade", () => {
  it("geht von idle über load nach loading", () => {
    expect(metadataLoadReducer(INITIAL_METADATA_STATE, { kind: "load" })).toEqual({ status: "loading" });
  });

  it("geht von loading über resolved nach ready", () => {
    const state = metadataLoadReducer({ status: "loading" }, {
      kind: "resolved",
      options: OPTIONS,
      branch: "entityMetadata",
    });

    expect(state).toEqual({ status: "ready", options: OPTIONS, branch: "entityMetadata" });
  });

  it("geht von loading über failed nach error", () => {
    expect(metadataLoadReducer({ status: "loading" }, { kind: "failed", message: "kaputt" })).toEqual({
      status: "error",
      message: "kaputt",
    });
  });
});

describe("metadataLoadReducer, Fehler-Reset", () => {
  it("setzt den Fehlerzustand über retry zurück auf loading", () => {
    expect(metadataLoadReducer(ERROR_STATE, { kind: "retry" })).toEqual({ status: "loading" });
  });

  it("lässt einen erfolgreichen Zustand von retry unberührt", () => {
    const ready: MetadataLoadState = { status: "ready", options: OPTIONS, branch: "metadataEndpoint" };

    expect(metadataLoadReducer(ready, { kind: "retry" })).toBe(ready);
  });

  it("lässt loading von retry unberührt", () => {
    const loading: MetadataLoadState = { status: "loading" };

    expect(metadataLoadReducer(loading, { kind: "retry" })).toBe(loading);
  });

  it("erlaubt einen neuen Ladeversuch auch über load", () => {
    expect(metadataLoadReducer(ERROR_STATE, { kind: "load" })).toEqual({ status: "loading" });
  });

  it("führt nach einem Fehlschlag wieder bis ready, das Board bleibt also erreichbar", () => {
    const afterRetry = metadataLoadReducer(ERROR_STATE, { kind: "retry" });
    const afterSecondLoad = metadataLoadReducer(afterRetry, {
      kind: "resolved",
      options: OPTIONS,
      branch: "entityMetadata",
    });

    expect(afterSecondLoad).toEqual({ status: "ready", options: OPTIONS, branch: "entityMetadata" });
  });

  it("überschreibt eine ältere Fehlermeldung bei erneutem Fehlschlag", () => {
    const again = metadataLoadReducer(ERROR_STATE, { kind: "failed", message: "immer noch kaputt" });

    expect(again).toEqual({ status: "error", message: "immer noch kaputt" });
  });
});

describe("messageOf", () => {
  it("nimmt die Meldung eines Error", () => {
    expect(messageOf(new Error("HTTP 503"))).toBe("HTTP 503");
  });

  it("nimmt eine Zeichenkette unverändert", () => {
    expect(messageOf("HTTP 503")).toBe("HTTP 503");
  });

  it("hat für alles andere einen Rückfall", () => {
    expect(messageOf({ code: 503 })).toBe("unknown error");
  });
});
