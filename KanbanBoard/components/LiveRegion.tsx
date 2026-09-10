import * as React from "react";

export interface LiveRegionProps {
  readonly message: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({ message }) => (
  <div className="ayonto-kanban-live" role="status" aria-live="polite" aria-atomic="true">
    {message}
  </div>
);
