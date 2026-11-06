import { describe, it, expect } from "vitest";
import {
  calculateVideoStorageGb,
  calculatePhotoStorageGb,
  calculateStorage,
} from "../storage-calc/calculator";

describe("Storage Calculator & Gate 0 Fixtures Verification", () => {
  it("matches Fixture 1: 8 hours of 4K H.265 at 50 Mbps = 180.0 GB", () => {
    const videoGb = calculateVideoStorageGb(8, 50);
    expect(videoGb).toBe(180.0);
  });

  it("matches Fixture 2: 1,500 compressed RAW 45MP at 55MB = 82.5 GB", () => {
    const photoGb = calculatePhotoStorageGb(1500, 55);
    expect(photoGb).toBe(82.5);
  });

  it("matches Fixture 3: Combined wedding shoot with 15% safety margin = 301.9 GB", () => {
    const result = calculateStorage({
      videoHours: 8,
      videoBitrateMbps: 50,
      photoCount: 1500,
      photoAverageSizeMB: 55,
      safetyMarginPercentage: 15,
      cameraCount: 1,
    });

    expect(result.videoStorageGb).toBe(180.0);
    expect(result.photoStorageGb).toBe(82.5);
    expect(result.baseStorageGb).toBe(262.5); // 180 + 82.5
    expect(result.totalRequiredStorageGb).toBe(301.9); // 262.5 * 1.15 = 301.875 -> 301.9
  });

  it("matches Fixture 4: Two cameras wedding coverage = 508.9 GB", () => {
    // 2 cameras recording video + photo coverage with 15% margin
    // (180.0 * 2 + 82.5) = 442.5 base -> 442.5 * 1.15 = 508.875 -> 508.9 GB
    const result = calculateStorage({
      videoHours: 8,
      videoBitrateMbps: 50,
      photoCount: 1500,
      photoAverageSizeMB: 55,
      safetyMarginPercentage: 15,
      cameraCount: 2,
    });

    expect(result.videoStorageGb).toBe(360.0); // 180 * 2
    expect(result.photoStorageGb).toBe(82.5);
    expect(result.baseStorageGb).toBe(442.5);
    expect(result.totalRequiredStorageGb).toBe(508.9); // 442.5 * 1.15 = 508.875 -> 508.9
  });

  it("handles edge cases: zero hours and zero photos", () => {
    const result = calculateStorage({
      videoHours: 0,
      videoBitrateMbps: 50,
      photoCount: 0,
      photoAverageSizeMB: 55,
      safetyMarginPercentage: 15,
      cameraCount: 1,
    });

    expect(result.totalRequiredStorageGb).toBe(0);
    expect(result.recommendedCards.totalKitCapacityGb).toBe(0);
  });
});
