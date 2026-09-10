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
  columnAccessibleName: "Column_AccessibleName",
  a11yGrabbed: "A11y_Grabbed",
  a11yTarget: "A11y_Target",
  a11yDropped: "A11y_Dropped",
  a11yDropUnchanged: "A11y_DropUnchanged",
  a11yCancelled: "A11y_Cancelled",
  a11yRejected: "A11y_Rejected",
} as const;

export type Translate = (key: string) => string;

export function format(template: string, ...values: readonly string[]): string {
  return template.replace(/\{(\d+)\}/g, (match: string, index: string): string => {
    const position = Number(index);
    return position >= 0 && position < values.length ? values[position] : match;
  });
}
