"use client"

import { Plus, FileText, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Project } from "@/lib/actions/projects"

interface SidebarProps {
  projects: Project[]
  selectedProjectId: string | null
  onSelectProject: (id: string) => void
  onCreateProject: () => void
  onShowMetrics: () => void
}

export function Sidebar({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  onShowMetrics,
}: SidebarProps) {
  return (
    <div className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-6 w-6" />
          <h1 className="text-xl font-semibold">SmartPRD</h1>
        </div>
        <Button className="w-full justify-start" size="sm" onClick={onCreateProject}>
          <Plus className="h-4 w-4 mr-2" />
          Create new project
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Your projects</h2>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground px-3 py-2">No projects yet</p>
          ) : (
            projects.map((project) => (
              <button
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                  selectedProjectId === project.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
                )}
              >
                {project.name}
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <button
          onClick={onShowMetrics}
          className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent/50 transition-colors flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Metrics
        </button>
      </div>
    </div>
  )
}
