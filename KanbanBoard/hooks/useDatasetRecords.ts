import * as React from "react";
import { CardRecord, RawGroupValue } from "../model/types";

export interface DatasetRecordLike {
  getRecordId: () => string;
  getValue: (columnName: string) => unknown;
  getFormattedValue: (columnName: string) => string;
  getNamedReference: () => { readonly name?: string | null };
}

export interface DatasetPagingLike {
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
  readonly pageSize: number;
  readonly totalResultCount: number;
}

export interface DatasetLike {
  readonly loading: boolean;
  readonly error: boolean;
  readonly errorMessage?: string;
  readonly sortedRecordIds: readonly string[];
  readonly records: Readonly<Record<string, DatasetRecordLike | undefined>>;
  readonly paging: DatasetPagingLike;
}

export interface ColumnBinding {
  readonly groupBy: string;
  readonly title: string;
  readonly subtitle: string | null;
  readonly badge: string | null;
}

export interface PagingSummary {
  readonly loadedCount: number;
  readonly totalCount: number | null;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
  readonly pageSize: number;
}

export interface DatasetBinding {
  readonly records: readonly CardRecord[];
  readonly paging: PagingSummary;
}

function toRawGroupValue(value: unknown): RawGroupValue {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }
  return null;
}

function optionalText(record: DatasetRecordLike, columnName: string | null): string | null {
  if (columnName === null) {
    return null;
  }
  const formatted = record.getFormattedValue(columnName);
  return formatted.length === 0 ? null : formatted;
}

export function toCardRecord(record: DatasetRecordLike, binding: ColumnBinding): CardRecord {
  const title = optionalText(record, binding.title);
  const primaryName = record.getNamedReference().name;
  return {
    id: record.getRecordId(),
    title: title ?? (typeof primaryName === "string" && primaryName.length > 0 ? primaryName : ""),
    subtitle: optionalText(record, binding.subtitle),
    badge: optionalText(record, binding.badge),
    groupValue: toRawGroupValue(record.getValue(binding.groupBy)),
  };
}

export function toCardRecords(dataset: DatasetLike, binding: ColumnBinding): readonly CardRecord[] {
  const cards: CardRecord[] = [];
  dataset.sortedRecordIds.forEach((id) => {
    const record = dataset.records[id];
    if (record !== undefined) {
      cards.push(toCardRecord(record, binding));
    }
  });
  return cards;
}

export function readPaging(dataset: DatasetLike, loadedCount: number): PagingSummary {
  const total = dataset.paging.totalResultCount;
  return {
    loadedCount,
    totalCount: total < 0 ? null : total,
    hasNextPage: dataset.paging.hasNextPage,
    hasPreviousPage: dataset.paging.hasPreviousPage,
    pageSize: dataset.paging.pageSize,
  };
}

export function useDatasetRecords(dataset: DatasetLike, binding: ColumnBinding): DatasetBinding {
  return React.useMemo(() => {
    const records = toCardRecords(dataset, binding);
    return { records, paging: readPaging(dataset, records.length) };
  }, [dataset, binding]);
}
