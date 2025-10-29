-- Add column to store extracted text from PDFs
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS prd_extracted_text TEXT;

-- Add index for better performance when searching extracted text
CREATE INDEX IF NOT EXISTS idx_projects_prd_extracted_text ON public.projects USING gin(to_tsvector('english', prd_extracted_text));
