"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { ProjectView } from "@/components/project-view"
import { CreateProjectModal } from "@/components/create-project-modal"
import { MetricsView } from "@/components/metrics-view"
import { StakeholderView } from "@/components/stakeholder-view"
import type { Project } from "@/lib/actions/projects"

interface HomeClientProps {
  projects: Project[]
}

export function HomeClient({ projects }: HomeClientProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects.length > 0 ? projects[0].id : null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [showMetrics, setShowMetrics] = useState(false)
  const [viewMode, setViewMode] = useState<"pm" | "stakeholder">("pm")

  const handleCreateProject = () => {
    // Refresh will happen via revalidatePath in the server action
    setIsCreateModalOpen(false)
  }

  const handleShowMetrics = () => {
    setShowMetrics(true)
    setSelectedProjectId(null)
  }

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id)
    setShowMetrics(false)
  }

  const handleViewAsStakeholder = () => {
    setViewMode("stakeholder")
  }

  const handleBackToPM = () => {
    setViewMode("pm")
  }

  const demoProject = projects[0]

  return (
    <div className="flex h-screen bg-background">
      {viewMode === "pm" && (
        <Sidebar
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={handleSelectProject}
          onCreateProject={() => setIsCreateModalOpen(true)}
          onShowMetrics={handleShowMetrics}
        />
      )}
      <main className="flex-1 overflow-auto">
        {viewMode === "stakeholder" ? (
          demoProject ? (
            <StakeholderView
              projectId={demoProject.id}
              projectName={demoProject.name}
              stakeholderName="Sarah Chen"
              stakeholderRole="UI/UX"
              tailoredContent={demoProject.prd_content || "No PRD content available yet."}
              questions={[]}
              onBack={handleBackToPM}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Create a project first to view stakeholder demo
            </div>
          )
        ) : showMetrics ? (
          <MetricsView projects={projects} />
        ) : selectedProjectId ? (
          <ProjectView projectId={selectedProjectId} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {projects.length === 0 ? "Create your first project to get started" : "Select a project to get started"}
          </div>
        )}
      </main>

      {viewMode === "pm" && (
        <button
          onClick={handleViewAsStakeholder}
          className="fixed bottom-4 right-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg hover:bg-primary/90 text-sm font-medium"
        >
          View as Stakeholder (Demo)
        </button>
      )}

      <CreateProjectModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreateProject={handleCreateProject}
      />
    </div>
  )
}
