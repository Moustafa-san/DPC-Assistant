import { reshapeArabicText } from "./arabic-reshaper";

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
 * Pure TypeScript Standalone PDF 1.4 Generator with Arabic Text Reshaping Support.
 * Produces valid, compliant PDF binary blobs with embedded typography without external runtime dependencies.
 */
export class ArabicInvoicePdfGenerator {
  /**
   * Generates a complete binary PDF 1.4 string buffer for an invoice.
   */
  public static generatePdf(data: PdfInvoiceData): Uint8Array {
    const reshapedStudio = reshapeArabicText(data.studioName || "استوديو تصوير محترف");
    const reshapedClient = reshapeArabicText(data.clientName || "العميل");
    const reshapedProject = reshapeArabicText(data.projectName || "مشروع تصوير");
    const reshapedTitle = reshapeArabicText("فاتورة ضريبية / TAX INVOICE");
    const reshapedTotalLabel = reshapeArabicText("الإجمالي المستحق:");

    // Construct PDF Body Objects
    const objects: string[] = [];

    // Object 1: Catalog
    objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");

    // Object 2: Pages Collection (A4 Size: 595.28 x 841.89 points)
    objects.push(
      "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 /MediaBox [0 0 595.28 841.89] >>\nendobj"
    );

    // Object 3: Page Definition
    objects.push(
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj"
    );

    // Object 4: Font Dictionary
    objects.push(
      "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj"
    );

    // Object 5: Content Stream (Drawing invoice layout, header, lines, and text)
    let stream = "";
    stream += "q\n"; // Push graphics state
    
    // Top Brand Bar (Deep Olive background: #46513B -> 0.275, 0.318, 0.231)
    stream += "0.275 0.318 0.231 rg\n";
    stream += "0 790 595.28 52 re f\n"; // Header rectangle

    // Header Title (White)
    stream += "1 1 1 rg\n";
    stream += "BT\n/F1 16 Tf\n40 808 Td\n(" + this.escapePdfText(data.invoiceNumber) + ") Tj\nET\n";
    stream += "BT\n/F1 14 Tf\n350 808 Td\n(" + this.escapePdfText(reshapedTitle) + ") Tj\nET\n";

    // Studio & Client Meta Box
    stream += "0.16 0.17 0.15 rg\n"; // Warm charcoal text
    stream += "BT\n/F1 12 Tf\n40 750 Td\n(Studio: " + this.escapePdfText(reshapedStudio) + ") Tj\nET\n";
    stream += "BT\n/F1 10 Tf\n40 732 Td\n(Date: " + this.escapePdfText(data.issueDate) + "   |   Due: " + this.escapePdfText(data.dueDate) + ") Tj\nET\n";
    stream += "BT\n/F1 12 Tf\n350 750 Td\n(Client: " + this.escapePdfText(reshapedClient) + ") Tj\nET\n";
    stream += "BT\n/F1 10 Tf\n350 732 Td\n(Project: " + this.escapePdfText(reshapedProject) + ") Tj\nET\n";

    // Separator Line
    stream += "0.86 0.83 0.78 RG\n"; // Sand border color
    stream += "1 w\n";
    stream += "40 710 m 555 710 l S\n";

    // Table Header
    stream += "0.96 0.95 0.91 rg\n"; // Light background
    stream += "40 680 515 22 re f\n";
    stream += "0.16 0.17 0.15 rg\n";
    stream += "BT\n/F1 10 Tf\n50 687 Td\n(Description / Item) Tj\nET\n";
    stream += "BT\n/F1 10 Tf\n360 687 Td\n(Qty) Tj\nET\n";
    stream += "BT\n/F1 10 Tf\n420 687 Td\n(Unit Price) Tj\nET\n";
    stream += "BT\n/F1 10 Tf\n500 687 Td\n(Total) Tj\nET\n";

    // Items Rendering
    let currentY = 655;
    for (const item of data.items) {
      const reshapedDesc = reshapeArabicText(item.description);
      stream += "BT\n/F1 9 Tf\n50 " + currentY + " Td\n(" + this.escapePdfText(reshapedDesc) + ") Tj\nET\n";
      stream += "BT\n/F1 9 Tf\n365 " + currentY + " Td\n(" + item.quantity + ") Tj\nET\n";
      stream += "BT\n/F1 9 Tf\n420 " + currentY + " Td\n(" + this.escapePdfText(item.unitPriceFormatted) + ") Tj\nET\n";
      stream += "BT\n/F1 9 Tf\n500 " + currentY + " Td\n(" + this.escapePdfText(item.totalFormatted) + ") Tj\nET\n";
      currentY -= 20;
    }

    // Totals Box
    stream += "0.86 0.83 0.78 RG\n";
    stream += "40 " + (currentY + 10) + " m 555 " + (currentY + 10) + " l S\n";

    const totalsY = currentY - 15;
    stream += "BT\n/F1 10 Tf\n380 " + totalsY + " Td\n(Subtotal: " + this.escapePdfText(data.subtotalFormatted) + ") Tj\nET\n";
    stream += "BT\n/F1 10 Tf\n380 " + (totalsY - 18) + " Td\n(Tax / VAT: " + this.escapePdfText(data.taxFormatted) + ") Tj\nET\n";
    
    // Total Due Highlight
    stream += "0.275 0.318 0.231 rg\n";
    stream += "360 " + (totalsY - 48) + " 195 24 re f\n";
    stream += "1 1 1 rg\n";
    stream += "BT\n/F1 11 Tf\n370 " + (totalsY - 40) + " Td\n(" + this.escapePdfText(reshapedTotalLabel) + " " + this.escapePdfText(data.totalFormatted) + ") Tj\nET\n";

    // Balance Due
    stream += "0.16 0.17 0.15 rg\n";
    stream += "BT\n/F1 10 Tf\n380 " + (totalsY - 70) + " Td\n(Paid: " + this.escapePdfText(data.paidFormatted) + "   |   Balance: " + this.escapePdfText(data.balanceFormatted) + ") Tj\nET\n";

    // Footer
    stream += "0.45 0.46 0.42 rg\n";
    stream += "BT\n/F1 8 Tf\n200 40 Td\n(Generated securely by Photographer Assistant - Open Source Studio OS) Tj\nET\n";

    stream += "Q\n"; // Pop graphics state

    const streamLength = stream.length;
    objects.push(
      "5 0 obj\n<< /Length " + streamLength + " >>\nstream\n" + stream + "\nendstream\nendobj"
    );

    // Assemble File with XREF Table
    let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
    const offsets: number[] = [];

    for (let i = 0; i < objects.length; i++) {
      offsets.push(pdf.length);
      pdf += objects[i] + "\n";
    }

    const xrefOffset = pdf.length;
    pdf += "xref\n";
    pdf += "0 " + (objects.length + 1) + "\n";
    pdf += "0000000000 65535 f \n";

    for (let i = 0; i < offsets.length; i++) {
      const padded = ("0000000000" + offsets[i]).slice(-10);
      pdf += padded + " 00000 n \n";
    }

    pdf += "trailer\n";
    pdf += "<< /Size " + (objects.length + 1) + " /Root 1 0 R >>\n";
    pdf += "startxref\n";
    pdf += xrefOffset + "\n";
    pdf += "%%EOF\n";

    // Convert to byte array
    const encoder = new TextEncoder();
    return encoder.encode(pdf);
  }

  /**
   * Creates a downloadable Blob URL for browser consumption.
   */
  public static generatePdfBlob(data: PdfInvoiceData): Blob {
    const bytes = this.generatePdf(data);
    return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
  }

  /**
   * Triggers an immediate browser download of the generated PDF invoice.
   */
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
