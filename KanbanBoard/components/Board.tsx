import * as React from "react";
import { BoardState } from "../model/types";
import { PagingSummary } from "../hooks/useDatasetRecords";
import { Translate } from "./strings";
import { pagingNotice } from "./labels";
import { Column } from "./Column";

export interface BoardProps {
  readonly board: BoardState;
  readonly paging: PagingSummary;
  readonly translate: Translate;
  readonly onOpenRecord: (recordId: string) => void;
}

export const Board: React.FC<BoardProps> = ({ board, paging, translate, onOpenRecord }) => {
  const notice = pagingNotice(paging, translate);

  return (
    <>
      {notice !== null ? <p className="ayonto-kanban-paging">{notice}</p> : null}
      <div className="ayonto-kanban-board">
        {board.columns.map((column) => (
          <Column
            key={column.key}
            column={column}
            hasNextPage={paging.hasNextPage}
            translate={translate}
            onOpenRecord={onOpenRecord}
          />
        ))}
      </div>
    </>
  );
};
