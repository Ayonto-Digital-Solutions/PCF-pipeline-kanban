import { describe, expect, it, vi } from "vitest";
import {
  MetadataSource,
  createOptionMetadataService,
  optionsFromEntityMetadata,
} from "../KanbanBoard/services/metadata";

function optionWithColor(value: number, label: string, color: string | null) {
  return { Value: value, Label: label, Color: color };
}

function entityMetadataCarrying(attributeName: string, options: unknown[]) {
  return { metadata: { [attributeName]: { OptionSet: { Options: options } } } };
}

function makeSource(overrides: Partial<MetadataSource> = {}): MetadataSource & {
  getEntityMetadata: ReturnType<typeof vi.fn>;
  fetchMetadataEndpoint: ReturnType<typeof vi.fn>;
  log: ReturnType<typeof vi.fn>;
} {
  return {
    getEntityMetadata: vi.fn().mockResolvedValue(undefined),
    fetchMetadataEndpoint: vi.fn().mockResolvedValue(undefined),
    log: vi.fn(),
    ...overrides,
  } as never;
}

describe("Zweigauswahl der Fallback-Kette", () => {
  it("nimmt getEntityMetadata, wenn Wert, Label und Farbe mitkommen", async () => {
    const source = makeSource({
      getEntityMetadata: vi
        .fn()
        .mockResolvedValue(entityMetadataCarrying("eo_progress", [optionWithColor(1, "Draft ", "#cfe3a8")])),
    });

    const result = await createOptionMetadataService(source).load("eo_decisionassessment", "eo_progress");

    expect(result.branch).toBe("entityMetadata");
    expect(result.options).toEqual([{ value: 1, label: "Draft ", color: "#cfe3a8" }]);
    expect(source.fetchMetadataEndpoint).not.toHaveBeenCalled();
  });

  it("fällt auf den Metadata-Endpunkt zurück, wenn die Farbe fehlt", async () => {
    const source = makeSource({
      getEntityMetadata: vi
        .fn()
        .mockResolvedValue(entityMetadataCarrying("eo_progress", [{ Value: 1, Label: "Draft" }])),
      fetchMetadataEndpoint: vi
        .fn()
        .mockResolvedValue({ OptionSet: { Options: [optionWithColor(1, "Draft", "#cfe3a8")] } }),
    });

    const result = await createOptionMetadataService(source).load("eo_decisionassessment", "eo_progress");

    expect(result.branch).toBe("metadataEndpoint");
    expect(source.fetchMetadataEndpoint).toHaveBeenCalledTimes(1);
  });

  it("fällt zurück, wenn getEntityMetadata die Optionsliste gar nicht mitführt", async () => {
    const source = makeSource({
      getEntityMetadata: vi.fn().mockResolvedValue({ metadata: { eo_progress: { LogicalName: "eo_progress" } } }),
      fetchMetadataEndpoint: vi
        .fn()
        .mockResolvedValue({ OptionSet: { Options: [optionWithColor(1, "Draft", null)] } }),
    });

    const result = await createOptionMetadataService(source).load("eo_decisionassessment", "eo_progress");

    expect(result.branch).toBe("metadataEndpoint");
    expect(result.options).toEqual([{ value: 1, label: "Draft", color: null }]);
  });

  it("fällt zurück, wenn getEntityMetadata wirft", async () => {
    const source = makeSource({
      getEntityMetadata: vi.fn().mockRejectedValue(new Error("nicht verfügbar")),
      fetchMetadataEndpoint: vi
        .fn()
        .mockResolvedValue({ OptionSet: { Options: [optionWithColor(2, "Work", "#ffffff")] } }),
    });

    const result = await createOptionMetadataService(source).load("eo_decisionassessment", "eo_progress");

    expect(result.branch).toBe("metadataEndpoint");
  });

  it("wirft, wenn kein Zweig Optionen liefert, statt welche zu erfinden", async () => {
    const source = makeSource();

    await expect(
      createOptionMetadataService(source).load("eo_decisionassessment", "eo_progress")
    ).rejects.toThrow("No option metadata for eo_decisionassessment.eo_progress");
  });

  it("behandelt eine leere Optionsliste als Fehlanzeige, nicht als Ergebnis", async () => {
    const source = makeSource({
      getEntityMetadata: vi.fn().mockResolvedValue(entityMetadataCarrying("eo_progress", [])),
      fetchMetadataEndpoint: vi.fn().mockResolvedValue({ OptionSet: { Options: [] } }),
    });

    await expect(
      createOptionMetadataService(source).load("eo_decisionassessment", "eo_progress")
    ).rejects.toThrow();
  });

  it("liest das Label auch in der UserLocalizedLabel-Form", () => {
    const metadata = entityMetadataCarrying("eo_progress", [
      { Value: 3, Label: { UserLocalizedLabel: { Label: "Done " } }, Color: null },
    ]);

    expect(optionsFromEntityMetadata(metadata, "eo_progress")).toEqual([{ value: 3, label: "Done ", color: null }]);
  });

  it("übernimmt die Reihenfolge der gelieferten Optionen", async () => {
    const source = makeSource({
      getEntityMetadata: vi.fn().mockResolvedValue(
        entityMetadataCarrying("eo_progress", [
          optionWithColor(122180002, "Done", null),
          optionWithColor(122180000, "Draft", null),
          optionWithColor(122180001, "Work", null),
        ])
      ),
    });

    const result = await createOptionMetadataService(source).load("eo_decisionassessment", "eo_progress");

    expect(result.options.map((o) => o.value)).toEqual([122180002, 122180000, 122180001]);
  });
});

describe("Zwischenspeicher und Protokollierung", () => {
  it("fragt die Quelle beim zweiten Aufruf nicht erneut", async () => {
    const source = makeSource({
      getEntityMetadata: vi
        .fn()
        .mockResolvedValue(entityMetadataCarrying("eo_progress", [optionWithColor(1, "Draft", null)])),
    });
    const service = createOptionMetadataService(source);

    await service.load("eo_decisionassessment", "eo_progress");
    await service.load("eo_decisionassessment", "eo_progress");

    expect(source.getEntityMetadata).toHaveBeenCalledTimes(1);
  });

  it("fragt nach invalidate erneut", async () => {
    const source = makeSource({
      getEntityMetadata: vi
        .fn()
        .mockResolvedValue(entityMetadataCarrying("eo_progress", [optionWithColor(1, "Draft", null)])),
    });
    const service = createOptionMetadataService(source);

    await service.load("eo_decisionassessment", "eo_progress");
    service.invalidate();
    await service.load("eo_decisionassessment", "eo_progress");

    expect(source.getEntityMetadata).toHaveBeenCalledTimes(2);
  });

  it("protokolliert den greifenden Zweig genau einmal", async () => {
    const source = makeSource({
      getEntityMetadata: vi
        .fn()
        .mockResolvedValue(entityMetadataCarrying("eo_progress", [optionWithColor(1, "Draft", null)])),
    });
    const service = createOptionMetadataService(source);

    await service.load("eo_decisionassessment", "eo_progress");
    service.invalidate();
    await service.load("eo_decisionassessment", "eo_progress");

    expect(source.log).toHaveBeenCalledTimes(1);
    expect(source.log).toHaveBeenCalledWith(expect.stringContaining("getEntityMetadata"));
  });
});
