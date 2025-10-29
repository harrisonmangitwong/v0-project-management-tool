import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import pdfParse from "pdf-parse"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    console.log("[v0] ===== PDF UPLOAD API CALLED =====")

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("[v0] ERROR: No file provided in request")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] File received:")
    console.log("[v0]   - Name:", file.name)
    console.log("[v0]   - Type:", file.type)
    console.log("[v0]   - Size:", file.size, "bytes")

    // Upload to Vercel Blob
    console.log("[v0] Step 1: Uploading to Vercel Blob...")
    let blob
    try {
      blob = await put(file.name, file, {
        access: "public",
        addRandomSuffix: true,
      })
      console.log("[v0] ✓ Blob upload successful!")
      console.log("[v0]   - URL:", blob.url)
    } catch (blobError) {
      console.error("[v0] ✗ Blob upload FAILED:", blobError)
      return NextResponse.json(
        { error: `Blob upload failed: ${blobError instanceof Error ? blobError.message : "Unknown error"}` },
        { status: 500 },
      )
    }

    // Extract text from PDF using pdf-parse
    let extractedText = ""

    if (file.type === "application/pdf") {
      console.log("[v0] Step 2: Extracting text from PDF...")
      try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        console.log("[v0]   - Buffer created, size:", buffer.length, "bytes")

        const pdfData = await pdfParse(buffer)
        extractedText = pdfData.text.trim()
        console.log("[v0] ✓ Text extraction successful!")
        console.log("[v0]   - Extracted text length:", extractedText.length, "characters")
        console.log("[v0]   - First 100 chars:", extractedText.substring(0, 100))
      } catch (error) {
        console.error("[v0] ✗ PDF text extraction FAILED:", error)
        console.error("[v0]   - Error message:", error instanceof Error ? error.message : String(error))
        // Continue anyway - we'll still have the blob URL for download
        extractedText = ""
      }
    } else {
      console.log("[v0] Skipping text extraction (not a PDF)")
    }

    const response = {
      url: blob.url,
      filename: file.name,
      extractedText: extractedText || null,
    }

    console.log("[v0] ===== RETURNING SUCCESS RESPONSE =====")
    console.log("[v0] Response:", JSON.stringify(response, null, 2))

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] ===== UPLOAD ERROR =====")
    console.error("[v0] Error:", error)
    console.error("[v0] Stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
