import {
  StorageCalculationInput,
  StorageCalculationResult,
} from "../schemas/storage";

/**
 * Calculates raw video storage in decimal Gigabytes (GB = 1,000 MB).
 * Formula: (hours * 3600 * bitrateMbps) / (8 * 1000)
 */
export function calculateVideoStorageGb(hours: number, bitrateMbps: number): number {
  if (hours <= 0 || bitrateMbps <= 0) return 0;
  const totalMegabytes = (hours * 3600 * bitrateMbps) / 8;
  return Math.round((totalMegabytes / 1000) * 10) / 10;
}

/**
 * Calculates raw photo storage in decimal Gigabytes (GB = 1,000 MB).
 * Formula: (photoCount * averageSizeMB) / 1000
 */
export function calculatePhotoStorageGb(photoCount: number, averageSizeMB: number): number {
  if (photoCount <= 0 || averageSizeMB <= 0) return 0;
  const totalMegabytes = photoCount * averageSizeMB;
  return Math.round((totalMegabytes / 1000) * 10) / 10;
}

/**
 * Calculates comprehensive storage requirements including safety redundancy margins
 * and memory card distribution recommendations.
 */
export function calculateStorage(input: StorageCalculationInput): StorageCalculationResult {
  const {
    videoHours,
    videoBitrateMbps,
    photoCount,
    photoAverageSizeMB,
    safetyMarginPercentage,
    cameraCount,
  } = input;

  const singleCamVideoGb = calculateVideoStorageGb(videoHours, videoBitrateMbps);
  const totalVideoGb = singleCamVideoGb * cameraCount;
  const totalPhotoGb = calculatePhotoStorageGb(photoCount, photoAverageSizeMB);

  const baseStorageGb = Math.round((totalVideoGb + totalPhotoGb) * 10) / 10;
  const marginFactor = 1 + safetyMarginPercentage / 100;
  const totalRequiredStorageGb = Math.round(baseStorageGb * marginFactor * 10) / 10;
  const safetyMarginGb = Math.round((totalRequiredStorageGb - baseStorageGb) * 10) / 10;

  // Calculate card distribution recommendations (512GB, 256GB, 128GB)
  let remainingGb = totalRequiredStorageGb;
  let cards512Gb = 0;
  let cards256Gb = 0;
  let cards128Gb = 0;

  if (remainingGb >= 400) {
    cards512Gb = Math.floor(remainingGb / 512);
    remainingGb = remainingGb % 512;
  }
  if (remainingGb >= 200) {
    cards256Gb = Math.floor(remainingGb / 256);
    remainingGb = remainingGb % 256;
  }
  if (remainingGb > 0) {
    cards128Gb = Math.ceil(remainingGb / 128);
  }

  const totalKitCapacityGb = cards512Gb * 512 + cards256Gb * 256 + cards128Gb * 128;

  return {
    videoStorageGb: totalVideoGb,
    photoStorageGb: totalPhotoGb,
    baseStorageGb,
    safetyMarginGb,
    totalRequiredStorageGb,
    cameraCount,
    recommendedCards: {
      cards512Gb,
      cards256Gb,
      cards128Gb,
      totalKitCapacityGb,
    },
  };
}
