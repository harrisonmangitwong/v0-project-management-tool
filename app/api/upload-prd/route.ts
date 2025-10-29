import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import pdfParse from "pdf-parse"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    })

    // Extract text from PDF using pdf-parse
    let extractedText = ""

    if (file.type === "application/pdf") {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const pdfData = await pdfParse(buffer)
        extractedText = pdfData.text
      } catch (error) {
        console.error("[v0] PDF text extraction failed:", error)
        // If extraction fails, we'll still have the blob URL for download
        extractedText = ""
      }
    }

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      extractedText: extractedText || null,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
