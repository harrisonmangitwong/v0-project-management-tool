"use client"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { uploadPRD } from "@/lib/actions/projects"
import { useRouter } from "next/navigation"

interface UploadPRDModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

export function UploadPRDModal({ open, onOpenChange, projectId }: UploadPRDModalProps) {
  const [prdText, setPrdText] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleUpload = async () => {
    if (!prdText.trim()) {
      setError("Please enter PRD content")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const { error: uploadError } = await uploadPRD(projectId, prdText, "PRD.txt")

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
          <DialogDescription>Enter or paste your Product Requirements Document content</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Enter your PRD content here... (Supports Markdown formatting)"
            value={prdText}
            onChange={(e) => setPrdText(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />

          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">{error}</div>}

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Note:</strong> You can use Markdown formatting (headings, lists, tables, etc.). Uploading new
              content will replace the existing PRD.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!prdText.trim() || isUploading}>
            {isUploading ? "Uploading..." : "Upload PRD"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
