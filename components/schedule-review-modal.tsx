"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Edit2, Check, Send } from "lucide-react"
import { generateText } from "ai"
import { updateStakeholder } from "@/lib/actions/stakeholders"
import type { Stakeholder } from "@/lib/actions/stakeholders"
import { useRouter } from "next/navigation"

interface ScheduleReviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stakeholders: Stakeholder[]
  prdContent: string
  projectId: string
  onScheduleReview: () => void
}

export function ScheduleReviewModal({
  open,
  onOpenChange,
  stakeholders,
  prdContent,
  projectId,
  onScheduleReview,
}: ScheduleReviewModalProps) {
  const [tailoredContent, setTailoredContent] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedContent, setEditedContent] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [generatedFor, setGeneratedFor] = useState<Set<string>>(new Set())
  const router = useRouter()

  const generateTailoredContent = async (stakeholder: Stakeholder) => {
    setIsGenerating(true)
    try {
      const { text } = await generateText({
        model: "openai/gpt-4o-mini",
        prompt: `You are helping a Product Manager communicate a PRD to a ${stakeholder.role}. 
        
Extract and summarize only the information from this PRD that is relevant to a ${stakeholder.role}'s responsibilities and concerns. Focus on:
- Technical requirements specific to their role
- Dependencies they need to be aware of
- Deliverables expected from them
- Timeline and milestones affecting their work

Keep it concise and jargon-free where possible. Format it in clear sections.

PRD Content:
${prdContent}`,
      })

      setTailoredContent((prev) => ({ ...prev, [stakeholder.id]: text }))
      setGeneratedFor((prev) => new Set(prev).add(stakeholder.id))
    } catch (error) {
      console.error("[v0] Error generating tailored content:", error)
      setTailoredContent((prev) => ({
        ...prev,
        [stakeholder.id]: "Error generating content. Please try again.",
      }))
    } finally {
      setIsGenerating(false)
    }
  }

  const generateAllContent = async () => {
    setIsGenerating(true)
    for (const stakeholder of stakeholders) {
      if (!generatedFor.has(stakeholder.id)) {
        await generateTailoredContent(stakeholder)
      }
    }
    setIsGenerating(false)
  }

  const handleEdit = (stakeholderId: string) => {
    setEditingId(stakeholderId)
    setEditedContent(tailoredContent[stakeholderId] || "")
  }

  const handleSaveEdit = (stakeholderId: string) => {
    setTailoredContent((prev) => ({ ...prev, [stakeholderId]: editedContent }))
    setEditingId(null)
    setEditedContent("")
  }

  const handleSendReview = async () => {
    setIsSending(true)
    try {
      for (const stakeholder of stakeholders) {
        if (tailoredContent[stakeholder.id]) {
          await updateStakeholder(stakeholder.id, {
            tailored_content: tailoredContent[stakeholder.id],
            review_status: "in_progress",
          })
        }
      }

      onScheduleReview()
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error sending review:", error)
    } finally {
      setIsSending(false)
    }
  }

  const allGenerated = stakeholders.every((s) => generatedFor.has(s.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Review</DialogTitle>
          <DialogDescription>
            Review the AI-generated content tailored for each stakeholder before sending. You can edit any section to
            prevent hallucinations or add clarifications.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Generate All Button */}
          {!allGenerated && (
            <Button onClick={generateAllContent} disabled={isGenerating} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating tailored content...
                </>
              ) : (
                "Generate Content for All Stakeholders"
              )}
            </Button>
          )}

          {/* Stakeholder Cards */}
          {stakeholders.map((stakeholder) => (
            <Card key={stakeholder.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{stakeholder.name}</h3>
                    <Badge variant="secondary">{stakeholder.role}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{stakeholder.email}</p>
                </div>
                {generatedFor.has(stakeholder.id) && editingId !== stakeholder.id && (
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(stakeholder.id)}>
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>

              {!generatedFor.has(stakeholder.id) ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateTailoredContent(stakeholder)}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Tailored Content"
                  )}
                </Button>
              ) : editingId === stakeholder.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSaveEdit(stakeholder.id)}>
                      <Check className="h-4 w-4 mr-1" />
                      Save Changes
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap">
                  {tailoredContent[stakeholder.id]}
                </div>
              )}
            </Card>
          ))}

          {/* Send Review Button */}
          {allGenerated && (
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleSendReview} className="flex-1" disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Review to All Stakeholders
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
