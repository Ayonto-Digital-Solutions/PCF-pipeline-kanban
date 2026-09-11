import * as React from "react";

export interface DragLayerProps {
  readonly label: string;
  readonly x: number;
  readonly y: number;
}

export const DragLayer: React.FC<DragLayerProps> = ({ label, x, y }) => (
  <div className="ayonto-kanban-drag-layer" style={{ transform: `translate(${String(x)}px, ${String(y)}px)` }}>
    <span className="ayonto-kanban-card-title">{label}</span>
  </div>
);
