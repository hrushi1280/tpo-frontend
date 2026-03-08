-- Add new branch values required by updated registration flow
ALTER TYPE branch_type ADD VALUE IF NOT EXISTS 'AIDS';
ALTER TYPE branch_type ADD VALUE IF NOT EXISTS 'ELECTRICAL';

-- Add new student registration fields
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS division varchar(1) DEFAULT 'A',
  ADD COLUMN IF NOT EXISTS tenth_percentage decimal(5,2),
  ADD COLUMN IF NOT EXISTS twelfth_percentage decimal(5,2);

-- Backfill safe defaults for existing records
UPDATE public.students
SET division = COALESCE(division, 'A')
WHERE division IS NULL;

-- Constraints for data quality
ALTER TABLE public.students
  DROP CONSTRAINT IF EXISTS students_division_check,
  ADD CONSTRAINT students_division_check CHECK (division IN ('A', 'B')),
  DROP CONSTRAINT IF EXISTS students_tenth_percentage_check,
  ADD CONSTRAINT students_tenth_percentage_check CHECK (tenth_percentage IS NULL OR (tenth_percentage >= 0 AND tenth_percentage <= 100)),
  DROP CONSTRAINT IF EXISTS students_twelfth_percentage_check,
  ADD CONSTRAINT students_twelfth_percentage_check CHECK (twelfth_percentage IS NULL OR (twelfth_percentage >= 0 AND twelfth_percentage <= 100));

CREATE INDEX IF NOT EXISTS idx_students_division ON public.students(division);
