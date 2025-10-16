"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, Check } from "lucide-react"
import { addAnswer, resolveQuestion } from "@/lib/actions/questions"
import { useRouter } from "next/navigation"

interface Reply {
  author: string
  content: string
}

interface Question {
  id: string
  author: string
  role: string
  question: string
  timestamp: string
  status: "resolved" | "unresolved"
  replies: Reply[]
}

interface QuestionCardProps {
  question: Question
  onReply: (reply: Reply) => void
  onResolve: () => void
}

export function QuestionCard({ question }: QuestionCardProps) {
  const [replyText, setReplyText] = useState("")
  const [isReplying, setIsReplying] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmitReply = async () => {
    if (replyText.trim() && !isSubmitting) {
      setIsSubmitting(true)
      try {
        await addAnswer(question.id, replyText)
        setReplyText("")
        setIsReplying(false)
        router.refresh()
      } catch (error) {
        console.error("Failed to add reply:", error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleResolve = async () => {
    setIsSubmitting(true)
    try {
      await resolveQuestion(question.id)
      router.refresh()
    } catch (error) {
      console.error("Failed to resolve question:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      "UI/UX": "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
      Frontend: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
      Backend: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20",
      "Data Science": "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20",
    }
    return colors[role] || "bg-gray-500/10 text-gray-600"
  }

  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary">{getInitials(question.author)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-medium">{question.author}</span>
            <Badge variant="secondary" className={getRoleBadgeColor(question.role)}>
              {question.role}
            </Badge>
            <span className="text-sm text-muted-foreground">{question.timestamp}</span>
          </div>

          <p className="text-sm leading-relaxed">{question.question}</p>

          {/* Replies */}
          {question.replies.length > 0 && (
            <div className="space-y-2 pl-4 border-l-2 border-border">
              {question.replies.map((reply, index) => (
                <div key={index} className="space-y-1">
                  <div className="text-sm font-medium text-primary">{reply.author}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{reply.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Reply Input */}
          {isReplying ? (
            <div className="space-y-2">
              <Textarea
                placeholder="Type your response..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[80px] resize-none"
                disabled={isSubmitting}
              />
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Upload attachment
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsReplying(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSubmitReply} disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Reply"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsReplying(true)}>
                Reply
              </Button>
              {question.status === "unresolved" && (
                <Button variant="outline" size="sm" onClick={handleResolve} disabled={isSubmitting}>
                  <Check className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Resolving..." : "Mark as Resolved"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
