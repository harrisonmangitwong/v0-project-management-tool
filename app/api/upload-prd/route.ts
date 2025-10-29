import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import pdf from "pdf-parse"

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

    let extractedText: string | null = null

    if (file.type === "application/pdf") {
      try {
        console.log("[v0] Extracting text from PDF...")
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const data = await pdf(buffer)
        extractedText = data.text
        console.log("[v0] ✓ Text extracted successfully!")
        console.log("[v0]   - Pages:", data.numpages)
        console.log("[v0]   - Text length:", extractedText.length, "characters")
      } catch (pdfError) {
        console.error("[v0] Warning: Failed to extract text from PDF:", pdfError)
        // Continue with upload even if extraction fails
      }
    }

    console.log("[v0] Uploading to Vercel Blob...")
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    })

    console.log("[v0] ✓ Upload successful!")
    console.log("[v0]   - URL:", blob.url)

    const response = {
      url: blob.url,
      filename: file.name,
      extractedText, // Return extracted text
    }

    console.log("[v0] ===== RETURNING SUCCESS RESPONSE =====")
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
