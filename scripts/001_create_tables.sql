-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('pm', 'stakeholder')) DEFAULT 'pm',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  prd_content TEXT,
  prd_file_name TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_stakeholders table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.project_stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('UI/UX Designer', 'Frontend Engineer', 'Backend Engineer', 'Data Scientist', 'Marketing', 'Other')),
  tailored_content TEXT,
  review_status TEXT CHECK (review_status IN ('pending', 'in_progress', 'resolved')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stakeholder_id UUID NOT NULL REFERENCES public.project_stakeholders(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  status TEXT CHECK (status IN ('unresolved', 'resolved')) DEFAULT 'unresolved',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Create answers table
CREATE TABLE IF NOT EXISTS public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  is_ai_generated BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view their own projects" ON public.projects
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can view projects where they are stakeholders" ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_stakeholders
      WHERE project_stakeholders.project_id = projects.id
      AND project_stakeholders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own projects" ON public.projects
  FOR DELETE USING (auth.uid() = owner_id);

-- Project stakeholders policies
CREATE POLICY "Project owners can view stakeholders" ON public.project_stakeholders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_stakeholders.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Stakeholders can view their own record" ON public.project_stakeholders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Project owners can insert stakeholders" ON public.project_stakeholders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_stakeholders.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can update stakeholders" ON public.project_stakeholders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_stakeholders.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can delete stakeholders" ON public.project_stakeholders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_stakeholders.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Questions policies
CREATE POLICY "Project owners can view all questions" ON public.questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = questions.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Stakeholders can view their own questions" ON public.questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_stakeholders
      WHERE project_stakeholders.id = questions.stakeholder_id
      AND project_stakeholders.user_id = auth.uid()
    )
  );

CREATE POLICY "Stakeholders can insert their own questions" ON public.questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_stakeholders
      WHERE project_stakeholders.id = questions.stakeholder_id
      AND project_stakeholders.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can update questions" ON public.questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = questions.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Answers policies
CREATE POLICY "Users can view answers to questions they can see" ON public.answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.questions
      WHERE questions.id = answers.question_id
    )
  );

CREATE POLICY "Project owners can insert answers" ON public.answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.questions
      JOIN public.projects ON projects.id = questions.project_id
      WHERE questions.id = answers.question_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_project_id ON public.project_stakeholders(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_user_id ON public.project_stakeholders(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_project_id ON public.questions(project_id);
CREATE INDEX IF NOT EXISTS idx_questions_stakeholder_id ON public.questions(stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.answers(question_id);
