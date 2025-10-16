"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Clock, MessageSquare, Users, TrendingDown } from "lucide-react"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import type { Project } from "@/lib/actions/projects"

interface MetricsViewProps {
  projects: Project[]
}

export function MetricsView({ projects }: MetricsViewProps) {
  const totalQuestions = projects.reduce((sum, p) => sum + (p.questions?.length || 0), 0)
  const resolvedQuestions = projects.reduce(
    (sum, p) => sum + (p.questions?.filter((q) => q.is_resolved).length || 0),
    0,
  )
  const resolutionRate = totalQuestions > 0 ? Math.round((resolvedQuestions / totalQuestions) * 100) : 0
  const meetingsAvoided = resolvedQuestions

  const stakeholderEngagementMap = new Map<string, number>()
  projects.forEach((project) => {
    project.stakeholders?.forEach((stakeholder) => {
      const count = stakeholderEngagementMap.get(stakeholder.role) || 0
      stakeholderEngagementMap.set(stakeholder.role, count + 1)
    })
  })

  const stakeholderEngagementData = Array.from(stakeholderEngagementMap.entries()).map(([role, questions]) => ({
    role,
    questions,
  }))

  const resolutionTimeData = projects
    .filter((p) => p.questions && p.questions.length > 0)
    .map((project) => ({
      project: project.name,
      avgHours: 4.2, // Would calculate from actual timestamps in production
    }))
    .slice(0, 3)

  // Mock trend data (would be calculated from timestamps in production)
  const questionTrendData = [
    { week: "Week 1", questions: 12, resolved: 10 },
    { week: "Week 2", questions: 18, resolved: 15 },
    { week: "Week 3", questions: 15, resolved: 14 },
    { week: "Week 4", questions: totalQuestions, resolved: resolvedQuestions },
  ]

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Metrics Dashboard</h1>
        <p className="text-muted-foreground">Track project performance and team engagement</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuestions}</div>
            <p className="text-xs text-muted-foreground">Across {projects.length} projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolutionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {resolvedQuestions} of {totalQuestions} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.3h</div>
            <p className="text-xs text-muted-foreground">Estimated average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meetings Avoided</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetingsAvoided}</div>
            <p className="text-xs text-muted-foreground">~{Math.round(meetingsAvoided * 0.5)} hours saved</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Question Trends</CardTitle>
            <CardDescription>Questions asked and resolved over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={questionTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Line type="monotone" dataKey="questions" stroke="hsl(var(--primary))" strokeWidth={2} name="Asked" />
                <Line type="monotone" dataKey="resolved" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stakeholder Engagement</CardTitle>
            <CardDescription>Questions by role</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stakeholderEngagementData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="role" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Bar dataKey="questions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Resolution Time</CardTitle>
            <CardDescription>Time to resolve questions by project</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={resolutionTimeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="project" type="category" className="text-xs" width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                  }}
                />
                <Bar dataKey="avgHours" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Stakeholders</CardTitle>
            <CardDescription>Team members participating in reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Sarah Chen", role: "UI/UX Designer", questions: 15, resolved: 14 },
                { name: "Mike Johnson", role: "Frontend Engineer", questions: 22, resolved: 20 },
                { name: "Alex Kim", role: "Backend Engineer", questions: 18, resolved: 16 },
                { name: "Emma Davis", role: "Data Scientist", questions: 12, resolved: 11 },
              ].map((stakeholder) => (
                <div key={stakeholder.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{stakeholder.name}</p>
                      <p className="text-xs text-muted-foreground">{stakeholder.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {stakeholder.resolved}/{stakeholder.questions}
                    </p>
                    <p className="text-xs text-muted-foreground">resolved</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
