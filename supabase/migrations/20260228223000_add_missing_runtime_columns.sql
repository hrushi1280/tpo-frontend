/*
  Runtime alignment migration
  Adds columns referenced by the frontend/auth flows but missing from initial schema.
*/

-- Students session and blocking metadata
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS active_session_id text,
  ADD COLUMN IF NOT EXISTS last_login_device text,
  ADD COLUMN IF NOT EXISTS last_login_ip text,
  ADD COLUMN IF NOT EXISTS block_until timestamptz,
  ADD COLUMN IF NOT EXISTS block_type text;

-- Job drives file URL used by admin form
ALTER TABLE job_drives
  ADD COLUMN IF NOT EXISTS jd_file_url text;

-- Per-application resume customization
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS custom_resume_url text,
  ADD COLUMN IF NOT EXISTS custom_resume_name text;

-- Helpful indexes for high-read paths
CREATE INDEX IF NOT EXISTS idx_students_active_session_id ON students(active_session_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_drive_applied_at ON applications(job_drive_id, applied_at DESC);
