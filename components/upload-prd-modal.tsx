"use client"
import { useState } from "react"
import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { uploadPRD } from "@/lib/actions/projects"
import { useRouter } from "next/navigation"
import { Upload, Loader2 } from "lucide-react"

interface UploadPRDModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onUploadComplete?: () => void
}

export function UploadPRDModal({ open, onOpenChange, projectId, onUploadComplete }: UploadPRDModalProps) {
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
      onUploadComplete?.()
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Failed to upload PRD")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      console.log("[v0] No file selected")
      return
    }

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file")
      return
    }

    console.log("[v0] ===== FILE UPLOAD STARTED =====")
    console.log("[v0] File:", file.name, "Size:", file.size)
    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("projectId", projectId)

      console.log("[v0] Sending POST request to /api/upload-prd...")
      const response = await fetch("/api/upload-prd", {
        method: "POST",
        body: formData,
      })

      console.log("[v0] Response received, status:", response.status)

      if (!response.ok) {
        let errorMessage = "Failed to upload file"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          const errorText = await response.text()
          errorMessage = errorText || errorMessage
        }
        console.error("[v0] Server returned error:", errorMessage)
        throw new Error(errorMessage)
      }

      const responseData = await response.json()
      console.log("[v0] Response data:", responseData)

      const { url, filename, extractedText } = responseData

      console.log("[v0] Calling uploadPRD action...")
      console.log("[v0]   - projectId:", projectId)
      console.log("[v0]   - url:", url)
      console.log("[v0]   - filename:", filename)
      console.log("[v0]   - extractedText length:", extractedText?.length || 0)

      const { error: uploadError } = await uploadPRD(projectId, null, url, filename, extractedText)

      if (uploadError) {
        console.error("[v0] uploadPRD returned error:", uploadError)
        throw new Error(uploadError)
      }

      console.log("[v0] ✓ Upload complete! Closing modal and refreshing...")
      onOpenChange(false)
      onUploadComplete?.()
    } catch (err) {
      console.error("[v0] ===== UPLOAD FAILED =====")
      console.error("[v0] Error:", err)
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
              <p className="text-sm text-muted-foreground mb-2">
                Upload a PDF file to automatically extract text and generate tailored PRDs
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Text will be extracted and tailored content will be generated for each stakeholder
              </p>
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
                  <span>
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Extracting and processing...
                      </>
                    ) : (
                      "Choose PDF File"
                    )}
                  </span>
                </Button>
              </label>
            </div>
          )}

          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">{error}</div>}

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Note:</strong>{" "}
              {uploadMode === "text"
                ? "You can use Markdown formatting (headings, lists, tables, etc.). Tailored content will be generated automatically for stakeholders."
                : "Your PDF will be processed to extract text, and tailored content will be automatically generated for each stakeholder based on their role."}
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
