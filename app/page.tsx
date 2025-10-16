import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getProjects } from "@/lib/actions/projects"
import { HomeClient } from "@/components/home-client"

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: projects } = await getProjects()

  return <HomeClient projects={projects || []} />
}
