"use client"

import type React from "react"

import { Plus, FileText, BarChart3, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import type { Project } from "@/lib/actions/projects"
import { deleteProject } from "@/lib/actions/projects"
import { useState } from "react"
import { useRouter } from "next/navigation"

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
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation() // Prevent selecting the project when clicking delete
    setProjectToDelete(project)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return

    setIsDeleting(true)
    try {
      await deleteProject(projectToDelete.id)

      // If the deleted project was selected, clear selection
      if (selectedProjectId === projectToDelete.id) {
        onSelectProject(projects.find((p) => p.id !== projectToDelete.id)?.id || "")
      }

      router.refresh()
    } catch (error) {
      console.error("Failed to delete project:", error)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setProjectToDelete(null)
    }
  }

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
              <div key={project.id} className="group relative flex items-center gap-1">
                <button
                  onClick={() => onSelectProject(project.id)}
                  className={cn(
                    "flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors",
                    selectedProjectId === project.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
                  )}
                >
                  {project.name}
                </button>
                <button
                  onClick={(e) => handleDeleteClick(e, project)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  title="Delete project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
