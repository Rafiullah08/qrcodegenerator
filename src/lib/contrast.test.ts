import { describe, expect, it } from "vitest";
import { contrastRatio, contrastWarning } from "@/lib/contrast";
import { COLOR_PRESETS } from "@/lib/types";

describe("contrast", () => {
  it("scores black on white as highly readable", () => {
    const ratio = contrastRatio("#000000", "#ffffff");
    expect(ratio).toBeGreaterThan(20);
    expect(contrastWarning("#111827", "#ffffff")).toBeNull();
  });

  it("warns when colors are too close or inverted", () => {
    expect(contrastWarning("#dddddd", "#ffffff")).toMatch(/too similar|Contrast is low/);
    expect(contrastWarning("#ffffff", "#111827")).toMatch(/lighter than the background/);
  });

  it("keeps the built-in presets readable", () => {
    for (const preset of COLOR_PRESETS) {
      expect(contrastWarning(preset.foreground, preset.background)).toBeNull();
    }
  });
});
