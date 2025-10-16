"use client"

import type React from "react"
import { useState } from "react"
import { Upload, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createProject } from "@/lib/actions/projects"
import { createStakeholders } from "@/lib/actions/stakeholders"

interface CreateProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateProject: (project: { name: string; prdFile: File | null; stakeholders: Stakeholder[] }) => void
}

interface Stakeholder {
  id: string
  name: string
  email: string
  role: string
}

const roles = [
  "UI/UX Designer",
  "Frontend Engineer",
  "Backend Engineer",
  "Data Scientist",
  "Product Marketing",
  "QA Engineer",
]

export function CreateProjectModal({ open, onOpenChange, onCreateProject }: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState("")
  const [prdFile, setPrdFile] = useState<File | null>(null)
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [newStakeholder, setNewStakeholder] = useState({ name: "", email: "", role: "" })
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPrdFile(e.target.files[0])
    }
  }

  const addStakeholder = () => {
    if (newStakeholder.name && newStakeholder.email && newStakeholder.role) {
      setStakeholders([
        ...stakeholders,
        {
          id: Math.random().toString(36).substr(2, 9),
          ...newStakeholder,
        },
      ])
      setNewStakeholder({ name: "", email: "", role: "" })
    }
  }

  const removeStakeholder = (id: string) => {
    setStakeholders(stakeholders.filter((s) => s.id !== id))
  }

  const handleCreate = async () => {
    if (!projectName) return

    setIsCreating(true)
    setError(null)

    try {
      let prdContent = ""
      if (prdFile) {
        prdContent = await prdFile.text()
      }

      const { data: project, error: projectError } = await createProject({
        name: projectName,
        prdContent: prdContent || undefined,
        prdFileName: prdFile?.name,
      })

      if (projectError || !project) {
        throw new Error(projectError || "Failed to create project")
      }

      if (stakeholders.length > 0) {
        const { error: stakeholdersError } = await createStakeholders(
          project.id,
          stakeholders.map((s) => ({
            name: s.name,
            email: s.email,
            role: s.role,
          })),
        )

        if (stakeholdersError) {
          console.error("Failed to create stakeholders:", stakeholdersError)
        }
      }

      // Call the callback
      onCreateProject({ name: projectName, prdFile, stakeholders })

      // Reset form
      setProjectName("")
      setPrdFile(null)
      setStakeholders([])
      setNewStakeholder({ name: "", email: "", role: "" })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Set up a new SmartPRD project with stakeholders</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="e.g., Mobile App Redesign"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          {/* PRD Upload */}
          <div className="space-y-2">
            <Label htmlFor="prd-upload">Upload PRD</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                id="prd-upload"
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="prd-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                {prdFile ? (
                  <p className="text-sm font-medium">{prdFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium">Click to upload PRD</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, TXT, or MD</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Stakeholders */}
          <div className="space-y-3">
            <Label>Add Stakeholders</Label>

            {/* Stakeholder List */}
            {stakeholders.length > 0 && (
              <div className="space-y-2 mb-4">
                {stakeholders.map((stakeholder) => (
                  <div key={stakeholder.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{stakeholder.name}</p>
                      <p className="text-xs text-muted-foreground">{stakeholder.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{stakeholder.role}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStakeholder(stakeholder.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Stakeholder Form */}
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <Input
                placeholder="Name"
                value={newStakeholder.name}
                onChange={(e) => setNewStakeholder({ ...newStakeholder, name: e.target.value })}
              />
              <Input
                placeholder="Email"
                type="email"
                value={newStakeholder.email}
                onChange={(e) => setNewStakeholder({ ...newStakeholder, email: e.target.value })}
              />
              <Select
                value={newStakeholder.role}
                onValueChange={(value) => setNewStakeholder({ ...newStakeholder, role: value })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addStakeholder}
              disabled={!newStakeholder.name || !newStakeholder.email || !newStakeholder.role}
              className="w-full bg-transparent"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Stakeholder
            </Button>
          </div>

          {/* Error Message */}
          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">{error}</div>}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!projectName || isCreating}>
            {isCreating ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
