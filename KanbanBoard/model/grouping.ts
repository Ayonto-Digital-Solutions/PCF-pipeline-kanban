import {
  BoardColumn,
  BoardState,
  CardRecord,
  ColumnDefinition,
  OptionValue,
  RawGroupValue,
  UNASSIGNED_KEY,
  optionKey,
} from "./types";

export function normalizeOptionValue(raw: RawGroupValue): OptionValue | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : null;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export interface GroupingInput {
  readonly options: readonly ColumnDefinition[];
  readonly records: readonly CardRecord[];
  readonly unassignedLabel: string;
}

export function buildBoard(input: GroupingInput): BoardState {
  const buckets = new Map<OptionValue, CardRecord[]>();
  input.options.forEach((option) => {
    if (!buckets.has(option.value)) {
      buckets.set(option.value, []);
    }
  });

  const unassigned: CardRecord[] = [];
  input.records.forEach((record) => {
    const value = normalizeOptionValue(record.groupValue);
    const bucket = value === null ? undefined : buckets.get(value);
    if (bucket === undefined) {
      unassigned.push(record);
      return;
    }
    bucket.push(record);
  });

  const columns: BoardColumn[] = [
    {
      key: UNASSIGNED_KEY,
      label: input.unassignedLabel,
      color: null,
      value: null,
      cards: unassigned,
    },
  ];

  input.options.forEach((option) => {
    columns.push({
      key: optionKey(option.value),
      label: option.label.trim(),
      color: option.color,
      value: option.value,
      cards: buckets.get(option.value) ?? [],
    });
  });

  return { columns };
}
