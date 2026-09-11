export type OptionValue = number;

export type RawGroupValue = number | string | null | undefined;

export interface ColumnDefinition {
  readonly value: OptionValue;
  readonly label: string;
  readonly color: string | null;
}

export interface CardRecord {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string | null;
  readonly badge: string | null;
  readonly groupValue: RawGroupValue;
}

export type ColumnKey = string;

export const UNASSIGNED_KEY: ColumnKey = "unassigned";

export function optionKey(value: OptionValue): ColumnKey {
  return `option:${value}`;
}

export interface BoardColumn {
  readonly key: ColumnKey;
  readonly label: string;
  readonly color: string | null;
  readonly value: OptionValue | null;
  readonly cards: readonly CardRecord[];
}

export interface BoardState {
  readonly columns: readonly BoardColumn[];
}

export type MoveStatus = "pending" | "confirmed" | "reverted";

export type RevertReason = "rejected" | "foreignChange" | "recordGone";

export interface MoveState {
  readonly recordId: string;
  readonly from: OptionValue | null;
  readonly to: OptionValue | null;
  readonly status: MoveStatus;
  readonly reason: RevertReason | null;
  readonly observed: OptionValue | null;
}

export type MoveRegistry = ReadonlyMap<string, MoveState>;

export interface Override {
  readonly value: OptionValue | null;
}
