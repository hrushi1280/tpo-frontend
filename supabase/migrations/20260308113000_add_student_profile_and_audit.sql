-- Student personal profile fields
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS middle_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS mother_name text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS is_handicapped boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS handicap_details text;

-- Keep full_name in sync for existing records where name parts are empty
UPDATE public.students
SET first_name = split_part(full_name, ' ', 1)
WHERE first_name IS NULL AND full_name IS NOT NULL;

-- Edit history table for TPO registration/profile updates
CREATE TABLE IF NOT EXISTS public.student_profile_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_profile_audit_student_id_changed_at
  ON public.student_profile_audit(student_id, changed_at DESC);

-- Helpful data quality checks
ALTER TABLE public.students
  DROP CONSTRAINT IF EXISTS students_cgpa_check,
  ADD CONSTRAINT students_cgpa_check CHECK (current_cgpa >= 0 AND current_cgpa <= 10),
  DROP CONSTRAINT IF EXISTS students_backlogs_check,
  ADD CONSTRAINT students_backlogs_check CHECK (backlogs >= 0);
