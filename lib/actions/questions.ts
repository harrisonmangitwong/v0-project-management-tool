"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface Question {
  id: string
  project_id: string
  stakeholder_id: string
  question_text: string
  status: "unresolved" | "resolved"
  created_at: string
  resolved_at: string | null
}

export interface Answer {
  id: string
  question_id: string
  answer_text: string
  is_ai_generated: boolean
  created_by: string | null
  created_at: string
}

export interface QuestionWithAnswers extends Question {
  answers: Answer[]
  stakeholder: {
    name: string
    role: string
  }
}

export async function getProjectQuestions(projectId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select(
      `
      *,
      project_stakeholders!inner(name, role),
      answers(*)
    `,
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  if (questionsError) {
    return { data: null, error: questionsError.message }
  }

  const formattedQuestions: QuestionWithAnswers[] = questions.map((q: any) => ({
    id: q.id,
    project_id: q.project_id,
    stakeholder_id: q.stakeholder_id,
    question_text: q.question_text,
    status: q.status,
    created_at: q.created_at,
    resolved_at: q.resolved_at,
    answers: q.answers || [],
    stakeholder: {
      name: q.project_stakeholders.name,
      role: q.project_stakeholders.role,
    },
  }))

  return { data: formattedQuestions, error: null }
}

export async function createQuestion(projectId: string, stakeholderId: string, questionText: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("questions")
    .insert({
      project_id: projectId,
      stakeholder_id: stakeholderId,
      question_text: questionText,
    })
    .select()
    .single()

  if (!error) {
    revalidatePath("/")
  }

  return { data, error: error?.message }
}

export async function addAnswer(questionId: string, answerText: string, isAiGenerated = false) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("answers")
    .insert({
      question_id: questionId,
      answer_text: answerText,
      is_ai_generated: isAiGenerated,
      created_by: user.id,
    })
    .select()
    .single()

  if (!error) {
    revalidatePath("/")
  }

  return { data, error: error?.message }
}

export async function resolveQuestion(questionId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("questions")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", questionId)
    .select()
    .single()

  if (!error) {
    revalidatePath("/")
  }

  return { data, error: error?.message }
}

export async function unresolveQuestion(questionId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("questions")
    .update({
      status: "unresolved",
      resolved_at: null,
    })
    .eq("id", questionId)
    .select()
    .single()

  if (!error) {
    revalidatePath("/")
  }

  return { data, error: error?.message }
}
