"use client"

import { useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { Loader2 } from "lucide-react"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
}

interface PDFViewerProps {
  url: string
  onError?: () => void
}

export function PDFViewer({ url, onError }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    console.log("[v0] PDF loaded successfully, pages:", numPages)
    setNumPages(numPages)
    setLoading(false)
  }

  function onDocumentLoadError(error: Error) {
    console.error("[v0] PDF load error:", error)
    setLoading(false)
    onError?.()
  }

  const pageWidth = typeof window !== "undefined" ? Math.min(window.innerWidth - 100, 800) : 800

  return (
    <div className="flex flex-col items-center w-full gap-4">
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        options={{
          standardFontDataUrl: `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
          cMapUrl: `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
          cMapPacked: true,
        }}
        loading={
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
        error={
          <div className="text-center py-8 text-destructive">
            <p>Failed to load PDF. Please try downloading the file instead.</p>
          </div>
        }
      >
        {!loading &&
          numPages > 0 &&
          Array.from(new Array(numPages), (_, index) => (
            <div key={`page_${index + 1}`} className="mb-4">
              <Page
                pageNumber={index + 1}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg"
                width={pageWidth}
              />
              {numPages > 1 && (
                <div className="text-center mt-2 text-sm text-muted-foreground">
                  Page {index + 1} of {numPages}
                </div>
              )}
            </div>
          ))}
      </Document>
    </div>
  )
}
