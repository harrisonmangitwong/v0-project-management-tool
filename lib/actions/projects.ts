"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface Project {
  id: string
  name: string
  prd_content: string | null
  prd_file_name: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

export interface CreateProjectInput {
  name: string
  prdContent?: string
  prdFileName?: string
}

export async function getProjects() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })

  return { data, error: error?.message }
}

export async function getProject(projectId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).single()

  return { data, error: error?.message }
}

export async function createProject(input: CreateProjectInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: input.name,
      prd_content: input.prdContent || null,
      prd_file_name: input.prdFileName || null,
      owner_id: user.id,
    })
    .select()
    .single()

  if (!error) {
    revalidatePath("/")
  }

  return { data, error: error?.message }
}

export async function updateProject(projectId: string, input: Partial<CreateProjectInput>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("projects")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .select()
    .single()

  if (!error) {
    revalidatePath("/")
  }

  return { data, error: error?.message }
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase.from("projects").delete().eq("id", projectId).eq("owner_id", user.id)

  if (!error) {
    revalidatePath("/")
  }

  return { error: error?.message }
}

export async function uploadPRD(projectId: string, prdContent: string, fileName: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("projects")
    .update({
      prd_content: prdContent,
      prd_file_name: fileName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .select()
    .single()

  if (!error) {
    revalidatePath("/")
  }

  return { data, error: error?.message }
}
