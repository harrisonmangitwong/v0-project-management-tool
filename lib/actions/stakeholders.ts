"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface Stakeholder {
  id: string
  project_id: string
  user_id: string | null
  name: string
  email: string
  role: string
  tailored_content: string | null
  review_status: "pending" | "in_progress" | "resolved"
  created_at: string
}

export interface CreateStakeholderInput {
  name: string
  email: string
  role: string
}

export async function getProjectStakeholders(projectId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("project_stakeholders")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })

  return { data, error: error?.message }
}

export async function createStakeholders(projectId: string, stakeholders: CreateStakeholderInput[]) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  // Verify user owns the project
  const { data: project } = await supabase.from("projects").select("owner_id").eq("id", projectId).single()

  if (!project || project.owner_id !== user.id) {
    return { data: null, error: "Not authorized" }
  }

  const { data, error } = await supabase
    .from("project_stakeholders")
    .insert(
      stakeholders.map((s) => ({
        project_id: projectId,
        name: s.name,
        email: s.email,
        role: s.role,
      })),
    )
    .select()

  if (!error) {
    revalidatePath("/")
  }

  return { data, error: error?.message }
}

export async function updateStakeholder(
  stakeholderId: string,
  updates: { tailored_content?: string; review_status?: "pending" | "in_progress" | "resolved" },
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("project_stakeholders")
    .update(updates)
    .eq("id", stakeholderId)
    .select()
    .single()

  if (!error) {
    revalidatePath("/")
  }

  return { data, error: error?.message }
}

export async function deleteStakeholder(stakeholderId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase.from("project_stakeholders").delete().eq("id", stakeholderId)

  if (!error) {
    revalidatePath("/")
  }

  return { error: error?.message }
}
