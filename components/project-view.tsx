"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { QuestionCard } from "@/components/question-card"
import { Badge } from "@/components/ui/badge"
import { PRDDocument } from "@/components/prd-document"
import { UploadPRDModal } from "@/components/upload-prd-modal"
import { ScheduleReviewModal } from "@/components/schedule-review-modal"
import type { Project } from "@/lib/actions/projects"
import type { Stakeholder } from "@/lib/actions/stakeholders"
import { useRouter } from "next/navigation"
import { getProject } from "@/lib/actions/projects"
import { getProjectStakeholders } from "@/lib/actions/stakeholders"

interface ProjectViewProps {
  projectId: string
}

// Mock data for questions
const mockQuestions = [
  {
    id: "q1",
    author: "Sarah Chen",
    role: "UI/UX",
    question: "What is the expected user flow for the onboarding process? Should we include a tutorial or tooltips?",
    timestamp: "2 hours ago",
    status: "unresolved" as const,
    replies: [],
  },
  {
    id: "q2",
    author: "Michael Rodriguez",
    role: "Frontend",
    question: "Are we using REST or GraphQL for the API integration? What authentication method should be implemented?",
    timestamp: "4 hours ago",
    status: "unresolved" as const,
    replies: [],
  },
  {
    id: "q3",
    author: "Emily Watson",
    role: "Backend",
    question: "What database schema should we use for user profiles? Any specific performance requirements?",
    timestamp: "1 day ago",
    status: "resolved" as const,
    replies: [
      {
        author: "PM",
        content:
          "We will use PostgreSQL with the schema outlined in section 3.2 of the PRD. Performance target is <200ms response time.",
      },
    ],
  },
]

// Mock stakeholders data
const mockStakeholders = [
  { id: "s1", name: "Sarah Chen", email: "sarah.chen@company.com", role: "UI/UX" },
  { id: "s2", name: "Michael Rodriguez", email: "michael.r@company.com", role: "Frontend" },
  { id: "s3", name: "Emily Watson", email: "emily.w@company.com", role: "Backend" },
  { id: "s4", name: "David Kim", email: "david.kim@company.com", role: "Data Science" },
]

// Mock PRD content for AI tailoring
const mockPRDContent = `# Product Requirements Document (PRD) – SmartShot Basketball

**Author:** Harrison Wong
**Date:** Oct 15, 2025
**Version:** v1.0

## 🧠 1. Problem Statement

Basketball players at all levels want instant, accurate feedback on their shooting performance without expensive camera rigs or manual scorekeeping. Existing solutions are costly, fragile, or require fixed setups.
**SmartShot** solves this by embedding sensors and machine learning directly inside the basketball, giving users seamless, automatic tracking of makes, misses, and performance analytics through a connected mobile experience.

## 🎯 2. Goals & Success Metrics

### Primary Goals
* Deliver **>95% accuracy** in make/miss detection.
* Enable pairing and start within **<10 seconds** of setup.
* Provide **real-time feedback (<0.5s latency)** via mobile app.
* Retain **50% of weekly active users** after 4 weeks.

### Secondary Goals
* Gamify progress tracking (streaks, XP, leaderboards).
* Enable trajectory visualization and shot zone heatmaps.

### Non-Goals
* Team analytics or multi-user simultaneous sessions (v2+).
* Advanced biometric data like heart rate or fatigue tracking.

## 👥 3. Target Users

| Segment            | Description                  | Pain Point                         |
| ------------------ | ---------------------------- | ---------------------------------- |
| Individual players | Casual / competitive players | Manual tracking, lack of insight   |
| Coaches            | High school / AAU teams      | Hard to quantify shooting sessions |
| Fitness users      | Recreational athletes        | Want gamified sports tracking      |

## ⚙️ 4. Product Requirements

### Core Features

1. **Smart Detection:**
   * Embedded accelerometer + gyroscope + pressure sensors.
   * Edge ML algorithm distinguishes makes/misses based on vibration and pressure signatures.

2. **Bluetooth Connectivity:**
   * BLE 5.0 communication between ball and app.
   * Auto-pair and reconnect on app launch.

3. **Mobile Dashboard:**
   * Real-time accuracy %, streak counter, and shot summary.
   * Post-session analytics: shot charts, trends, averages.

4. **Progress & Gamification:**
   * Daily goals, XP system, and shareable stats.

## 🧩 5. UX & UI Design

### Experience Principles
* **Frictionless:** Pair → Calibrate → Play in under 30 seconds.
* **Motivating:** Clear visuals, subtle animations, satisfying sounds.
* **Insightful:** Each screen gives one actionable takeaway.

### Key Screens
1. **Onboarding Flow:** Device pairing + height calibration (3 steps).
2. **Live Tracking Screen:**
   * Animated make (green ring) / miss (red ripple).
   * Counter at top with session timer.
3. **Analytics Dashboard:**
   * Heatmap of shot zones (by make %).
   * Graphs of accuracy trends and volume over time.

> Deliverables:
> * Figma prototypes for onboarding, live session, analytics.
> * User testing with 10–15 players for MVP usability validation.

## 🧠 6. Technical Overview

### Frontend Engineering
* **Stack:** React Native + TypeScript.
* **Modules:**
  * BLE module for device pairing & data streaming.
  * Real-time visualization layer (Recharts).
  * Local cache (SQLite) for offline mode.

### Backend Engineering
* **Stack:** AWS Lambda + API Gateway + DynamoDB.
* **Responsibilities:**
  * Session data storage & aggregation.
  * Analytics computation pipeline (AWS SageMaker for ML).
  * Auth + user profile management.

### Embedded Systems
* **MCU:** Nordic nRF52840 BLE SoC.
* **Sensors:** 3-axis gyro, 3-axis accel, pressure sensor.
* **Firmware:** C++ signal-processing loop classifying makes/misses at 100Hz.
* **Battery:** 200mAh rechargeable; 6h continuous use.

## 🚀 7. Milestones

| Phase | Deliverable                         | ETA     | Owner        |
| ----- | ----------------------------------- | ------- | ------------ |
| P0    | Hardware prototype + BLE pairing    | Month 1 | HW Eng       |
| P1    | MVP mobile app (real-time tracking) | Month 3 | Frontend     |
| P2    | Analytics dashboard + gamification  | Month 5 | Backend + UX |
| P3    | Closed beta & feedback iteration    | Month 6 | PM + QA      |

## ⚠️ 8. Risks & Mitigations

| Risk                            | Mitigation                                 |
| ------------------------------- | ------------------------------------------ |
| Sensor drift affecting accuracy | Periodic auto-calibration algorithm        |
| BLE latency or dropout          | Retry queue + offline mode                 |
| Manufacturing variability       | Factory calibration profile per ball       |
| App churn                       | Push reminders + social share gamification |

## 🧩 9. Open Questions

* Should we support Apple Watch integration in v1?
* How do we price the ball + app (hardware margin vs subscription)?
* Should analytics remain on-device for privacy, or sync to cloud by default?`

