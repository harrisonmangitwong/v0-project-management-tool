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
    e.stopPropagation()
    setProjectToDelete(project)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return

    setIsDeleting(true)
    try {
      await deleteProject(projectToDelete.id)

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
    <div className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-sidebar-foreground">SmartPRD</h1>
        </div>
        <Button
          className="w-full justify-start gap-2 shadow-sm bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
          size="default"
          onClick={onCreateProject}
        >
          <Plus className="h-4 w-4" />
          Create new project
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-1">
          <h2 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-3 px-3">
            Your projects
          </h2>
          {projects.length === 0 ? (
            <p className="text-sm text-sidebar-foreground/60 px-3 py-2">No projects yet</p>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="group relative flex items-center gap-1">
                <button
                  onClick={() => onSelectProject(project.id)}
                  className={cn(
                    "flex-1 text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    selectedProjectId === project.id
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                  )}
                >
                  {project.name}
                </button>
                <button
                  onClick={(e) => handleDeleteClick(e, project)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-all"
                  title="Delete project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={onShowMetrics}
          className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-all flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Metrics
        </button>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Project</AlertDialogTitle>
            <AlertDialogDescription className="text-white">
              Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
