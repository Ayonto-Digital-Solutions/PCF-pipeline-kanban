interface PointerInit extends MouseEventInit {
  readonly pointerId?: number;
  readonly pointerType?: string;
  readonly isPrimary?: boolean;
}

function installPointerEvent(): void {
  if ("PointerEvent" in globalThis) {
    return;
  }

  class PointerEventStandIn extends MouseEvent {
    public readonly pointerId: number;
    public readonly pointerType: string;
    public readonly isPrimary: boolean;

    public constructor(type: string, init: PointerInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? "mouse";
      this.isPrimary = init.isPrimary ?? true;
    }
  }

  Object.defineProperty(globalThis, "PointerEvent", {
    configurable: true,
    writable: true,
    value: PointerEventStandIn,
  });
}

if (typeof window !== "undefined") {
  installPointerEvent();
}
