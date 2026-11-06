import { z } from "zod";

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "صيغة اللون غير صحيحة (يجب أن تكون #RRGGBB)");

export const colorPaletteSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "اسم لوحة الألوان مطلوب"),
  mood: z.string().min(1),
  dominantColor: hexColorSchema,   // 60%
  secondaryColor: hexColorSchema,  // 30%
  accentColor: hexColorSchema,     // 10%
  notes: z.string().optional(),
});

export const lutGenerationOptionsSchema = z.object({
  title: z.string().min(1),
  size: z.union([z.literal(9), z.literal(17), z.literal(33)]).default(17),
  contrast: z.number().min(0.5).max(2.0).default(1.0),
  saturation: z.number().min(0.0).max(2.0).default(1.0),
  warmth: z.number().min(-1.0).max(1.0).default(0.0), // Warm vs Cool shift
});

export type ColorPalette = z.infer<typeof colorPaletteSchema>;
export type LutGenerationOptions = z.infer<typeof lutGenerationOptionsSchema>;

export interface ColorHarmonyAnalysis {
  isHarmony60_30_10Valid: boolean;
  dominantRgb: [number, number, number];
  secondaryRgb: [number, number, number];
  accentRgb: [number, number, number];
  luminance: {
    dominant: number;
    secondary: number;
    accent: number;
  };
}
