import { describe, expect, it } from "vitest";
import {
  ACCENT_INK,
  DEFAULT_ACCENT,
  MINIMUM_CONTRAST,
  accentFor,
  blend,
  contrastRatio,
  headerTintFor,
  parseHexColor,
  readableTextOn,
  toHexColor,
  CARD_SURFACE,
  COLUMN_SURFACE,
  FOCUS_RING,
  focusRingContrastOn,
  MINIMUM_NON_TEXT_CONTRAST,
} from "../KanbanBoard/model/contrast";

const OPTION_COLOURS = [
  "#cfe3a8",
  "#1F8A70",
  "#000000",
  "#FFFFFF",
  "#E1E4EC",
  "#7F7F7F",
  "#122b4a",
  "#f5c400",
  "#b00020",
  "#0d5d56",
];

describe("parseHexColor", () => {
  it("liest die sechsstellige Form", () => {
    expect(parseHexColor("#cfe3a8")).toEqual({ r: 207, g: 227, b: 168 });
  });

  it("liest die dreistellige Form als Verdopplung", () => {
    expect(parseHexColor("#abc")).toEqual({ r: 170, g: 187, b: 204 });
  });

  it("kommt ohne Rautenzeichen und mit Leerzeichen zurecht", () => {
    expect(parseHexColor("  CFE3A8 ")).toEqual({ r: 207, g: 227, b: 168 });
  });

  it("gibt für Unbrauchbares null zurück", () => {
    expect(parseHexColor("rot")).toBeNull();
    expect(parseHexColor("#12345")).toBeNull();
    expect(parseHexColor("")).toBeNull();
  });
});

describe("contrastRatio", () => {
  it("liefert für Schwarz gegen Weiß 21", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  });

  it("liefert für gleiche Farben 1", () => {
    expect(contrastRatio("#cfe3a8", "#cfe3a8")).toBeCloseTo(1, 5);
  });

  it("ist richtungsunabhängig", () => {
    expect(contrastRatio("#1F8A70", "#FFFFFF")).toBe(contrastRatio("#FFFFFF", "#1F8A70"));
  });

  it("gibt null zurück, wenn eine Farbe unlesbar ist", () => {
    expect(contrastRatio("rot", "#FFFFFF")).toBeNull();
  });
});

describe("headerTintFor, der belegte Kontrast des Spaltenkopfs", () => {
  it.each(OPTION_COLOURS)("erreicht mit %s als Optionsfarbe mindestens AA für den Kopftext", (colour) => {
    const tint = headerTintFor(colour);
    const ratio = contrastRatio(readableTextOn(tint), tint);

    expect(ratio).not.toBeNull();
    expect(ratio ?? 0).toBeGreaterThanOrEqual(MINIMUM_CONTRAST);
  });

  it("erreicht auch ohne Optionsfarbe mindestens AA", () => {
    const tint = headerTintFor(null);

    expect(contrastRatio(readableTextOn(tint), tint) ?? 0).toBeGreaterThanOrEqual(MINIMUM_CONTRAST);
  });

  it("wählt für den Kopftext durchgehend die dunkle Schrift, weil der Ton aufgehellt ist", () => {
    OPTION_COLOURS.forEach((colour) => {
      expect(readableTextOn(headerTintFor(colour))).toBe(ACCENT_INK);
    });
  });

  it("hellt eine dunkle Optionsfarbe sichtbar auf, statt Text darauf zu setzen", () => {
    expect(headerTintFor("#000000")).toBe("#d1d1d1");
  });

  it("lässt Weiß als Optionsfarbe weiß", () => {
    expect(headerTintFor("#FFFFFF")).toBe("#ffffff");
  });

  it("nimmt bei unlesbarer Farbe den Standardakzent als Grundlage", () => {
    expect(headerTintFor("rot")).toBe(headerTintFor(DEFAULT_ACCENT));
  });
});

describe("blend und toHexColor", () => {
  it("mischt hälftig", () => {
    expect(toHexColor(blend({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }, 0.5))).toBe("#808080");
  });

  it("gibt bei Alpha 1 die Vordergrundfarbe zurück", () => {
    expect(toHexColor(blend({ r: 207, g: 227, b: 168 }, { r: 255, g: 255, b: 255 }, 1))).toBe("#cfe3a8");
  });

  it("füllt einstellige Kanäle auf zwei Stellen auf", () => {
    expect(toHexColor({ r: 1, g: 2, b: 3 })).toBe("#010203");
  });
});

describe("accentFor", () => {
  it("nimmt die Optionsfarbe, wenn es eine gibt", () => {
    expect(accentFor("#cfe3a8")).toBe("#cfe3a8");
  });

  it("nimmt den Standardakzent, wenn keine Farbe gesetzt ist", () => {
    expect(accentFor(null)).toBe(DEFAULT_ACCENT);
  });

  it("nimmt den Standardakzent, wenn die Farbe unlesbar ist", () => {
    expect(accentFor("rot")).toBe(DEFAULT_ACCENT);
  });
});

describe("Fokusring, belegter Kontrast", () => {
  it("hebt sich von der Kartenfläche ab", () => {
    expect(focusRingContrastOn(CARD_SURFACE)).toBeGreaterThanOrEqual(MINIMUM_NON_TEXT_CONTRAST);
  });

  it("hebt sich von der Spaltenfläche ab", () => {
    expect(focusRingContrastOn(COLUMN_SURFACE)).toBeGreaterThanOrEqual(MINIMUM_NON_TEXT_CONTRAST);
  });

  it.each(OPTION_COLOURS)("hebt sich auch vom Akzentbalken in %s ab", (colour) => {
    expect(focusRingContrastOn(accentFor(colour))).toBeGreaterThanOrEqual(MINIMUM_NON_TEXT_CONTRAST);
  });

  it.each(OPTION_COLOURS)("hebt sich vom aufgehellten Spaltenkopf in %s ab", (colour) => {
    expect(focusRingContrastOn(headerTintFor(colour))).toBeGreaterThanOrEqual(MINIMUM_NON_TEXT_CONTRAST);
  });

  it("trägt den Kontrast auf dunklem Grund über den hellen Anteil", () => {
    expect(contrastRatio(FOCUS_RING, "#122b4a") ?? 0).toBeLessThan(MINIMUM_NON_TEXT_CONTRAST);
    expect(focusRingContrastOn("#122b4a")).toBeGreaterThanOrEqual(MINIMUM_NON_TEXT_CONTRAST);
  });
});
