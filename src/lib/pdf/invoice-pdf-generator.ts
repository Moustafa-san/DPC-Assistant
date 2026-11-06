import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { reshapeArabic } from "./arabic-reshaper";
import { loadArabicFontBuffer } from "./font-loader";

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
  photographerName?: string;
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
 * Enterprise Arabic & Bidi PDF Invoice Generator.
 * Built with pdf-lib & @pdf-lib/fontkit, embedding genuine TrueType Arabic typography (Tahoma).
 * Adheres to:
 * 1. True OpenType/TrueType Arabic font embedding (CIDFontType2 with ToUnicode CMap).
 * 2. Visual glyph shaping and RTL reordering via reshapeArabic.
 * 3. Exact standard PDF 1.7 binary compliance renderable in Acrobat, Preview, Chrome, and Mobile viewers.
 */
export class ArabicInvoicePdfGenerator {
  /**
   * Generates a fully embedded TrueType Arabic PDF document.
   */
  public static async generatePdf(data: PdfInvoiceData, customFontBuffer?: Uint8Array): Promise<Uint8Array> {
    const fontBytes = customFontBuffer || (await loadArabicFontBuffer());

    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);

    // Embed the TrueType font with full Arabic Unicode support
    const arabicFont = await doc.embedFont(fontBytes, { subset: false });

    // Standard A4 dimensions in points (595.28 x 841.89)
    const page = doc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    // Palette Colors (Deep Olive, Warm Charcoal, Cream Neutral)
    const oliveColor = rgb(0.275, 0.318, 0.231);
    const charcoalColor = rgb(0.16, 0.17, 0.15);
    const lightBgColor = rgb(0.96, 0.95, 0.91);
    const borderGray = rgb(0.86, 0.83, 0.78);
    const whiteColor = rgb(1, 1, 1);

    // 1. Header Banner
    page.drawRectangle({
      x: 0,
      y: height - 52,
      width: width,
      height: 52,
      color: oliveColor,
    });

    // Invoice Number (Left)
    page.drawText(data.invoiceNumber || "INV-0001", {
      x: 40,
      y: height - 34,
      size: 16,
      font: arabicFont,
      color: whiteColor,
    });

    // Tax Invoice Title (Right / Arabic Reshaped)
    const titleText = reshapeArabic("فاتورة ضريبية") + " / TAX INVOICE";
    page.drawText(titleText, {
      x: 340,
      y: height - 34,
      size: 14,
      font: arabicFont,
      color: whiteColor,
    });

    // 2. Studio & Client Meta Information
    const studioText = reshapeArabic("الاستوديو: " + (data.studioName || "استوديو تصوير"));
    const clientText = reshapeArabic("العميل: " + (data.clientName || "عميل كريم"));
    const projectText = reshapeArabic("المشروع: " + (data.projectName || "مشروع تصوير"));
    const dateText = `Date: ${data.issueDate}   |   Due: ${data.dueDate}`;

    page.drawText(studioText, {
      x: 40,
      y: height - 90,
      size: 11,
      font: arabicFont,
      color: charcoalColor,
    });

    page.drawText(dateText, {
      x: 40,
      y: height - 108,
      size: 9,
      font: arabicFont,
      color: charcoalColor,
    });

    page.drawText(clientText, {
      x: 320,
      y: height - 90,
      size: 11,
      font: arabicFont,
      color: charcoalColor,
    });

    page.drawText(projectText, {
      x: 320,
      y: height - 108,
      size: 9,
      font: arabicFont,
      color: charcoalColor,
    });

    // Separator line
    page.drawLine({
      start: { x: 40, y: height - 125 },
      end: { x: width - 40, y: height - 125 },
      thickness: 1,
      color: borderGray,
    });

    // 3. Items Table Header
    const tableTop = height - 155;
    page.drawRectangle({
      x: 40,
      y: tableTop,
      width: width - 80,
      height: 24,
      color: lightBgColor,
    });

    page.drawText(reshapeArabic("بيان الخدمة / البند"), {
      x: 50,
      y: tableTop + 7,
      size: 10,
      font: arabicFont,
      color: charcoalColor,
    });

