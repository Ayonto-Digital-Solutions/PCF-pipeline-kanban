import { ColumnDefinition } from "../model/types";

export type MetadataBranch = "entityMetadata" | "metadataEndpoint";

export interface OptionMetadataResult {
  readonly options: readonly ColumnDefinition[];
  readonly branch: MetadataBranch;
}

export interface MetadataSource {
  readonly getEntityMetadata: (entityName: string, attributes: string[]) => Promise<unknown>;
  readonly fetchMetadataEndpoint: (entityName: string, attributeName: string) => Promise<unknown>;
  readonly log: (message: string) => void;
}

export interface OptionMetadataService {
  readonly load: (entityName: string, attributeName: string) => Promise<OptionMetadataResult>;
  readonly invalidate: () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asUnknownArray(value: unknown): unknown[] | null {
  return Array.isArray(value) ? (value as unknown[]) : null;
}

function readOptionArray(container: unknown): unknown[] | null {
  const direct = asUnknownArray(container);
  if (direct !== null) {
    return direct;
  }
  return isRecord(container) ? asUnknownArray(container.Options) : null;
}

function readLabel(raw: unknown): string | null {
  if (typeof raw === "string") {
    return raw;
  }
  if (isRecord(raw) && isRecord(raw.UserLocalizedLabel) && typeof raw.UserLocalizedLabel.Label === "string") {
    return raw.UserLocalizedLabel.Label;
  }
  return null;
}

function toColumnDefinition(raw: unknown): ColumnDefinition | null {
  if (!isRecord(raw)) {
    return null;
  }
  const value: unknown = raw.Value;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  const label = readLabel(raw.Label);
  if (label === null) {
    return null;
  }
  const color: unknown = raw.Color;
  return {
    value,
    label,
    color: typeof color === "string" ? color : null,
  };
}

export function extractOptions(container: unknown): readonly ColumnDefinition[] | null {
  const raw = readOptionArray(container);
  if (raw === null || raw.length === 0) {
    return null;
  }
  const options: ColumnDefinition[] = [];
  for (const entry of raw) {
    const option = toColumnDefinition(entry);
    if (option === null) {
      return null;
    }
    options.push(option);
  }
  return options;
}

export function optionsFromEntityMetadata(metadata: unknown, attributeName: string): readonly ColumnDefinition[] | null {
  if (!isRecord(metadata)) {
    return null;
  }
  const attributes = isRecord(metadata.metadata) ? metadata.metadata : metadata;
  const attribute: unknown = attributes[attributeName];
  if (!isRecord(attribute)) {
    return null;
  }
  return extractOptions(attribute.OptionSet);
}

export function optionsFromMetadataEndpoint(payload: unknown): readonly ColumnDefinition[] | null {
  if (!isRecord(payload)) {
    return null;
  }
  return extractOptions(payload.OptionSet);
}

export function createOptionMetadataService(source: MetadataSource): OptionMetadataService {
  const cache = new Map<string, OptionMetadataResult>();
  let branchLogged = false;

  function logBranchOnce(branch: MetadataBranch): void {
    if (branchLogged) {
      return;
    }
    branchLogged = true;
    source.log(
      branch === "entityMetadata"
        ? "Option metadata resolved through context.utils.getEntityMetadata."
        : "Option metadata resolved through the metadata endpoint; getEntityMetadata did not carry value, label and colour."
    );
  }

  async function fromEntityMetadata(
    entityName: string,
    attributeName: string
  ): Promise<readonly ColumnDefinition[] | null> {
    try {
      const metadata = await source.getEntityMetadata(entityName, [attributeName]);
      return optionsFromEntityMetadata(metadata, attributeName);
    } catch {
      return null;
    }
  }

  async function load(entityName: string, attributeName: string): Promise<OptionMetadataResult> {
    const key = `${entityName}:${attributeName}`;
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const preferred = await fromEntityMetadata(entityName, attributeName);
    if (preferred !== null) {
      const result: OptionMetadataResult = { options: preferred, branch: "entityMetadata" };
      logBranchOnce(result.branch);
      cache.set(key, result);
      return result;
    }

    const payload = await source.fetchMetadataEndpoint(entityName, attributeName);
    const fallback = optionsFromMetadataEndpoint(payload);
    if (fallback === null) {
      throw new Error(`No option metadata for ${entityName}.${attributeName}`);
    }
    const result: OptionMetadataResult = { options: fallback, branch: "metadataEndpoint" };
    logBranchOnce(result.branch);
    cache.set(key, result);
    return result;
  }

  return {
    load,
    invalidate: () => {
      cache.clear();
    },
  };
}

export async function fetchOptionSetMetadata(entityName: string, attributeName: string): Promise<unknown> {
  const url =
    `/api/data/v9.2/EntityDefinitions(LogicalName='${entityName}')` +
    `/Attributes(LogicalName='${attributeName}')` +
    `/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet`;
  const response = await fetch(url, {
    headers: { "OData-MaxVersion": "4.0", "OData-Version": "4.0", Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}
