import { z } from "zod";

export const videoPresetSchema = z.enum([
  "4k_h265_50mbps",    // Standard H.265 / HEVC 4K
  "4k_h264_100mbps",   // Standard H.264 4K
  "4k_prores_422",     // High-end ProRes 422 4K (~500 Mbps)
  "1080p_h264_25mbps", // Full HD 1080p
  "custom",
]);

export const photoPresetSchema = z.enum([
  "raw_compressed_45mp", // 55 MB / photo
  "raw_uncompressed_45mp", // 90 MB / photo
  "raw_24mp",            // 30 MB / photo
  "jpeg_high",           // 12 MB / photo
  "custom",
]);

export const storageCalculationInputSchema = z.object({
  videoHours: z.number().min(0).default(0),
  videoBitrateMbps: z.number().positive().default(50),
  photoCount: z.number().int().min(0).default(0),
  photoAverageSizeMB: z.number().positive().default(55),
  safetyMarginPercentage: z.number().min(0).max(100).default(15),
  cameraCount: z.number().int().positive().default(1),
});

export type VideoPreset = z.infer<typeof videoPresetSchema>;
export type PhotoPreset = z.infer<typeof photoPresetSchema>;
export type StorageCalculationInput = z.infer<typeof storageCalculationInputSchema>;

export interface CardDistributionRecommendation {
  sizeGb: number;
  quantity: number;
  totalCapacityGb: number;
}

export interface StorageCalculationResult {
  videoStorageGb: number;
  photoStorageGb: number;
  baseStorageGb: number;
  safetyMarginGb: number;
  totalRequiredStorageGb: number;
  cameraCount: number;
  recommendedCards: {
    cards512Gb: number;
    cards256Gb: number;
    cards128Gb: number;
    totalKitCapacityGb: number;
  };
}
