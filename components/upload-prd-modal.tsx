"use client"
import { useState } from "react"
import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { uploadPRD } from "@/lib/actions/projects"
import { useRouter } from "next/navigation"
import { Upload } from "lucide-react"

interface UploadPRDModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

export function UploadPRDModal({ open, onOpenChange, projectId }: UploadPRDModalProps) {
  const [prdText, setPrdText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadMode, setUploadMode] = useState<"text" | "file">("text")
  const router = useRouter()

  const handleTextUpload = async () => {
    if (!prdText.trim()) {
      setError("Please enter PRD content")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const { error: uploadError } = await uploadPRD(projectId, prdText, null, "PRD.txt")

      if (uploadError) {
        throw new Error(uploadError)
      }

      setPrdText("")
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Failed to upload PRD")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload-prd", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to upload file")
      }

      const { url, filename, extractedText } = await response.json()

      // Upload the extracted text and blob URL to the database
      const { error: uploadError } = await uploadPRD(projectId, extractedText, url, filename)

      if (uploadError) {
        throw new Error(uploadError)
      }

      onOpenChange(false)
      router.refresh()
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Failed to upload PDF")
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setPrdText("")
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload PRD</DialogTitle>
          <DialogDescription>Enter text or upload a PDF document</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <Button
              variant={uploadMode === "text" ? "default" : "ghost"}
              size="sm"
              onClick={() => setUploadMode("text")}
              className="flex-1"
            >
              Text Input
            </Button>
            <Button
              variant={uploadMode === "file" ? "default" : "ghost"}
              size="sm"
              onClick={() => setUploadMode("file")}
              className="flex-1"
            >
              Upload PDF
            </Button>
          </div>

          {uploadMode === "text" ? (
            <Textarea
              placeholder="Enter your PRD content here... (Supports Markdown formatting)"
              value={prdText}
              onChange={(e) => setPrdText(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">Upload a PDF file to extract and display its content</p>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="pdf-upload"
                disabled={isUploading}
              />
              <label htmlFor="pdf-upload">
                <Button variant="outline" disabled={isUploading} asChild>
                  <span>{isUploading ? "Uploading..." : "Choose PDF File"}</span>
                </Button>
              </label>
            </div>
          )}

          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">{error}</div>}

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Note:</strong>{" "}
              {uploadMode === "text"
                ? "You can use Markdown formatting (headings, lists, tables, etc.)."
                : "Text will be extracted from the PDF and displayed on the page. The original PDF will be available for download."}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={isUploading}>
            Cancel
          </Button>
          {uploadMode === "text" && (
            <Button onClick={handleTextUpload} disabled={!prdText.trim() || isUploading}>
              {isUploading ? "Uploading..." : "Upload PRD"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
