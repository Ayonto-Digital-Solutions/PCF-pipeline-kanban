export const STRING = {
  boardLoading: "Board_Loading",
  boardPagingKnownTotal: "Board_PagingKnownTotal",
  boardPagingUnknownTotal: "Board_PagingUnknownTotal",
  columnUnassigned: "Column_Unassigned",
  columnCountPartial: "Column_CountPartial",
  columnEmpty: "Column_Empty",
  cardUntitled: "Card_Untitled",
  errorTitle: "Error_Title",
  errorRetry: "Error_Retry",
} as const;

export type Translate = (key: string) => string;

export function format(template: string, ...values: readonly string[]): string {
  return template.replace(/\{(\d+)\}/g, (match: string, index: string): string => {
    const position = Number(index);
    return position >= 0 && position < values.length ? values[position] : match;
  });
}
