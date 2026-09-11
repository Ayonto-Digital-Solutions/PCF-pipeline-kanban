import { BoardColumn, CardRecord } from "../model/types";
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

export function columnAccessibleName(column: BoardColumn, translate: Translate): string {
  return format(translate(STRING.columnAccessibleName), column.label, String(column.cards.length));
}

export function grabbedAnnouncement(title: string, columnLabel: string, translate: Translate): string {
  return format(translate(STRING.a11yGrabbed), title, columnLabel);
}

export function targetAnnouncement(
  columnLabel: string,
  position: number,
  count: number,
  translate: Translate
): string {
  return format(translate(STRING.a11yTarget), columnLabel, String(position + 1), String(Math.max(count, 1)));
}

export function resultAnnouncement(
  outcome: "moved" | "unchanged" | "cancelled" | "rejected",
  title: string,
  columnLabel: string,
  translate: Translate
): string {
  const key =
    outcome === "moved"
      ? STRING.a11yDropped
      : outcome === "unchanged"
        ? STRING.a11yDropUnchanged
        : outcome === "cancelled"
          ? STRING.a11yCancelled
          : STRING.a11yRejected;
  return format(translate(key), title, columnLabel);
}
