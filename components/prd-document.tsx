"use client"
import { FileText, Download } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PDFViewer } from "@/components/pdf-viewer"
import { useState } from "react"
import type { JSX } from "react"

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

function parseMarkdown(markdown: string): JSX.Element[] {
  const lines = markdown.split("\n")
  const elements: JSX.Element[] = []
  let currentList: string[] = []
  let currentTable: string[][] = []
  let inTable = false
  let key = 0

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc pl-6 mb-4 space-y-1">
          {currentList.map((item, i) => (
            <li key={i} className="text-foreground" dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>,
      )
      currentList = []
    }
  }

  const flushTable = () => {
    if (currentTable.length > 0) {
      elements.push(
        <div key={key++} className="overflow-x-auto mb-4">
          <table className="min-w-full border border-border">
            <thead className="bg-muted">
              <tr>
                {currentTable[0].map((cell, i) => (
                  <th key={i} className="border border-border px-4 py-2 text-left font-semibold">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentTable.slice(2).map((row, i) => (
                <tr key={i} className="border-b border-border">
                  {row.map((cell, j) => (
                    <td key={j} className="border border-border px-4 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      currentTable = []
      inTable = false
    }
  }

  const formatInline = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded">$1</code>')
  }

  lines.forEach((line) => {
    // Check for table rows
    if (line.trim().startsWith("|")) {
      if (!inTable) {
        flushList()
        inTable = true
      }
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim())
      currentTable.push(cells)
      return
    } else if (inTable) {
      flushTable()
    }

    // H1
    if (line.startsWith("# ")) {
      flushList()
      elements.push(
        <h1 key={key++} className="text-2xl font-bold mb-4 mt-6 text-foreground">
          {line.slice(2)}
        </h1>,
      )
    }
    // H2
    else if (line.startsWith("## ")) {
      flushList()
      elements.push(
        <h2 key={key++} className="text-xl font-bold mb-3 mt-5 text-foreground">
          {line.slice(3)}
        </h2>,
      )
    }
    // H3
    else if (line.startsWith("### ")) {
      flushList()
      elements.push(
        <h3 key={key++} className="text-lg font-semibold mb-2 mt-4 text-foreground">
          {line.slice(4)}
        </h3>,
      )
    }
    // Blockquote
    else if (line.startsWith("> ")) {
      flushList()
      elements.push(
        <blockquote key={key++} className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-4">
          {line.slice(2)}
        </blockquote>,
      )
    }
    // Bullet list
    else if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
      const content = formatInline(line.trim().slice(2))
      currentList.push(content)
    }
    // Numbered list
    else if (/^\d+\.\s/.test(line.trim())) {
      flushList()
      const content = formatInline(line.trim().replace(/^\d+\.\s/, ""))
      elements.push(<p key={key++} className="mb-2 text-foreground" dangerouslySetInnerHTML={{ __html: content }} />)
    }
    // Empty line
    else if (line.trim() === "") {
      flushList()
      elements.push(<div key={key++} className="h-2" />)
    }
    // Regular paragraph
    else {
      flushList()
      const formatted = formatInline(line)
      elements.push(
        <p
          key={key++}
          className="mb-3 text-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />,
      )
    }
  })

  flushList()
  flushTable()

  return elements
}

interface PRDDocumentProps {
  prdContent?: string | null
  fileName?: string | null
  fileUrl?: string | null
}

export function PRDDocument({ prdContent, fileName, fileUrl }: PRDDocumentProps) {
  const [pdfLoadError, setPdfLoadError] = useState(false)

  const hasContent = !!prdContent
  const displayFileName = fileName || "No PRD uploaded"
  const hasPDFDownload = !!fileUrl
  const isPDFOnly = hasPDFDownload && !hasContent
  const isPDF = fileName?.toLowerCase().endsWith(".pdf")

  const handleDownload = () => {
    if (fileUrl) {
      const link = document.createElement("a")
      link.href = fileUrl
      link.download = fileName || "document.pdf"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Card className="overflow-hidden bg-card shadow-2xl border-border/50">
      <div className="flex items-center justify-between p-5 border-b border-border bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg ring-2 ring-primary/20">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground tracking-tight">{displayFileName}</h3>
            {isPDF && <p className="text-xs text-muted-foreground mt-0.5">PDF Document</p>}
          </div>
        </div>
        {hasPDFDownload && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-2 shadow-lg hover:shadow-xl transition-all duration-200 font-medium bg-muted/50 border-border hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        )}
      </div>

      <div className="bg-card">
        {hasContent ? (
          <div className="p-8 max-w-none prose prose-sm prose-invert">{parseMarkdown(prdContent)}</div>
        ) : isPDFOnly ? (
          pdfLoadError ? (
            <div className="p-8 text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center shadow-xl ring-2 ring-primary/30">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight">Unable to Display PDF</h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  The PDF viewer encountered an error. Please download the file to view it.
                </p>
                <Button onClick={handleDownload} className="gap-2 shadow-lg hover:shadow-xl font-medium">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full max-h-[600px] overflow-auto bg-muted/20 p-6">
              <PDFViewer url={fileUrl!} onError={() => setPdfLoadError(true)} />
            </div>
          )
        ) : (
          <div className="p-8 text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center shadow-xl">
              <FileText className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2 tracking-tight">No PRD Uploaded</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Click 'Upload PRD' to add your product requirements document.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
