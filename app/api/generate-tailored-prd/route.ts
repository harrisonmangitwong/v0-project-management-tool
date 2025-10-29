import { NextResponse } from "next/server"
import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    console.log("[v0] ===== GENERATE TAILORED PRD API CALLED =====")

    const { projectId } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get project with PRD content
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("prd_content, prd_extracted_text, owner_id")
      .eq("id", projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Verify user owns the project
    if (project.owner_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Use extracted text if available, otherwise use prd_content
    const prdContent = project.prd_extracted_text || project.prd_content

    if (!prdContent) {
      return NextResponse.json({ error: "No PRD content available" }, { status: 400 })
    }

    // Get all stakeholders for this project
    const { data: stakeholders, error: stakeholdersError } = await supabase
      .from("project_stakeholders")
      .select("*")
      .eq("project_id", projectId)

    if (stakeholdersError || !stakeholders || stakeholders.length === 0) {
      return NextResponse.json({ error: "No stakeholders found" }, { status: 404 })
    }

    console.log("[v0] Generating tailored content for", stakeholders.length, "stakeholders...")

    // Generate tailored content for each stakeholder
    const results = []
    for (const stakeholder of stakeholders) {
      try {
        console.log("[v0] Generating for:", stakeholder.name, "-", stakeholder.role)

        const { text } = await generateText({
          model: "openai/gpt-4o-mini",
          prompt: `You are helping a Product Manager communicate a PRD to a ${stakeholder.role}. 
        
Extract and summarize only the information from this PRD that is relevant to a ${stakeholder.role}'s responsibilities and concerns. Focus on:
- Technical requirements specific to their role
- Dependencies they need to be aware of
- Deliverables expected from them
- Timeline and milestones affecting their work

Keep it concise and jargon-free where possible. Format it in clear sections with Markdown.

PRD Content:
${prdContent}`,
        })

        // Update stakeholder with tailored content
        const { error: updateError } = await supabase
          .from("project_stakeholders")
          .update({
            tailored_content: text,
            review_status: "in_progress",
          })
          .eq("id", stakeholder.id)

        if (updateError) {
          console.error("[v0] Failed to update stakeholder:", stakeholder.id, updateError)
          results.push({ stakeholderId: stakeholder.id, success: false, error: updateError.message })
        } else {
          console.log("[v0] ✓ Updated stakeholder:", stakeholder.name)
          results.push({ stakeholderId: stakeholder.id, success: true })
        }
      } catch (error) {
        console.error("[v0] Error generating for stakeholder:", stakeholder.id, error)
        results.push({
          stakeholderId: stakeholder.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    console.log("[v0] ===== GENERATION COMPLETE =====")
    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("[v0] ===== GENERATION ERROR =====")
    console.error("[v0] Error:", error)
    return NextResponse.json(
      { error: `Generation failed: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
