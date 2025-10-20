import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { projectId: string } }) {
  try {
    const supabase = await createClient()

    // Fetch the project
    const { data: project, error } = await supabase
      .from("projects")
      .select("prd_content")
      .eq("id", params.projectId)
      .single()

    if (error || !project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    const prdContent = project.prd_content

    // Check if it's a PDF data URL
    if (!prdContent || !prdContent.startsWith("data:application/pdf;base64,")) {
      return new NextResponse("No PDF content available", { status: 404 })
    }

    // Extract base64 data
    const base64Data = prdContent.split(",")[1]

    // Convert base64 to binary
    const binaryData = Buffer.from(base64Data, "base64")

    // Return PDF with proper headers
    return new NextResponse(binaryData, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("Error serving PDF:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
