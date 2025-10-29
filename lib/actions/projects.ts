"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface Project {
  id: string
  name: string
  prd_content: string | null
  prd_file_name: string | null
  prd_file_url: string | null
  prd_extracted_text: string | null // Added extracted text field
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

export async function uploadPRD(
  projectId: string,
  prdContent: string | null,
  fileUrl: string | null,
  fileName: string,
  extractedText: string | null = null, // Added extractedText parameter
) {
  console.log("[v0] ===== uploadPRD ACTION CALLED =====")
  console.log("[v0] Parameters:")
  console.log("[v0]   - projectId:", projectId)
  console.log("[v0]   - prdContent length:", prdContent?.length || 0)
  console.log("[v0]   - fileUrl:", fileUrl)
  console.log("[v0]   - fileName:", fileName)
  console.log("[v0]   - extractedText length:", extractedText?.length || 0) // Log extracted text

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error("[v0] ERROR: Not authenticated")
    return { data: null, error: "Not authenticated" }
  }

  console.log("[v0] User authenticated:", user.id)

  const updateData = {
    prd_content: prdContent,
    prd_file_name: fileName,
    prd_file_url: fileUrl,
    prd_extracted_text: extractedText, // Store extracted text
    updated_at: new Date().toISOString(),
  }

  console.log("[v0] Updating database with:", JSON.stringify(updateData, null, 2))

  const { data, error } = await supabase
    .from("projects")
    .update(updateData)
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .select()
    .single()

  if (error) {
    console.error("[v0] ✗ Database update FAILED:", error)
    return { data: null, error: error.message }
  }

  console.log("[v0] ✓ Database update successful!")
  console.log("[v0] Updated project:", JSON.stringify(data, null, 2))

  if (extractedText || prdContent) {
    console.log("[v0] Triggering automatic tailored PRD generation...")
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/generate-tailored-prd`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId }),
        },
      )

      if (!response.ok) {
        console.error("[v0] Failed to generate tailored content:", await response.text())
      } else {
        console.log("[v0] ✓ Tailored content generation triggered successfully")
      }
    } catch (genError) {
      console.error("[v0] Error triggering tailored content generation:", genError)
      // Don't fail the upload if generation fails
    }
  }

  revalidatePath("/")

  return { data, error: null }
}
