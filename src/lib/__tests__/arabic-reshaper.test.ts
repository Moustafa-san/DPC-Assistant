import { describe, it, expect } from "vitest";
import { reshapeArabic, reverseForVisualLTR } from "../pdf/arabic-reshaper";

describe("Arabic Text Reshaping for PDF Spike", () => {
  it("reshapes Arabic letters into connected presentation forms", () => {
    // "فواتير" (Invoices)
    const raw = "فواتير";
    const shaped = reshapeArabic(raw);

    expect(shaped).not.toBe(raw);
    expect(shaped.length).toBe(raw.length);

    // Initial 'Feh' (ف) should convert to U+FED3 (Initial form)
    expect(shaped.charCodeAt(0)).toBe(0xfed3);
  });

  it("handles isolated and non-connecting letters correctly", () => {
    // "ورد" (Flowers): Waw, Reh, Dal are all non-connecting after
    const raw = "ورد";
    const shaped = reshapeArabic(raw);

    // Waw isolated
    expect(shaped.charCodeAt(0)).toBe(0xfeed);
    // Reh isolated (because Waw does not connect after)
    expect(shaped.charCodeAt(1)).toBe(0xfead);
    // Dal isolated (because Reh does not connect after)
    expect(shaped.charCodeAt(2)).toBe(0xfea9);
  });

  it("reverses shaped text for engines requiring visual LTR runs", () => {
    const raw = "مساعد";
    const shaped = reshapeArabic(raw);
    const visual = reverseForVisualLTR(shaped);

    expect(visual.charAt(0)).toBe(shaped.charAt(shaped.length - 1));
  });
});
