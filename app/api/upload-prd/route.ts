import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Upload to Vercel Blob with public access
    const blob = await put(file.name, file, {
      access: "public",
    })

    let extractedText: string | null = null
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      try {
        const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const data = await pdfParse(buffer)
        extractedText = data.text
        console.log("[v0] Extracted text from PDF, length:", extractedText.length)
      } catch (error) {
        console.error("[v0] PDF text extraction failed:", error)
        // Continue without extracted text if parsing fails
      }
    } else if (file.type.startsWith("text/") || file.name.match(/\.(txt|md|markdown)$/i)) {
      // For text files, read the content directly
      extractedText = await file.text()
    }

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
      extractedText,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
