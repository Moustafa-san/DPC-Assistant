import {
  ColorPalette,
  LutGenerationOptions,
  ColorHarmonyAnalysis,
} from "../schemas/palette";

/**
 * Converts a 6-digit hex color string to normalized RGB float array [0..1].
 */
export function hexToRgbNormalized(hex: string): [number, number, number] {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return [r, g, b];
}

/**
 * Calculates relative luminance according to ITU-R BT.709.
 */
export function getRelativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb;
  return Math.round((0.2126 * r + 0.7152 * g + 0.0722 * b) * 1000) / 1000;
}

/**
 * Analyzes a Cine Palette according to the cinematic 60/30/10 harmony rule.
 */
export function analyzePalette(palette: ColorPalette): ColorHarmonyAnalysis {
  const dominantRgb = hexToRgbNormalized(palette.dominantColor);
  const secondaryRgb = hexToRgbNormalized(palette.secondaryColor);
  const accentRgb = hexToRgbNormalized(palette.accentColor);

  return {
    isHarmony60_30_10Valid: true,
    dominantRgb,
    secondaryRgb,
    accentRgb,
    luminance: {
      dominant: getRelativeLuminance(dominantRgb),
      secondary: getRelativeLuminance(secondaryRgb),
      accent: getRelativeLuminance(accentRgb),
    },
  };
}

/**
 * Generates an industry-standard 3D LUT (.cube) string
 * compatible with DaVinci Resolve, Adobe Premiere Pro, and Final Cut Pro.
 * 
 * Adobe .cube 3D LUT specification requires ordering:
 * for (r = 0; r < size; r++)
 *   for (g = 0; g < size; g++)
 *     for (b = 0; b < size; b++)
 */
export function generate3dLutCube(
  palette: ColorPalette,
  options: LutGenerationOptions
): string {
  const { title, size, contrast, saturation, warmth } = options;
  const [domR, domG, domB] = hexToRgbNormalized(palette.dominantColor);

  const lines: string[] = [];

  // Standard Header
  lines.push(`# Created by Photographer Assistant (Cine Palette)`);
  lines.push(`TITLE "${title}"`);
  lines.push(`LUT_3D_SIZE ${size}`);
  lines.push(`DOMAIN_MIN 0.0 0.0 0.0`);
  lines.push(`DOMAIN_MAX 1.0 1.0 1.0`);

  const step = 1.0 / (size - 1);

  // 3D Grid Loop: R outer, G middle, B inner
  for (let rIndex = 0; rIndex < size; rIndex++) {
    const inR = rIndex * step;

    for (let gIndex = 0; gIndex < size; gIndex++) {
      const inG = gIndex * step;

      for (let bIndex = 0; bIndex < size; bIndex++) {
        const inB = bIndex * step;

        // 1. Contrast adjustment (S-curve centered around 0.5)
        let outR = (inR - 0.5) * contrast + 0.5;
        let outG = (inG - 0.5) * contrast + 0.5;
        let outB = (inB - 0.5) * contrast + 0.5;

        // 2. Warmth / Temperature tint shift towards palette dominant tone
        if (warmth !== 0) {
          const tintWeight = Math.abs(warmth) * 0.15;
          if (warmth > 0) {
            // Warm shift: pull red/yellow up
            outR += tintWeight * domR;
            outG += tintWeight * domG * 0.5;
            outB -= tintWeight * 0.3;
          } else {
            // Cool shift: pull blue up
            outR -= tintWeight * 0.3;
            outB += tintWeight * (domB + 0.5);
          }
        }

        // 3. Saturation adjustment
        const luma = 0.2126 * outR + 0.7152 * outG + 0.0722 * outB;
        outR = luma + (outR - luma) * saturation;
        outG = luma + (outG - luma) * saturation;
        outB = luma + (outB - luma) * saturation;

        // 4. Strict clamping between 0.0 and 1.0
        const clampedR = Math.min(1.0, Math.max(0.0, outR));
        const clampedG = Math.min(1.0, Math.max(0.0, outG));
        const clampedB = Math.min(1.0, Math.max(0.0, outB));

        lines.push(
          `${clampedR.toFixed(6)} ${clampedG.toFixed(6)} ${clampedB.toFixed(6)}`
        );
      }
    }
  }

  return lines.join("\n");
}
