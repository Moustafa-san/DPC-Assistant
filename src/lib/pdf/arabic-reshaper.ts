/**
 * Arabic Text Reshaper & Bidi Normalizer for PDF Generation Spike.
 * 
 * Maps Arabic characters to their contextual presentation forms (Isolated, Initial, Medial, Final)
 * based on Unicode Presentation Forms-B, enabling correct rendering in PDF engines
 * that lack complex text layout (CTL) and Harfbuzz shaping.
 */

// Arabic letter character mapping to presentation forms [Isolated, Final, Initial, Medial]
const ARABIC_FORMS: Record<number, [number, number, number, number]> = {
  // Hamza & Alef variants
  0x0621: [0xfe80, 0xfe80, 0xfe80, 0xfe80], // ء
  0x0622: [0xfe81, 0xfe82, 0xfe81, 0xfe82], // آ
  0x0623: [0xfe83, 0xfe84, 0xfe83, 0xfe84], // أ
  0x0624: [0xfe85, 0xfe86, 0xfe85, 0xfe86], // ؤ
  0x0625: [0xfe87, 0xfe88, 0xfe87, 0xfe88], // إ
  0x0626: [0xfe89, 0xfe8a, 0xfe8b, 0xfe8c], // ئ
  0x0627: [0xfe8d, 0xfe8e, 0xfe8d, 0xfe8e], // ا
  0x0628: [0xfe8f, 0xfe90, 0xfe91, 0xfe92], // ب
  0x0629: [0xfe93, 0xfe94, 0xfe93, 0xfe94], // ة
  0x062a: [0xfe95, 0xfe96, 0xfe97, 0xfe98], // ت
  0x062b: [0xfe99, 0xfe9a, 0xfe9b, 0xfe9c], // ث
  0x062c: [0xfe9d, 0xfe9e, 0xfe9f, 0xfea0], // ج
  0x062d: [0xfea1, 0xfea2, 0xfea3, 0xfea4], // ح
  0x062e: [0xfea5, 0xfea6, 0xfea7, 0xfea8], // خ
  0x062f: [0xfea9, 0xfeaa, 0xfea9, 0xfeaa], // د
  0x0630: [0xfeab, 0xfeac, 0xfeab, 0xfeac], // ذ
  0x0631: [0xfead, 0xfeae, 0xfead, 0xfeae], // ر
  0x0632: [0xfeaf, 0xfeb0, 0xfeaf, 0xfeb0], // ز
  0x0633: [0xfeb1, 0xfeb2, 0xfeb3, 0xfeb4], // س
  0x0634: [0xfeb5, 0xfeb6, 0xfeb7, 0xfeb8], // ش
  0x0635: [0xfeb9, 0xfeba, 0xfebb, 0xfebc], // ص
  0x0636: [0xfebd, 0xfebe, 0xfebf, 0xfec0], // ض
  0x0637: [0xfec1, 0xfec2, 0xfec3, 0xfec4], // ط
  0x0638: [0xfec5, 0xfec6, 0xfec7, 0xfec8], // ظ
  0x0639: [0xfec9, 0xfeca, 0xfecb, 0xfecc], // ع
  0x063a: [0xfecd, 0xfece, 0xfecf, 0xfed0], // غ
  0x0641: [0xfed1, 0xfed2, 0xfed3, 0xfed4], // ف
  0x0642: [0xfed5, 0xfed6, 0xfed7, 0xfed8], // ق
  0x0643: [0xfed9, 0xfeda, 0xfedb, 0xfedc], // ك
  0x0644: [0xfedd, 0xfede, 0xfedf, 0xfee0], // ل
  0x0645: [0xfee1, 0xfee2, 0xfee3, 0xfee4], // م
  0x0646: [0xfee5, 0xfee6, 0xfee7, 0xfee8], // ن
  0x0647: [0xfee9, 0xfeea, 0xfeeb, 0xfeec], // ه
  0x0648: [0xfeed, 0xfeee, 0xfeed, 0xfeee], // و
  0x0649: [0xfeef, 0xfef0, 0xfef1, 0xfef2], // ى
  0x064a: [0xfef1, 0xfef2, 0xfef3, 0xfef4], // ي
  0x0640: [0x0640, 0x0640, 0x0640, 0x0640], // تطويل _
};

// Characters that do not connect to subsequent letters (Right-connecting only)
const DISCONNECT_AFTER = new Set([
  0x0621, 0x0622, 0x0623, 0x0624, 0x0625, 0x0627,
  0x062f, 0x0630, 0x0631, 0x0632, 0x0648, 0x0649
]);

function connectsBefore(code: number): boolean {
  return ARABIC_FORMS[code] !== undefined && code !== 0x0621;
}

function connectsAfter(code: number): boolean {
  return ARABIC_FORMS[code] !== undefined && !DISCONNECT_AFTER.has(code);
}

/**
 * Reshapes Arabic text by substituting raw characters with their contextual glyph forms.
 */
export function reshapeArabic(text: string): string {
  const chars = Array.from(text);
  const result: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const code = chars[i].charCodeAt(0);
    const form = ARABIC_FORMS[code];

    if (!form) {
      result.push(chars[i]);
      continue;
    }

    const prevCode = i > 0 ? chars[i - 1].charCodeAt(0) : 0;
    const nextCode = i < chars.length - 1 ? chars[i + 1].charCodeAt(0) : 0;

    const hasPrev = connectsAfter(prevCode);
    const hasNext = connectsBefore(nextCode);

    if (hasPrev && hasNext) {
      result.push(String.fromCharCode(form[3])); // Medial
    } else if (hasPrev) {
      result.push(String.fromCharCode(form[1])); // Final
    } else if (hasNext) {
      result.push(String.fromCharCode(form[2])); // Initial
    } else {
      result.push(String.fromCharCode(form[0])); // Isolated
    }
  }

  return result.join("");
}

/**
 * Normalizes Bidi text order for visual rendering engines that read LTR by default.
 */
export function reverseForVisualLTR(text: string): string {
  // Simple word-level or character-level bidi reverser for shaped Arabic runs
  return Array.from(text).reverse().join("");
}
