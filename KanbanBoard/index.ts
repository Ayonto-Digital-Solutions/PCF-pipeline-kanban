import * as React from "react";
import { IInputs, IOutputs } from "./generated/ManifestTypes";

export class KanbanBoard implements ComponentFramework.ReactControl<IInputs, IOutputs> {
  public init(
    _context: ComponentFramework.Context<IInputs>,
    _notifyOutputChanged: () => void,
    _state: ComponentFramework.Dictionary
  ): void {
    return;
  }

  public updateView(_context: ComponentFramework.Context<IInputs>): React.ReactElement {
    return React.createElement("div");
  }

  public getOutputs(): IOutputs {
    return {};
  }

  public destroy(): void {
    return;
  }
}
