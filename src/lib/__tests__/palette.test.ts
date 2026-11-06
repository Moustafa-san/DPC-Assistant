import { describe, it, expect } from "vitest";
import {
  hexToRgbNormalized,
  getRelativeLuminance,
  analyzePalette,
  generate3dLutCube,
} from "../palette/lut-generator";
import { ColorPalette } from "../schemas/palette";

describe("Cine Palette & 3D LUT (.cube) Generator", () => {
  const editorialPalette: ColorPalette = {
    id: "pal-editorial-1",
    name: "Cairo Studio Gold",
    mood: "Warm Editorial Film",
    dominantColor: "#F6F2E9",  // Warm Ivory (60%)
    secondaryColor: "#46513B", // Deep Olive (30%)
    accentColor: "#A8875B",    // Muted Bronze (10%)
  };

  it("converts hex colors to normalized RGB values and computes luminance", () => {
    const whiteRgb = hexToRgbNormalized("#FFFFFF");
    expect(whiteRgb).toEqual([1, 1, 1]);
    expect(getRelativeLuminance(whiteRgb)).toBe(1);

    const blackRgb = hexToRgbNormalized("#000000");
    expect(blackRgb).toEqual([0, 0, 0]);
    expect(getRelativeLuminance(blackRgb)).toBe(0);
  });

  it("analyzes palette luminance and verifies 60/30/10 components", () => {
    const analysis = analyzePalette(editorialPalette);

    expect(analysis.isHarmony60_30_10Valid).toBe(true);
    // Warm Ivory is bright surface, Deep Olive is dark
    expect(analysis.luminance.dominant).toBeGreaterThan(analysis.luminance.secondary);
  });

  it("generates a valid Adobe .cube 3D LUT with exact line counts and header", () => {
    const lutSize = 9; // 9x9x9 = 729 data points
    const lutOutput = generate3dLutCube(editorialPalette, {
      title: "Cairo_Studio_Gold",
      size: lutSize,
      contrast: 1.1,
      saturation: 1.05,
      warmth: 0.2,
    });

    const lines = lutOutput.split("\n");

    // Header validation
    expect(lines[1]).toBe('TITLE "Cairo_Studio_Gold"');
    expect(lines[2]).toBe(`LUT_3D_SIZE ${lutSize}`);
    expect(lines[3]).toBe("DOMAIN_MIN 0.0 0.0 0.0");
    expect(lines[4]).toBe("DOMAIN_MAX 1.0 1.0 1.0");

    // 5 header lines + 729 data lines = 734 lines
    const expectedDataLines = lutSize * lutSize * lutSize;
    expect(lines.length).toBe(5 + expectedDataLines);

    // Validate that all data points have 3 floats clamped to [0.0, 1.0]
    for (let i = 5; i < lines.length; i++) {
      const parts = lines[i].split(" ");
      expect(parts.length).toBe(3);

      const r = parseFloat(parts[0]);
      const g = parseFloat(parts[1]);
      const b = parseFloat(parts[2]);

      expect(r).toBeGreaterThanOrEqual(0.0);
      expect(r).toBeLessThanOrEqual(1.0);
      expect(g).toBeGreaterThanOrEqual(0.0);
      expect(g).toBeLessThanOrEqual(1.0);
      expect(b).toBeGreaterThanOrEqual(0.0);
      expect(b).toBeLessThanOrEqual(1.0);
    }
  });

  it("generates standard 17x17x17 grid LUTs accurately", () => {
    const lutSize = 17; // 17x17x17 = 4,913 data points
    const lutOutput = generate3dLutCube(editorialPalette, {
      title: "Cairo_17",
      size: lutSize,
      contrast: 1.0,
      saturation: 1.0,
      warmth: 0.0,
    });

    const lines = lutOutput.split("\n");
    expect(lines.length).toBe(5 + 17 * 17 * 17);
  });
});
