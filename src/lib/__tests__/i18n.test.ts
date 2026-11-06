import { describe, it, expect } from "vitest";
import { arDictionary } from "../i18n/dictionaries/ar";
import { enDictionary } from "../i18n/dictionaries/en";

function getDeepKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.keys(obj).reduce((res: string[], el: string) => {
    const val = obj[el];
    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      return [...res, ...getDeepKeys(val as Record<string, unknown>, prefix + el + ".")];
    }
    return [...res, prefix + el];
  }, []);
}

describe("i18n Dictionary Parity", () => {
  it("ensures that Arabic and English dictionaries have identical translation keys", () => {
    const arKeys = getDeepKeys(arDictionary as unknown as Record<string, unknown>).sort();
    const enKeys = getDeepKeys(enDictionary as unknown as Record<string, unknown>).sort();

    expect(arKeys).toEqual(enKeys);
  });

  it("ensures no translation value is empty", () => {
    const checkNoEmptyValues = (obj: Record<string, unknown>) => {
      for (const [key, val] of Object.entries(obj)) {
        if (typeof val === "string") {
          expect(val.trim().length, `Key "${key}" should not be empty`).toBeGreaterThan(0);
        } else if (typeof val === "object" && val !== null) {
          checkNoEmptyValues(val as Record<string, unknown>);
        }
      }
    };

    checkNoEmptyValues(arDictionary as unknown as Record<string, unknown>);
    checkNoEmptyValues(enDictionary as unknown as Record<string, unknown>);
  });
});
