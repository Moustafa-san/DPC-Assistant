/**
 * Universal TrueType Arabic font buffer loader.
 * Safe across Browser (via fetch) and Node.js test runner (via dynamic require).
 */
export async function loadArabicFontBuffer(): Promise<Uint8Array> {
  // 1. Browser / Client-side PWA environment
  if (typeof window !== "undefined" && typeof window.fetch === "function") {
    try {
      const response = await fetch("/fonts/tahoma.ttf");
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
      }
    } catch (err) {
      console.warn("[FontLoader] Browser fetch failed:", err);
    }
    throw new Error("فشل تحميل الخط العربي من /fonts/tahoma.ttf");
  }

  // 2. Node.js / Server / Test environment
  try {
    // Dynamic node require prevents bundlers from packing node:fs into client bundles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const req: any = eval("require");
    const fs = req("fs");
    const path = req("path");

    const projectFontPath = path.resolve(process.cwd(), "public/fonts/tahoma.ttf");
    if (fs.existsSync(projectFontPath)) {
      return new Uint8Array(fs.readFileSync(projectFontPath));
    }

    const winFontPath = "C:\\Windows\\Fonts\\tahoma.ttf";
    if (fs.existsSync(winFontPath)) {
      return new Uint8Array(fs.readFileSync(winFontPath));
    }
  } catch (err) {
    console.warn("[FontLoader] Node dynamic font loading error:", err);
  }

  throw new Error("لم يتم العثور على ملف الخط العربي في public/fonts/tahoma.ttf");
}
