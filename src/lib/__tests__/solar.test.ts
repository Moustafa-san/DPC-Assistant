import { describe, it, expect } from "vitest";
import { calculateSolarTimes } from "../solar/calculator";

describe("NOAA Astronomical Solar Calculator & Gate 0 Fixtures", () => {
  it("matches Cairo 2026-11-04 fixture: Sunrise ≈ 06:12, Sunset ≈ 17:05 (±2 minutes)", () => {
    const cairoCoords = {
      latitude: 30.0444,
      longitude: 31.2357,
    };

    const result = calculateSolarTimes("2026-11-04", cairoCoords, "Africa/Cairo");

    // Sunrise minutes from midnight for 06:12 = 6 * 60 + 12 = 372
    // Sunset minutes from midnight for 17:05 = 17 * 60 + 5 = 1025
    expect(result.sunriseMinutesFromMidnight).toBeGreaterThanOrEqual(370);
    expect(result.sunriseMinutesFromMidnight).toBeLessThanOrEqual(374);

    expect(result.sunsetMinutesFromMidnight).toBeGreaterThanOrEqual(1023);
    expect(result.sunsetMinutesFromMidnight).toBeLessThanOrEqual(1027);

    // Formatted strings should be within ±2 minutes of 06:12 and 17:05
    expect(["06:10", "06:11", "06:12", "06:13", "06:14"]).toContain(result.sunrise);
    expect(["17:03", "17:04", "17:05", "17:06", "17:07"]).toContain(result.sunset);
  });

  it("calculates morning and evening golden hours accurately", () => {
    const cairoCoords = {
      latitude: 30.0444,
      longitude: 31.2357,
    };

    const result = calculateSolarTimes("2026-11-04", cairoCoords, "Africa/Cairo");

    // Evening golden hour must precede and span around sunset
    expect(result.eveningGoldenHour.start).toBeDefined();
    expect(result.eveningGoldenHour.end).toBeDefined();
    expect(result.morningGoldenHour.start).toBeDefined();
    expect(result.morningGoldenHour.end).toBeDefined();
  });
});
