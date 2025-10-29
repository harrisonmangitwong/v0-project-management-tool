"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, FileText, Send, CheckCircle2, Calendar, Paperclip, Loader2 } from "lucide-react"
import { createQuestion } from "@/lib/actions/questions"
import { useRouter } from "next/navigation"
import type { JSX } from "react/jsx-runtime" // Import JSX to declare it

interface StakeholderViewProps {
  projectId: string
  projectName: string
  stakeholderName: string
  stakeholderRole: string
  tailoredContent: string
  questions: Array<{
    id: string
    question: string
    answer: string | null
    askedAt: string
    answeredAt: string | null
  }>
  onBack: () => void
}

function parseMarkdown(markdown: string) {
  const lines = markdown.split("\n")
  const elements: JSX.Element[] = []
  let currentList: string[] = []
  let listKey = 0
  let inTable = false
  let tableRows: string[][] = []

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="list-disc list-inside space-y-1 my-3">
          {currentList.map((item, i) => (
            <li key={i} className="text-foreground">
              {item}
            </li>
          ))}
        </ul>,
      )
      currentList = []
    }
  }

  const flushTable = () => {
    if (tableRows.length > 0) {
      elements.push(
        <div key={`table-${listKey++}`} className="my-4 overflow-x-auto">
          <table className="min-w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted">
                {tableRows[0].map((cell, i) => (
                  <th key={i} className="border border-border px-4 py-2 text-left font-semibold">
                    {cell.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(2).map((row, i) => (
                <tr key={i} className="hover:bg-muted/50">
                  {row.map((cell, j) => (
                    <td key={j} className="border border-border px-4 py-2">
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      tableRows = []
      inTable = false
    }
  }

  lines.forEach((line, index) => {
    // Handle tables
    if (line.includes("|")) {
      if (!inTable) inTable = true
      const cells = line.split("|").filter((cell) => cell.trim())
      tableRows.push(cells)
      return
    } else if (inTable) {
      flushTable()
    }

    // Handle headings
    if (line.startsWith("### ")) {
      flushList()
      elements.push(
        <h3 key={index} className="text-lg font-semibold mt-6 mb-3 text-foreground">
          {line.replace("### ", "")}
        </h3>,
      )
    } else if (line.startsWith("## ")) {
      flushList()
      elements.push(
        <h2 key={index} className="text-xl font-semibold mt-6 mb-3 text-foreground">
          {line.replace("## ", "")}
        </h2>,
      )
    } else if (line.startsWith("# ")) {
      flushList()
      elements.push(
        <h1 key={index} className="text-2xl font-bold mt-6 mb-4 text-foreground">
          {line.replace("# ", "")}
        </h1>,
      )
    }
    // Handle bullet points
    else if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      currentList.push(line.trim().substring(2))
    }
    // Handle blockquotes
    else if (line.startsWith("> ")) {
      flushList()
      elements.push(
        <blockquote key={index} className="border-l-4 border-primary pl-4 italic my-3 text-muted-foreground">
          {line.substring(2)}
        </blockquote>,
      )
    }
    // Handle bold text and regular paragraphs
    else if (line.trim()) {
      flushList()
      const parts = line.split(/(\*\*.*?\*\*)/)
      elements.push(
        <p key={index} className="my-2 text-foreground leading-relaxed">
          {parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={i}>{part.slice(2, -2)}</strong>
            }
            return part
          })}
        </p>,
      )
    }
    // Handle empty lines
    else if (!line.trim() && elements.length > 0) {
      flushList()
    }
  })

  flushList()
  flushTable()

  return elements
}

export function StakeholderView({
  projectId,
  projectName,
  stakeholderName,
  stakeholderRole,
  tailoredContent,
  questions: initialQuestions,
  onBack,
}: StakeholderViewProps) {
  const [newQuestion, setNewQuestion] = useState("")
  const [isResolved, setIsResolved] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [displayContent, setDisplayContent] = useState(tailoredContent) // Use state for content
  const router = useRouter()

  useEffect(() => {
    setDisplayContent(tailoredContent)
  }, [tailoredContent])

  const handleAskQuestion = async () => {
    if (!newQuestion.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await createQuestion(projectId, newQuestion)
      setNewQuestion("")
      router.refresh()
    } catch (error) {
      console.error("Failed to create question:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkResolved = () => {
    setIsResolved(true)
    console.log("[v0] Review marked as resolved by stakeholder")
  }

  const handleScheduleMeeting = () => {
    console.log("[v0] Meeting scheduling requested")
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      "UI/UX": "bg-purple-100 text-purple-700 border-purple-200",
      Frontend: "bg-blue-100 text-blue-700 border-blue-200",
      Backend: "bg-green-100 text-green-700 border-green-200",
      "Data Science": "bg-orange-100 text-orange-700 border-orange-200",
    }
    return colors[role] || "bg-gray-100 text-gray-700 border-gray-200"
  }

  const unresolvedCount = initialQuestions.filter((q) => !q.answer).length

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="px-8 py-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-3 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{projectName}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={getRoleBadgeColor(stakeholderRole)}>
                  {stakeholderRole}
                </Badge>
                <span className="text-sm text-muted-foreground">Review for {stakeholderName}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {!isResolved ? (
                <>
                  <Button variant="outline" onClick={handleScheduleMeeting} className="gap-2 bg-transparent">
                    <Calendar className="h-4 w-4" />
                    Schedule Meeting
                  </Button>
                  <Button onClick={handleMarkResolved} className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Mark as Resolved
                  </Button>
                </>
              ) : (
                <Badge className="bg-green-100 text-green-700 border-green-200 px-4 py-2">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Resolved
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-6 space-y-6">
          {/* Tailored PRD Content */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Your Tailored PRD</h2>
                <p className="text-sm text-muted-foreground">Content relevant to {stakeholderRole}</p>
              </div>
            </div>
            <Separator className="mb-4" />
            {!displayContent || displayContent.trim() === "" ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Generating your tailored PRD content...</p>
                <p className="text-xs text-muted-foreground mt-2">This may take a few moments</p>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <div className="text-sm">{parseMarkdown(displayContent)}</div>
              </div>
            )}
          </Card>

          {/* Questions Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Your Questions</h2>
              {unresolvedCount > 0 && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {unresolvedCount} Unresolved
                </Badge>
              )}
            </div>

            {/* Ask New Question */}
            <Card className="p-4 mb-4">
              <div className="flex gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {stakeholderName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea
                    placeholder="Ask a question about the PRD..."
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    className="min-h-[80px] resize-none"
                    disabled={isSubmitting}
                  />
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Paperclip className="h-4 w-4" />
                      Attach file
                    </Button>
                    <Button
                      onClick={handleAskQuestion}
                      disabled={!newQuestion.trim() || isSubmitting}
                      size="sm"
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {isSubmitting ? "Sending..." : "Ask Question"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Existing Questions */}
            <div className="space-y-3">
              {initialQuestions.map((q) => (
                <Card key={q.id} className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {stakeholderName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-foreground">{stakeholderName}</span>
                          <Badge variant="outline" className={`${getRoleBadgeColor(stakeholderRole)} text-xs`}>
                            {stakeholderRole}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{q.askedAt}</span>
                        </div>
                        <p className="text-sm text-foreground">{q.question}</p>
                      </div>

                      {q.answer ? (
                        <div className="pl-4 border-l-2 border-primary/20">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-foreground">Product Manager</span>
                            <span className="text-xs text-muted-foreground">{q.answeredAt}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{q.answer}</p>
                        </div>
                      ) : (
                        <div className="pl-4 border-l-2 border-amber-200 bg-amber-50 p-3 rounded">
                          <p className="text-xs text-amber-700">Waiting for PM response...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
