import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const stylesheet = readFileSync(resolve(__dirname, "../KanbanBoard/css/KanbanBoard.css"), "utf-8");

function ruleFor(selector: string): string {
  const start = stylesheet.indexOf(`${selector} {`);
  expect(start, `no rule for ${selector}`).toBeGreaterThanOrEqual(0);
  return stylesheet.slice(start, stylesheet.indexOf("}", start));
}

describe("stylesheet", () => {
  it("gives the root a minimum height so a hostless container cannot collapse it", () => {
    const root = ruleFor(".ayonto-kanban-root");
    const declared = /min-height:\s*(\d+)px/.exec(root);
    expect(declared, "the root declares no min-height in px").not.toBeNull();
    expect(Number(declared?.[1])).toBeGreaterThanOrEqual(200);
  });

  it("keeps the root at full height when the host provides one", () => {
    expect(ruleFor(".ayonto-kanban-root")).toContain("height: 100%");
  });

  it("scopes every rule under the control root", () => {
    const selectors = stylesheet
      .split("}")
      .map((block) => block.slice(0, block.indexOf("{")).trim())
      .filter((selector) => selector.length > 0 && !selector.startsWith("@"));
    const unscoped = selectors
      .flatMap((selector) => selector.split(","))
      .map((selector) => selector.trim())
      .filter((selector) => selector.length > 0 && !selector.startsWith(".ayonto-kanban-root"));
    expect(unscoped).toEqual([]);
  });
});
