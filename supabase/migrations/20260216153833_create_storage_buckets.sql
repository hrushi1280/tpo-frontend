/*
  # Storage Buckets for TPO Portal

  ## Buckets Created
  1. **resumes** - Student resume PDFs (max 5MB)
  2. **job-descriptions** - Job description PDFs
  3. **company-logos** - Company logo images

  ## Security
  - Students can upload/update their own resumes
  - Admins can upload job descriptions and company logos
  - All authenticated users can view files
  - Public access disabled
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('resumes', 'resumes', false, 5242880, ARRAY['application/pdf']),
  ('job-descriptions', 'job-descriptions', false, 10485760, ARRAY['application/pdf']),
  ('company-logos', 'company-logos', false, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for resumes bucket
CREATE POLICY "Students can upload their own resume"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] IN (
      SELECT prn FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update their own resume"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] IN (
      SELECT prn FROM students WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] IN (
      SELECT prn FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can view resumes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'resumes');

CREATE POLICY "Students can delete their own resume"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resumes' AND
    (storage.foldername(name))[1] IN (
      SELECT prn FROM students WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for job-descriptions bucket
CREATE POLICY "Admins can upload job descriptions"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'job-descriptions' AND
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update job descriptions"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'job-descriptions' AND
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  )
  WITH CHECK (
    bucket_id = 'job-descriptions' AND
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Authenticated users can view job descriptions"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'job-descriptions');

CREATE POLICY "Admins can delete job descriptions"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'job-descriptions' AND
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- RLS Policies for company-logos bucket
CREATE POLICY "Admins can upload company logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company-logos' AND
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update company logos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'company-logos' AND
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  )
  WITH CHECK (
    bucket_id = 'company-logos' AND
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

CREATE POLICY "Authenticated users can view company logos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'company-logos');

CREATE POLICY "Admins can delete company logos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'company-logos' AND
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );
