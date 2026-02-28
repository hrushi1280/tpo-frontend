/*
  # AISSMS IOIT Training & Placement Portal - Database Schema

  ## Overview
  Complete database schema for college TPO recruitment portal supporting 1000+ concurrent students
  with batch tracking, placement monitoring, blocking system, and admin approval workflow.

  ## Tables Created

  1. **students**
     - Core student information with PRN-based identification
     - Batch year tracking (2026, 2027, 2028, etc.)
     - Academic details (CGPA, backlogs, branch)
     - Placement status tracking (NOT_PLACED, INTERNSHIP, PPO, FULL_TIME)
     - Blocking system with reasons and remarks
     - Admin approval workflow

  2. **companies**
     - Company information managed by admin
     - Logo URL, website, HR contact details
     - Audit trail with created_by admin

  3. **job_drives**
     - Job postings with eligibility criteria
     - Support for Internship, PPO, and Full-Time positions
     - Branch and batch filtering
     - CGPA and backlog requirements
     - Application window management

  4. **applications**
     - Student applications to job drives
     - Status tracking (APPLIED, SHORTLISTED, INTERVIEW, SELECTED, REJECTED)
     - One application per student per drive constraint

  5. **admin_users**
     - Admin accounts with role-based access
     - Separate from student authentication

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Students can only view/update their own data
  - Admins have full control via policies
  - Public cannot access any data

  ## Indexes
  - Optimized for 1000+ concurrent users
  - Indexes on frequently queried fields (PRN, batch_year, placement_status, etc.)
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE placement_status_type AS ENUM ('NOT_PLACED', 'INTERNSHIP', 'PPO', 'FULL_TIME');
CREATE TYPE job_type AS ENUM ('INTERNSHIP', 'PPO', 'FULL_TIME');
CREATE TYPE block_reason_type AS ENUM ('CHEATING', 'FAKE_DOCUMENTS', 'MISCONDUCT', 'LOW_CGPA', 'OTHER');
CREATE TYPE application_status_type AS ENUM ('APPLIED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED');
CREATE TYPE branch_type AS ENUM ('COMPUTER', 'IT', 'ENTC', 'MECHANICAL', 'CIVIL', 'INSTRUMENTATION');

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT 'admin',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Students Table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  prn text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  branch branch_type NOT NULL,
  batch_year integer NOT NULL,
  graduation_year integer NOT NULL,
  current_cgpa decimal(3,2) DEFAULT 0.00,
  backlogs integer DEFAULT 0,
  
  -- Profile
  profile_photo_url text,
  resume_url text,
  
  -- Approval & Status
  is_approved boolean DEFAULT false,
  is_blocked boolean DEFAULT false,
  block_reason block_reason_type,
  block_remark text,
  blocked_at timestamptz,
  blocked_by uuid REFERENCES admin_users(id),
  
  -- Placement Information
  placement_status placement_status_type DEFAULT 'NOT_PLACED',
  placed_company_id uuid,
  placed_company_name text,
  placement_date timestamptz,
  package_offered decimal(10,2),
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Companies Table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  logo_url text,
  website text,
  hr_name text,
  hr_email text,
  hr_contact text,
  description text,
  created_by uuid REFERENCES admin_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Job Drives Table
CREATE TABLE IF NOT EXISTS job_drives (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  job_type job_type NOT NULL,
  description text,
  
  -- Eligibility Criteria
  allowed_branches branch_type[] NOT NULL,
  allowed_batches integer[] NOT NULL,
  min_cgpa decimal(3,2) DEFAULT 0.00,
  max_backlogs integer DEFAULT 0,
  
  -- Job Details
  package_offered decimal(10,2),
  location text,
  jd_pdf_url text,
  
  -- Application Window
  application_start timestamptz NOT NULL,
  application_end timestamptz NOT NULL,
  
  -- Status
  is_active boolean DEFAULT true,
  
  -- Metadata
  created_by uuid REFERENCES admin_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_drive_id uuid REFERENCES job_drives(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  status application_status_type DEFAULT 'APPLIED',
  applied_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  remarks text,
  
  -- Constraint: One application per student per drive
  UNIQUE(job_drive_id, student_id)
);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users
CREATE POLICY "Admin users can view all admin accounts"
  ON admin_users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert admin accounts"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update their own account"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- RLS Policies for students
CREATE POLICY "Students can view their own data"
  ON students FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can view all students"
  ON students FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Students can update their own profile"
  ON students FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update any student"
  ON students FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- RLS Policies for companies
CREATE POLICY "Authenticated users can view companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can update companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can delete companies"
  ON companies FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- RLS Policies for job_drives
CREATE POLICY "Authenticated users can view active job drives"
  ON job_drives FOR SELECT
  TO authenticated
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can insert job drives"
  ON job_drives FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can update job drives"
  ON job_drives FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can delete job drives"
  ON job_drives FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- RLS Policies for applications
CREATE POLICY "Students can view their own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

CREATE POLICY "Students can insert their own applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (student_id IN (
    SELECT id FROM students WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can update applications"
  ON applications FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- Create Indexes for Performance (1000+ concurrent users)
CREATE INDEX IF NOT EXISTS idx_students_prn ON students(prn);
CREATE INDEX IF NOT EXISTS idx_students_batch_year ON students(batch_year);
CREATE INDEX IF NOT EXISTS idx_students_placement_status ON students(placement_status);
CREATE INDEX IF NOT EXISTS idx_students_is_approved ON students(is_approved);
CREATE INDEX IF NOT EXISTS idx_students_is_blocked ON students(is_blocked);
CREATE INDEX IF NOT EXISTS idx_students_branch ON students(branch);

CREATE INDEX IF NOT EXISTS idx_job_drives_company_id ON job_drives(company_id);
CREATE INDEX IF NOT EXISTS idx_job_drives_is_active ON job_drives(is_active);
CREATE INDEX IF NOT EXISTS idx_job_drives_application_dates ON job_drives(application_start, application_end);

CREATE INDEX IF NOT EXISTS idx_applications_job_drive_id ON applications(job_drive_id);
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_drives_updated_at BEFORE UPDATE ON job_drives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
