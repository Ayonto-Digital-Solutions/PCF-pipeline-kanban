import * as React from "react";

export interface EmptyStateProps {
  readonly message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message }) => (
  <p className="ayonto-kanban-empty">{message}</p>
);