export function ProjectView({ projectId }: ProjectViewProps) {
  const [activeTab, setActiveTab] = useState("unresolved")
  const [questions, setQuestions] = useState<any[]>([])
  const [uploadPRDOpen, setUploadPRDOpen] = useState(false)
  const [scheduleReviewOpen, setScheduleReviewOpen] = useState(false)
  const [project, setProject] = useState<Project | null>(null)
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const [projectResult, stakeholdersResult] = await Promise.all([
        getProject(projectId),
        getProjectStakeholders(projectId),
      ])

      if (projectResult.data) {
        console.log("[v0] Project data loaded:", {
          name: projectResult.data.name,
          prd_file_name: projectResult.data.prd_file_name,
          prd_file_url: projectResult.data.prd_file_url,
          has_prd_content: !!projectResult.data.prd_content,
        })
        setProject(projectResult.data)
      }
      if (stakeholdersResult.data) {
        setStakeholders(stakeholdersResult.data)
      }
      setIsLoading(false)
    }
    loadData()
  }, [projectId, refreshKey]) // Add refreshKey as dependency

  const filteredQuestions = questions.filter((q) => {
    if (activeTab === "all") return true
    return q.status === activeTab
  })

  const unresolvedCount = questions.filter((q) => q.status === "unresolved").length

  const handlePRDUpload = () => {
    console.log("[v0] PRD uploaded, refreshing project data...")
    setRefreshKey((prev) => prev + 1)
  }

  const handleScheduleReview = () => {
    console.log("[v0] Review scheduled and sent to stakeholders")
    // In a real app, this would send notifications to stakeholders
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* PRD Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">PRD</h2>
              <Button variant="outline" size="sm" onClick={() => setUploadPRDOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload PRD
              </Button>
            </div>
            <PRDDocument
              prdContent={project.prd_content}
              fileName={project.prd_file_name}
              fileUrl={project.prd_file_url}
            />
          </section>

          {/* Q&S Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Q&S</h2>
                {unresolvedCount > 0 && (
                  <Badge variant="destructive" className="rounded-full">
                    {unresolvedCount} unresolved
                  </Badge>
                )}
              </div>
              <Button size="sm" onClick={() => setScheduleReviewOpen(true)} disabled={stakeholders.length === 0}>
                Schedule Review
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="unresolved">Unresolved</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Button variant="ghost" size="sm">
                    By time
                  </Button>
                  <Button variant="ghost" size="sm">
                    By upvote
                  </Button>
                  <Button variant="ghost" size="sm">
                    Sort
                  </Button>
                </div>
              </div>

              <TabsContent value={activeTab} className="space-y-4 mt-0">
                {filteredQuestions.length === 0 ? (
                  <Card className="p-8 text-center text-muted-foreground">No {activeTab} questions yet</Card>
                ) : (
                  filteredQuestions.map((question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      onReply={(reply) => {
                        setQuestions((prev) =>
                          prev.map((q) => (q.id === question.id ? { ...q, replies: [...q.replies, reply] } : q)),
                        )
                      }}
                      onResolve={() => {
                        setQuestions((prev) =>
                          prev.map((q) => (q.id === question.id ? { ...q, status: "resolved" } : q)),
                        )
                      }}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </div>

      {/* Upload PRD Modal */}
      <UploadPRDModal
        open={uploadPRDOpen}
        onOpenChange={setUploadPRDOpen}
        projectId={projectId}
        onUploadComplete={handlePRDUpload}
      />

      {/* Schedule Review Modal */}
      <ScheduleReviewModal
        open={scheduleReviewOpen}
        onOpenChange={setScheduleReviewOpen}
        stakeholders={stakeholders}
        prdContent={project.prd_content || ""}
        projectId={projectId}
        onScheduleReview={handleScheduleReview}
      />
    </div>
  )
}
