import { CardRecord } from "../model/types";
import { PagingSummary } from "../hooks/useDatasetRecords";
import { STRING, Translate, format } from "./strings";

export function columnCountLabel(count: number, hasNextPage: boolean, translate: Translate): string {
  return hasNextPage ? format(translate(STRING.columnCountPartial), String(count)) : String(count);
}

export function pagingNotice(paging: PagingSummary, translate: Translate): string | null {
  if (!paging.hasNextPage) {
    return null;
  }
  if (paging.totalCount === null) {
    return format(translate(STRING.boardPagingUnknownTotal), String(paging.loadedCount));
  }
  return format(
    translate(STRING.boardPagingKnownTotal),
    String(paging.loadedCount),
    String(paging.totalCount)
  );
}

export function cardTitleOf(card: CardRecord, translate: Translate): string {
  return card.title.length > 0 ? card.title : translate(STRING.cardUntitled);
}
