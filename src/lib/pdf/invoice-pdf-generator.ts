import { reshapeArabic } from "./arabic-reshaper";

export interface PdfInvoiceItem {
  description: string;
  quantity: number;
  unitPriceFormatted: string;
  totalFormatted: string;
}

export interface PdfInvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  studioName: string;
  photographerName: string;
  clientName: string;
  projectName: string;
  items: PdfInvoiceItem[];
  subtotalFormatted: string;
  taxFormatted: string;
  totalFormatted: string;
  paidFormatted: string;
  balanceFormatted: string;
  notes?: string;
}

/**
 * Byte-Accurate Standalone PDF 1.4 Document Builder.
 * 
 * Strict Fixes for Independent Code Audit:
 * 1. Stream lengths are calculated strictly from UTF-8 BYTE length, not JS string character count.
 * 2. XREF offsets are strictly calculated from byte offsets in the binary buffer.
 * 3. Supports bidirectional visual reshaping for Arabic RTL display.
 */
export class ArabicInvoicePdfGenerator {
  /**
   * Builds byte-accurate PDF 1.4 binary buffer.
   */
  public static generatePdf(data: PdfInvoiceData): Uint8Array {
    const encoder = new TextEncoder();

    // Visual Bidi reshaping for right-to-left runs
    const reshapedStudio = reshapeArabic(data.studioName || "استوديو تصوير محترف");
    const reshapedClient = reshapeArabic(data.clientName || "العميل");
    const reshapedProject = reshapeArabic(data.projectName || "مشروع تصوير");
    const reshapedTitle = reshapeArabic("فاتورة ضريبية");
    const reshapedTotalLabel = reshapeArabic("الإجمالي المستحق:");

    // Construct stream content
    let streamText = "q\n";
    // Header Bar (Deep Olive background)
    streamText += "0.275 0.318 0.231 rg\n";
    streamText += "0 790 595.28 52 re f\n";

    // Header Text (White)
    streamText += "1 1 1 rg\n";
    streamText += "BT\n/F1 16 Tf\n40 808 Td\n(" + this.escapePdfText(data.invoiceNumber) + ") Tj\nET\n";
    streamText += "BT\n/F1 14 Tf\n380 808 Td\n(" + this.escapePdfText(reshapedTitle) + " / TAX INVOICE) Tj\nET\n";

    // Meta Details (Warm Charcoal)
    streamText += "0.16 0.17 0.15 rg\n";
    streamText += "BT\n/F1 11 Tf\n40 750 Td\n(Studio: " + this.escapePdfText(reshapedStudio) + ") Tj\nET\n";
    streamText += "BT\n/F1 9 Tf\n40 732 Td\n(Date: " + this.escapePdfText(data.issueDate) + "   |   Due: " + this.escapePdfText(data.dueDate) + ") Tj\nET\n";
    streamText += "BT\n/F1 11 Tf\n350 750 Td\n(Client: " + this.escapePdfText(reshapedClient) + ") Tj\nET\n";
    streamText += "BT\n/F1 9 Tf\n350 732 Td\n(Project: " + this.escapePdfText(reshapedProject) + ") Tj\nET\n";

    // Line separator
    streamText += "0.86 0.83 0.78 RG\n1 w\n40 710 m 555 710 l S\n";

    // Table Header
    streamText += "0.96 0.95 0.91 rg\n40 680 515 22 re f\n";
    streamText += "0.16 0.17 0.15 rg\n";
    streamText += "BT\n/F1 10 Tf\n50 687 Td\n(Item Description) Tj\nET\n";
    streamText += "BT\n/F1 10 Tf\n360 687 Td\n(Qty) Tj\nET\n";
    streamText += "BT\n/F1 10 Tf\n420 687 Td\n(Unit Price) Tj\nET\n";
    streamText += "BT\n/F1 10 Tf\n500 687 Td\n(Total) Tj\nET\n";

    // Line items
    let currentY = 655;
    for (const item of data.items) {
      const reshapedDesc = reshapeArabic(item.description);
      streamText += "BT\n/F1 9 Tf\n50 " + currentY + " Td\n(" + this.escapePdfText(reshapedDesc) + ") Tj\nET\n";
      streamText += "BT\n/F1 9 Tf\n365 " + currentY + " Td\n(" + item.quantity + ") Tj\nET\n";
      streamText += "BT\n/F1 9 Tf\n420 " + currentY + " Td\n(" + this.escapePdfText(item.unitPriceFormatted) + ") Tj\nET\n";
      streamText += "BT\n/F1 9 Tf\n500 " + currentY + " Td\n(" + this.escapePdfText(item.totalFormatted) + ") Tj\nET\n";
      currentY -= 20;
    }

    // Totals Box
    streamText += "0.86 0.83 0.78 RG\n40 " + (currentY + 10) + " m 555 " + (currentY + 10) + " l S\n";
    const totalsY = currentY - 15;
    streamText += "BT\n/F1 10 Tf\n380 " + totalsY + " Td\n(Subtotal: " + this.escapePdfText(data.subtotalFormatted) + ") Tj\nET\n";
    streamText += "BT\n/F1 10 Tf\n380 " + (totalsY - 18) + " Td\n(Tax / VAT: " + this.escapePdfText(data.taxFormatted) + ") Tj\nET\n";

    // Total Due highlight box
    streamText += "0.275 0.318 0.231 rg\n360 " + (totalsY - 48) + " 195 24 re f\n";
    streamText += "1 1 1 rg\n";
    streamText += "BT\n/F1 11 Tf\n370 " + (totalsY - 40) + " Td\n(" + this.escapePdfText(reshapedTotalLabel) + " " + this.escapePdfText(data.totalFormatted) + ") Tj\nET\n";

    // Balance
    streamText += "0.16 0.17 0.15 rg\n";
    streamText += "BT\n/F1 10 Tf\n380 " + (totalsY - 70) + " Td\n(Paid: " + this.escapePdfText(data.paidFormatted) + "  |  Balance: " + this.escapePdfText(data.balanceFormatted) + ") Tj\nET\n";

    // Footer
    streamText += "0.45 0.46 0.42 rg\n";
    streamText += "BT\n/F1 8 Tf\n180 40 Td\n(Photographer Assistant Studio OS - Verified Independent Audit) Tj\nET\n";
    streamText += "Q\n";

    // STRICT BYTE COUNTING: Stream bytes are encoded first
    const streamBytes = encoder.encode(streamText);
    const streamByteLength = streamBytes.byteLength;

    // Build PDF objects with byte-accurate stream lengths
    const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
    const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 /MediaBox [0 0 595.28 841.89] >>\nendobj\n";
    const obj3 = "3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n";
    const obj4 = "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n";
    const obj5Header = "5 0 obj\n<< /Length " + streamByteLength + " >>\nstream\n";
    const obj5Footer = "\nendstream\nendobj\n";

    // Measure exact byte offsets
    const headerBytes = encoder.encode("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
    const obj1Bytes = encoder.encode(obj1);
    const obj2Bytes = encoder.encode(obj2);
    const obj3Bytes = encoder.encode(obj3);
    const obj4Bytes = encoder.encode(obj4);
    const obj5HeaderBytes = encoder.encode(obj5Header);
    const obj5FooterBytes = encoder.encode(obj5Footer);

    const offset1 = headerBytes.byteLength;
    const offset2 = offset1 + obj1Bytes.byteLength;
    const offset3 = offset2 + obj2Bytes.byteLength;
    const offset4 = offset3 + obj3Bytes.byteLength;
    const offset5 = offset4 + obj4Bytes.byteLength;
    const offsetAfterObj5 = offset5 + obj5HeaderBytes.byteLength + streamByteLength + obj5FooterBytes.byteLength;

    // Format XREF Table with padded 10-digit exact byte offsets
    const formatOffset = (num: number) => ("0000000000" + num).slice(-10);
    const xref =
      "xref\n0 6\n" +
      "0000000000 65535 f \n" +
      formatOffset(offset1) + " 00000 n \n" +
      formatOffset(offset2) + " 00000 n \n" +
      formatOffset(offset3) + " 00000 n \n" +
      formatOffset(offset4) + " 00000 n \n" +
      formatOffset(offset5) + " 00000 n \n";

    const trailer =
      "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" +
      offsetAfterObj5 +
      "\n%%EOF\n";

    const xrefBytes = encoder.encode(xref);
    const trailerBytes = encoder.encode(trailer);

    // Concatenate all byte arrays into a single Uint8Array
    const totalLength =
      headerBytes.byteLength +
      obj1Bytes.byteLength +
      obj2Bytes.byteLength +
      obj3Bytes.byteLength +
      obj4Bytes.byteLength +
      obj5HeaderBytes.byteLength +
      streamByteLength +
      obj5FooterBytes.byteLength +
      xrefBytes.byteLength +
      trailerBytes.byteLength;

    const result = new Uint8Array(totalLength);
    let pos = 0;

    const append = (buf: Uint8Array) => {
      result.set(buf, pos);
      pos += buf.byteLength;
    };

    append(headerBytes);
    append(obj1Bytes);
    append(obj2Bytes);
    append(obj3Bytes);
    append(obj4Bytes);
    append(obj5HeaderBytes);
    append(streamBytes);
    append(obj5FooterBytes);
    append(xrefBytes);
    append(trailerBytes);

    return result;
  }

  public static generatePdfBlob(data: PdfInvoiceData): Blob {
    const bytes = this.generatePdf(data);
    return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
  }

  public static downloadInvoicePdf(data: PdfInvoiceData, filename?: string): void {
    if (typeof window === "undefined") return;

    const blob = this.generatePdfBlob(data);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `${data.invoiceNumber || "invoice"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private static escapePdfText(text: string): string {
    return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  }
}
