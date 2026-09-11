import * as React from "react";
import { Button } from "@fluentui/react-components";

export interface ErrorStateProps {
  readonly title: string;
  readonly detail: string;
  readonly retryLabel: string;
  readonly onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ title, detail, retryLabel, onRetry }) => (
  <div className="ayonto-kanban-error">
    <p className="ayonto-kanban-error-title">{title}</p>
    <p className="ayonto-kanban-error-detail">{detail}</p>
    <Button appearance="primary" onClick={onRetry}>
      {retryLabel}
    </Button>
  </div>
);
