import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] Uploading file:", file.name, "type:", file.type)

    // Upload to Vercel Blob with public access
    const blob = await put(file.name, file, {
      access: "public",
    })

    console.log("[v0] File uploaded to Blob:", blob.url)

    let extractedText: string | null = null

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      try {
        // Import pdfjs-dist dynamically
        const pdfjsLib = await import("pdfjs-dist")

        // Get the PDF data as array buffer
        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        console.log("[v0] Loading PDF document...")

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({
          data: uint8Array,
          useWorkerFetch: false,
          isEvalSupported: false,
          useSystemFonts: true,
        })

        const pdfDocument = await loadingTask.promise
        const numPages = pdfDocument.numPages

        console.log("[v0] PDF loaded, extracting text from", numPages, "pages...")

        // Extract text from all pages
        const textPromises = []
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          textPromises.push(
            pdfDocument.getPage(pageNum).then(async (page) => {
              const textContent = await page.getTextContent()
              return textContent.items.map((item: any) => item.str).join(" ")
            }),
          )
        }

        const pageTexts = await Promise.all(textPromises)
        extractedText = pageTexts.join("\n\n")

        console.log("[v0] Successfully extracted text from PDF, length:", extractedText.length)
      } catch (error) {
        console.error("[v0] PDF text extraction failed:", error)
        // Continue without extracted text if parsing fails
      }
    } else if (file.type.startsWith("text/") || file.name.match(/\.(txt|md|markdown)$/i)) {
      // For text files, read the content directly
      extractedText = await file.text()
      console.log("[v0] Extracted text from text file, length:", extractedText.length)
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
