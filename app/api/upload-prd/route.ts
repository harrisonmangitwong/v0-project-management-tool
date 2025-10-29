import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import pdfParse from "pdf-parse"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    console.log("[v0] Upload API called")

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("[v0] No file provided in request")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] File received:", file.name, "Type:", file.type, "Size:", file.size)

    // Upload to Vercel Blob
    console.log("[v0] Uploading to Vercel Blob...")
    let blob
    try {
      blob = await put(file.name, file, {
        access: "public",
        addRandomSuffix: true,
      })
      console.log("[v0] Blob upload successful:", blob.url)
    } catch (blobError) {
      console.error("[v0] Blob upload failed:", blobError)
      return NextResponse.json(
        { error: `Blob upload failed: ${blobError instanceof Error ? blobError.message : "Unknown error"}` },
        { status: 500 },
      )
    }

    // Extract text from PDF using pdf-parse
    let extractedText = ""

    if (file.type === "application/pdf") {
      console.log("[v0] Attempting PDF text extraction...")
      try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        console.log("[v0] Buffer created, size:", buffer.length)

        const pdfData = await pdfParse(buffer)
        extractedText = pdfData.text
        console.log("[v0] Text extraction successful, length:", extractedText.length)
      } catch (error) {
        console.error("[v0] PDF text extraction failed:", error)
        console.error("[v0] Error details:", error instanceof Error ? error.message : String(error))
        // If extraction fails, we'll still have the blob URL for download
        extractedText = ""
      }
    }

    console.log("[v0] Returning success response")
    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      extractedText: extractedText || null,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      { error: `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