    page.drawText(reshapeArabic("الكمية"), {
      x: 340,
      y: tableTop + 7,
      size: 10,
      font: arabicFont,
      color: charcoalColor,
    });

    page.drawText(reshapeArabic("السعر"), {
      x: 410,
      y: tableTop + 7,
      size: 10,
      font: arabicFont,
      color: charcoalColor,
    });

    page.drawText(reshapeArabic("الإجمالي"), {
      x: 490,
      y: tableTop + 7,
      size: 10,
      font: arabicFont,
      color: charcoalColor,
    });

    // 4. Line Items
    let currentY = tableTop - 22;
    for (const item of data.items) {
      const descReshaped = reshapeArabic(item.description);
      page.drawText(descReshaped, {
        x: 50,
        y: currentY,
        size: 9,
        font: arabicFont,
        color: charcoalColor,
      });

      page.drawText(String(item.quantity), {
        x: 350,
        y: currentY,
        size: 9,
        font: arabicFont,
        color: charcoalColor,
      });

      page.drawText(item.unitPriceFormatted, {
        x: 410,
        y: currentY,
        size: 9,
        font: arabicFont,
        color: charcoalColor,
      });

      page.drawText(item.totalFormatted, {
        x: 490,
        y: currentY,
        size: 9,
        font: arabicFont,
        color: charcoalColor,
      });

      currentY -= 20;
    }

    // 5. Totals Box
    currentY -= 10;
    page.drawLine({
      start: { x: 40, y: currentY + 15 },
      end: { x: width - 40, y: currentY + 15 },
      thickness: 1,
      color: borderGray,
    });

    const subtotalLabel = reshapeArabic("المجموع الفرعي:") + " " + data.subtotalFormatted;
    const taxLabel = reshapeArabic("ضريبة القيمة المضافة:") + " " + data.taxFormatted;
    const totalLabel = reshapeArabic("الإجمالي الكلي:") + " " + data.totalFormatted;
    const paidLabel = reshapeArabic("المبلغ المسدد:") + " " + data.paidFormatted;
    const balanceLabel = reshapeArabic("المتبقي للدفع:") + " " + data.balanceFormatted;

    page.drawText(subtotalLabel, {
      x: 340,
      y: currentY,
      size: 9,
      font: arabicFont,
      color: charcoalColor,
    });

    currentY -= 16;
    page.drawText(taxLabel, {
      x: 340,
      y: currentY,
      size: 9,
      font: arabicFont,
      color: charcoalColor,
    });

    currentY -= 18;
    page.drawText(totalLabel, {
      x: 340,
      y: currentY,
      size: 11,
      font: arabicFont,
      color: oliveColor,
    });

    currentY -= 16;
    page.drawText(paidLabel, {
      x: 340,
      y: currentY,
      size: 9,
      font: arabicFont,
      color: charcoalColor,
    });

    currentY -= 16;
    page.drawText(balanceLabel, {
      x: 340,
      y: currentY,
      size: 10,
      font: arabicFont,
      color: rgb(0.8, 0.1, 0.1),
    });

    // 6. Notes / Footer
    if (data.notes) {
      currentY -= 30;
      page.drawText(reshapeArabic("ملاحظات وشروط الدفع:"), {
        x: 40,
        y: currentY,
        size: 9,
        font: arabicFont,
        color: charcoalColor,
      });

      page.drawText(reshapeArabic(data.notes), {
        x: 40,
        y: currentY - 14,
        size: 8,
        font: arabicFont,
        color: rgb(0.4, 0.4, 0.4),
      });
    }

    return await doc.save();
  }

  /**
   * Generates a Blob instance for browser downloads.
   */
  public static async generatePdfBlob(data: PdfInvoiceData, customFontBuffer?: Uint8Array): Promise<Blob> {
    const bytes = await this.generatePdf(data, customFontBuffer);
    return new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
  }

  /**
   * Browser convenience utility to generate and trigger instant PDF download.
   */
  public static async downloadInvoicePdf(data: PdfInvoiceData, filename?: string): Promise<void> {
    const bytes = await this.generatePdf(data);
    if (typeof window === "undefined") return;

    const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `${data.invoiceNumber || "invoice"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
