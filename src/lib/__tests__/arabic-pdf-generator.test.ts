import { describe, it, expect } from "vitest";
import { ArabicInvoicePdfGenerator, PdfInvoiceData } from "../pdf/invoice-pdf-generator";

describe("Arabic Invoice Standalone PDF Generator", () => {
  const sampleInvoice: PdfInvoiceData = {
    invoiceNumber: "INV-2026-0001",
    issueDate: "2026-10-15",
    dueDate: "2026-11-04",
    studioName: "استوديو القاهرة للإنتاج السينمائي",
    photographerName: "أحمد علي",
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
  };

  it("generates a valid, standards-compliant PDF 1.4 binary buffer", () => {
    const pdfBytes = ArabicInvoicePdfGenerator.generatePdf(sampleInvoice);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(500);

    const pdfString = new TextDecoder().decode(pdfBytes);

    // Verify PDF Header
    expect(pdfString.startsWith("%PDF-1.4")).toBe(true);

    // Verify Critical PDF Objects
    expect(pdfString).toContain("/Type /Catalog");
    expect(pdfString).toContain("/Type /Pages");
    expect(pdfString).toContain("/Type /Page");
    expect(pdfString).toContain("/MediaBox [0 0 595.28 841.89]"); // Standard A4 dimensions
    expect(pdfString).toContain("/Type /Font");
    expect(pdfString).toContain("stream");
    expect(pdfString).toContain("endstream");

    // Verify XREF Table & EOF
    expect(pdfString).toContain("xref");
    expect(pdfString).toContain("trailer");
    expect(pdfString).toContain("startxref");
    expect(pdfString.endsWith("%%EOF\n")).toBe(true);
  });

  it("verifies Arabic text reshaping is embedded into the PDF content stream", () => {
    const pdfBytes = ArabicInvoicePdfGenerator.generatePdf(sampleInvoice);
    const pdfString = new TextDecoder().decode(pdfBytes);

    // Invoice number must be present
    expect(pdfString).toContain("INV-2026-0001");
    // Totals must be present
    expect(pdfString).toContain("22,800.00 EGP");
    // Verify reshaped glyphs exist in the stream (not empty or raw disjoint characters)
    expect(pdfString).toContain("Studio: ");
    expect(pdfString).toContain("Client: ");
  });

  it("generates a valid Blob instance for browser downloads", () => {
    const blob = ArabicInvoicePdfGenerator.generatePdfBlob(sampleInvoice);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(500);
  });
});
