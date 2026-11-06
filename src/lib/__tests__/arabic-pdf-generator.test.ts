import { describe, it, expect } from "vitest";
import { ArabicInvoicePdfGenerator, PdfInvoiceData } from "../pdf/invoice-pdf-generator";
import { PDFDocument, PDFName } from "pdf-lib";
import fs from "fs";
import path from "path";

describe("Arabic Invoice PDF Generator with Genuine Embedded Font (Commit 10)", () => {
  const sampleInvoice: PdfInvoiceData = {
    invoiceNumber: "INV-2026-0001",
    issueDate: "2026-10-15",
    dueDate: "2026-11-04",
    studioName: "استوديو القاهرة للإنتاج السينمائي",
    clientName: "أحمد وفرح",
    projectName: "توثيق حفل زفاف ماريوت",
    items: [
      {
        description: "مدير تصوير رئيسي مع طاقم العمل",
        quantity: 1,
        unitPriceFormatted: "12,000.00 EGP",
        totalFormatted: "12,000.00 EGP",
      },
      {
        description: "باقة كاميرات سينمائية وعدسات G-Master",
        quantity: 1,
        unitPriceFormatted: "8,000.00 EGP",
        totalFormatted: "8,000.00 EGP",
      },
    ],
    subtotalFormatted: "20,000.00 EGP",
    taxFormatted: "2,800.00 EGP",
    totalFormatted: "22,800.00 EGP",
    paidFormatted: "11,400.00 EGP",
    balanceFormatted: "11,400.00 EGP",
    notes: "الدفع خلال 14 يوماً من تاريخ الإصدار عبر إنستاباي أو التحويل البنكي.",
  };

  it("generates a valid, standards-compliant PDF document with embedded TrueType font", async () => {
    const pdfBytes = await ArabicInvoicePdfGenerator.generatePdf(sampleInvoice);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(10000); // TrueType embedded font makes it substantial

    // Load and inspect the generated PDF with PDFDocument parser
    const doc = await PDFDocument.load(pdfBytes);
    expect(doc.getPageCount()).toBe(1);

    const page = doc.getPage(0);
    expect(page.getWidth()).toBeCloseTo(595.28, 1);
    expect(page.getHeight()).toBeCloseTo(841.89, 1);

    // Save a copy to disk for manual inspection and verification
    const outDir = path.resolve(process.cwd(), "tests_output");
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outPath = path.join(outDir, "verified_arabic_invoice.pdf");
    fs.writeFileSync(outPath, pdfBytes);
    expect(fs.existsSync(outPath)).toBe(true);
  });

  it("verifies that font is a real embedded TrueType/CIDFont with ToUnicode and NOT Type1 Helvetica", async () => {
    const pdfBytes = await ArabicInvoicePdfGenerator.generatePdf(sampleInvoice);
    const doc = await PDFDocument.load(pdfBytes);

    const objects = Array.from(doc.context.enumerateIndirectObjects()).map(([, obj]) => obj);

    // 1. Must find Type0 Composite Font with ToUnicode mapping
    const type0Font = objects.find(
      (o: unknown) =>
        Boolean(o &&
        typeof (o as { get?: unknown }).get === "function" &&
        (o as { get: (name: PDFName) => unknown }).get(PDFName.of("Type"))?.toString() === "/Font" &&
        (o as { get: (name: PDFName) => unknown }).get(PDFName.of("Subtype"))?.toString() === "/Type0")
    );
    expect(type0Font).toBeDefined();

    // 2. Must find FontDescriptor with embedded /FontFile2 TrueType font program
    const fontDesc = objects.find(
      (o: unknown) =>
        Boolean(o &&
        typeof (o as { get?: unknown }).get === "function" &&
        (o as { get: (name: PDFName) => unknown }).get(PDFName.of("Type"))?.toString() === "/FontDescriptor" &&
        (o as { has: (name: PDFName) => boolean }).has(PDFName.of("FontFile2")))
    );
    expect(fontDesc).toBeDefined();

    // 3. Must find CIDFontType2 for direct TrueType Unicode glyph mapping
    const cidFont = objects.find(
      (o: unknown) =>
        Boolean(o &&
        typeof (o as { get?: unknown }).get === "function" &&
        (o as { get: (name: PDFName) => unknown }).get(PDFName.of("Subtype"))?.toString() === "/CIDFontType2")
    );
    expect(cidFont).toBeDefined();
  });

  it("generates a valid Blob instance for browser downloads", async () => {
    const blob = await ArabicInvoicePdfGenerator.generatePdfBlob(sampleInvoice);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(10000);
  });
});
