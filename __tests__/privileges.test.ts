import { describe, expect, it, vi } from "vitest";
import { PRIVILEGE_DEPTH, PRIVILEGE_TYPE, createPrivilegeService } from "../KanbanBoard/services/privileges";

describe("createPrivilegeService", () => {
  it("lädt die Metadaten, bevor es hasEntityPrivilege ruft", async () => {
    const calls: string[] = [];
    const service = createPrivilegeService({
      getEntityMetadata: async (entityName) => {
        calls.push(`metadata:${entityName}`);
        return Promise.resolve(undefined);
      },
      hasEntityPrivilege: (entityName) => {
        calls.push(`privilege:${entityName}`);
        return true;
      },
    });

    await service.can("eo_decisionassessment", PRIVILEGE_TYPE.Write);

    expect(calls).toEqual(["metadata:eo_decisionassessment", "privilege:eo_decisionassessment"]);
  });

  it("wärmt die Metadaten je Tabelle nur einmal", async () => {
    const getEntityMetadata = vi.fn().mockResolvedValue(undefined);
    const service = createPrivilegeService({ getEntityMetadata, hasEntityPrivilege: () => true });

    await service.can("eo_decisionassessment", PRIVILEGE_TYPE.Create);
    await service.can("eo_decisionassessment", PRIVILEGE_TYPE.Write);

    expect(getEntityMetadata).toHaveBeenCalledTimes(1);
  });

  it("reicht Typ und Tiefe unverändert durch", async () => {
    const hasEntityPrivilege = vi.fn().mockReturnValue(false);
    const service = createPrivilegeService({
      getEntityMetadata: vi.fn().mockResolvedValue(undefined),
      hasEntityPrivilege,
    });

    const allowed = await service.can("eo_decisionassessment", PRIVILEGE_TYPE.Create, PRIVILEGE_DEPTH.Global);

    expect(allowed).toBe(false);
    expect(hasEntityPrivilege).toHaveBeenCalledWith("eo_decisionassessment", 1, 3);
  });

  it("nutzt Basic als Vorgabetiefe", async () => {
    const hasEntityPrivilege = vi.fn().mockReturnValue(true);
    const service = createPrivilegeService({
      getEntityMetadata: vi.fn().mockResolvedValue(undefined),
      hasEntityPrivilege,
    });

    await service.can("eo_decisionassessment", PRIVILEGE_TYPE.Read);

    expect(hasEntityPrivilege).toHaveBeenCalledWith("eo_decisionassessment", 2, 0);
  });

  it("prüft auch dann, wenn das Laden der Metadaten scheitert", async () => {
    const hasEntityPrivilege = vi.fn().mockReturnValue(false);
    const service = createPrivilegeService({
      getEntityMetadata: vi.fn().mockRejectedValue(new Error("nicht erreichbar")),
      hasEntityPrivilege,
    });

    await expect(service.can("eo_decisionassessment", PRIVILEGE_TYPE.Write)).resolves.toBe(false);
    expect(hasEntityPrivilege).toHaveBeenCalledTimes(1);
  });

  it("wärmt nach invalidate erneut", async () => {
    const getEntityMetadata = vi.fn().mockResolvedValue(undefined);
    const service = createPrivilegeService({ getEntityMetadata, hasEntityPrivilege: () => true });

    await service.can("eo_decisionassessment", PRIVILEGE_TYPE.Write);
    service.invalidate();
    await service.can("eo_decisionassessment", PRIVILEGE_TYPE.Write);

    expect(getEntityMetadata).toHaveBeenCalledTimes(2);
  });
});
