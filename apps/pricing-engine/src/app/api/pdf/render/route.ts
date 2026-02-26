import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const maxDuration = 30;

async function getBrowser() {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    const puppeteer = await import("puppeteer-core");
    const possiblePaths = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
    ];
    let execPath: string | undefined;
    const fs = await import("fs");
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        execPath = p;
        break;
      }
    }
    if (!execPath) {
      throw new Error(
        "No local Chrome/Chromium found. Install Chrome or set CHROME_PATH env var.",
      );
    }
    return puppeteer.default.launch({
      executablePath: process.env.CHROME_PATH || execPath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  const chromium = (await import("@sparticuz/chromium")).default;
  const puppeteer = await import("puppeteer-core");
  return puppeteer.default.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const html = body.html as string;
    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "Missing html field" },
        { status: 400 },
      );
    }

    const browser = await getBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdf = await page.pdf({
        format: "A4",
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
        printBackground: true,
      });
      await page.close();
      const pdfBuf = Buffer.from(pdf);
      if (pdfBuf.byteLength < 100) {
        return NextResponse.json(
          { error: "Puppeteer produced an empty PDF" },
          { status: 500 },
        );
      }
      const header = pdfBuf.subarray(0, 5).toString("ascii");
      if (header !== "%PDF-") {
        return NextResponse.json(
          { error: "Puppeteer output is not a valid PDF" },
          { status: 500 },
        );
      }
      return new Response(pdfBuf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Length": String(pdfBuf.byteLength),
          "Content-Disposition": `attachment; filename="term-sheet.pdf"`,
          "Cache-Control": "no-store",
        },
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("[POST /api/pdf/render]", error);
    return NextResponse.json(
      { error: "PDF generation failed" },
      { status: 500 },
    );
  }
}
