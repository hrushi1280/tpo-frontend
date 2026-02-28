/*
  # Seed Demo Data for TPO Portal

  ## Overview
  Populates the database with realistic demo data for testing and demonstration.

  ## Data Created
  1. **Admin Users** - 1 admin account
     - Email: admin@aissms.edu.in
     - Password: admin123

  2. **Students** - 40 students (20 from batch 2026, 20 from batch 2027)
     - Mix of approved/pending students
     - Some blocked students with various reasons
     - Various placement statuses
     - Different branches and academic profiles

  3. **Companies** - 5 companies
     - TCS, Infosys, Wipro, Accenture, Cognizant

  4. **Job Drives** - 8 job drives
     - Mix of Internship, PPO, and Full-Time positions
     - Different eligibility criteria
     - Active and ongoing application windows

  5. **Applications** - Sample applications from students

  ## Notes
  - All passwords are stored as plain text for demo purposes: "password123"
  - Student PRNs follow pattern: PRN2026001 to PRN2027020
  - Admin password: admin123
*/

-- Insert Admin User
INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
VALUES ('admin@aissms.edu.in', 'admin123', 'TPO Admin', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Insert Students for Batch 2026
INSERT INTO students (prn, password_hash, full_name, email, phone, branch, batch_year, graduation_year, current_cgpa, backlogs, is_approved, is_blocked, placement_status) VALUES
('PRN2026001', 'password123', 'Rahul Sharma', 'rahul.sharma@student.aissms.edu.in', '9876543210', 'COMPUTER', 2026, 2026, 8.5, 0, true, false, 'NOT_PLACED'),
('PRN2026002', 'password123', 'Priya Patel', 'priya.patel@student.aissms.edu.in', '9876543211', 'COMPUTER', 2026, 2026, 9.2, 0, true, false, 'FULL_TIME'),
('PRN2026003', 'password123', 'Amit Kumar', 'amit.kumar@student.aissms.edu.in', '9876543212', 'IT', 2026, 2026, 7.8, 1, true, false, 'NOT_PLACED'),
('PRN2026004', 'password123', 'Sneha Gupta', 'sneha.gupta@student.aissms.edu.in', '9876543213', 'IT', 2026, 2026, 8.9, 0, true, false, 'INTERNSHIP'),
('PRN2026005', 'password123', 'Vijay Singh', 'vijay.singh@student.aissms.edu.in', '9876543214', 'ENTC', 2026, 2026, 7.5, 2, true, false, 'NOT_PLACED'),
('PRN2026006', 'password123', 'Anita Desai', 'anita.desai@student.aissms.edu.in', '9876543215', 'ENTC', 2026, 2026, 8.3, 0, true, false, 'PPO'),
('PRN2026007', 'password123', 'Rajesh Verma', 'rajesh.verma@student.aissms.edu.in', '9876543216', 'MECHANICAL', 2026, 2026, 7.2, 1, true, false, 'NOT_PLACED'),
('PRN2026008', 'password123', 'Pooja Reddy', 'pooja.reddy@student.aissms.edu.in', '9876543217', 'MECHANICAL', 2026, 2026, 8.7, 0, true, false, 'FULL_TIME'),
('PRN2026009', 'password123', 'Karan Mehta', 'karan.mehta@student.aissms.edu.in', '9876543218', 'CIVIL', 2026, 2026, 7.9, 0, true, false, 'NOT_PLACED'),
('PRN2026010', 'password123', 'Divya Joshi', 'divya.joshi@student.aissms.edu.in', '9876543219', 'CIVIL', 2026, 2026, 8.1, 0, true, false, 'INTERNSHIP'),
('PRN2026011', 'password123', 'Suresh Nair', 'suresh.nair@student.aissms.edu.in', '9876543220', 'INSTRUMENTATION', 2026, 2026, 7.6, 1, true, false, 'NOT_PLACED'),
('PRN2026012', 'password123', 'Neha Kapoor', 'neha.kapoor@student.aissms.edu.in', '9876543221', 'COMPUTER', 2026, 2026, 9.0, 0, true, false, 'PPO'),
('PRN2026013', 'password123', 'Arun Rao', 'arun.rao@student.aissms.edu.in', '9876543222', 'COMPUTER', 2026, 2026, 6.8, 3, true, true, 'NOT_PLACED'),
('PRN2026014', 'password123', 'Shruti Shah', 'shruti.shah@student.aissms.edu.in', '9876543223', 'IT', 2026, 2026, 8.4, 0, true, false, 'FULL_TIME'),
('PRN2026015', 'password123', 'Manish Pandey', 'manish.pandey@student.aissms.edu.in', '9876543224', 'IT', 2026, 2026, 7.7, 1, true, false, 'NOT_PLACED'),
('PRN2026016', 'password123', 'Kavita Iyer', 'kavita.iyer@student.aissms.edu.in', '9876543225', 'ENTC', 2026, 2026, 8.6, 0, true, false, 'INTERNSHIP'),
('PRN2026017', 'password123', 'Sanjay Kulkarni', 'sanjay.kulkarni@student.aissms.edu.in', '9876543226', 'ENTC', 2026, 2026, 7.4, 2, false, false, 'NOT_PLACED'),
('PRN2026018', 'password123', 'Asha Menon', 'asha.menon@student.aissms.edu.in', '9876543227', 'MECHANICAL', 2026, 2026, 8.8, 0, true, false, 'PPO'),
('PRN2026019', 'password123', 'Rakesh Agarwal', 'rakesh.agarwal@student.aissms.edu.in', '9876543228', 'CIVIL', 2026, 2026, 7.3, 1, false, false, 'NOT_PLACED'),
('PRN2026020', 'password123', 'Meera Bhatia', 'meera.bhatia@student.aissms.edu.in', '9876543229', 'INSTRUMENTATION', 2026, 2026, 8.2, 0, true, false, 'NOT_PLACED')
ON CONFLICT (prn) DO NOTHING;

-- Insert Students for Batch 2027
INSERT INTO students (prn, password_hash, full_name, email, phone, branch, batch_year, graduation_year, current_cgpa, backlogs, is_approved, is_blocked, placement_status) VALUES
('PRN2027001', 'password123', 'Arjun Malhotra', 'arjun.malhotra@student.aissms.edu.in', '9876543230', 'COMPUTER', 2027, 2027, 8.3, 0, true, false, 'NOT_PLACED'),
('PRN2027002', 'password123', 'Riya Chopra', 'riya.chopra@student.aissms.edu.in', '9876543231', 'COMPUTER', 2027, 2027, 9.1, 0, true, false, 'NOT_PLACED'),
('PRN2027003', 'password123', 'Nikhil Jain', 'nikhil.jain@student.aissms.edu.in', '9876543232', 'IT', 2027, 2027, 7.9, 1, true, false, 'NOT_PLACED'),
('PRN2027004', 'password123', 'Sonal Thakur', 'sonal.thakur@student.aissms.edu.in', '9876543233', 'IT', 2027, 2027, 8.7, 0, true, false, 'INTERNSHIP'),
('PRN2027005', 'password123', 'Vishal Dubey', 'vishal.dubey@student.aissms.edu.in', '9876543234', 'ENTC', 2027, 2027, 7.6, 2, true, false, 'NOT_PLACED'),
('PRN2027006', 'password123', 'Anjali Saxena', 'anjali.saxena@student.aissms.edu.in', '9876543235', 'ENTC', 2027, 2027, 8.5, 0, true, false, 'NOT_PLACED'),
('PRN2027007', 'password123', 'Deepak Yadav', 'deepak.yadav@student.aissms.edu.in', '9876543236', 'MECHANICAL', 2027, 2027, 7.1, 1, true, false, 'NOT_PLACED'),
('PRN2027008', 'password123', 'Tanvi Mishra', 'tanvi.mishra@student.aissms.edu.in', '9876543237', 'MECHANICAL', 2027, 2027, 8.9, 0, true, false, 'NOT_PLACED'),
('PRN2027009', 'password123', 'Rohit Tiwari', 'rohit.tiwari@student.aissms.edu.in', '9876543238', 'CIVIL', 2027, 2027, 7.8, 0, true, false, 'NOT_PLACED'),
('PRN2027010', 'password123', 'Simran Kaur', 'simran.kaur@student.aissms.edu.in', '9876543239', 'CIVIL', 2027, 2027, 8.4, 0, true, false, 'NOT_PLACED'),
('PRN2027011', 'password123', 'Gaurav Singhal', 'gaurav.singhal@student.aissms.edu.in', '9876543240', 'INSTRUMENTATION', 2027, 2027, 7.7, 1, true, false, 'NOT_PLACED'),
('PRN2027012', 'password123', 'Priyanka Arora', 'priyanka.arora@student.aissms.edu.in', '9876543241', 'COMPUTER', 2027, 2027, 8.8, 0, true, false, 'NOT_PLACED'),
('PRN2027013', 'password123', 'Abhishek Bansal', 'abhishek.bansal@student.aissms.edu.in', '9876543242', 'COMPUTER', 2027, 2027, 6.9, 3, true, true, 'NOT_PLACED'),
('PRN2027014', 'password123', 'Nisha Goyal', 'nisha.goyal@student.aissms.edu.in', '9876543243', 'IT', 2027, 2027, 8.6, 0, true, false, 'NOT_PLACED'),
('PRN2027015', 'password123', 'Varun Sinha', 'varun.sinha@student.aissms.edu.in', '9876543244', 'IT', 2027, 2027, 7.5, 1, true, false, 'NOT_PLACED'),
('PRN2027016', 'password123', 'Aditi Bhatt', 'aditi.bhatt@student.aissms.edu.in', '9876543245', 'ENTC', 2027, 2027, 8.2, 0, true, false, 'NOT_PLACED'),
('PRN2027017', 'password123', 'Mohit Bajaj', 'mohit.bajaj@student.aissms.edu.in', '9876543246', 'ENTC', 2027, 2027, 7.4, 2, false, false, 'NOT_PLACED'),
('PRN2027018', 'password123', 'Ritika Sethi', 'ritika.sethi@student.aissms.edu.in', '9876543247', 'MECHANICAL', 2027, 2027, 9.0, 0, true, false, 'NOT_PLACED'),
('PRN2027019', 'password123', 'Pankaj Gupta', 'pankaj.gupta@student.aissms.edu.in', '9876543248', 'CIVIL', 2027, 2027, 7.2, 1, false, false, 'NOT_PLACED'),
('PRN2027020', 'password123', 'Swati Mathur', 'swati.mathur@student.aissms.edu.in', '9876543249', 'INSTRUMENTATION', 2027, 2027, 8.1, 0, true, false, 'NOT_PLACED')
ON CONFLICT (prn) DO NOTHING;

-- Update blocked students with block reasons
UPDATE students 
SET 
  block_reason = 'LOW_CGPA',
  block_remark = 'CGPA below minimum requirement of 7.0',
  blocked_at = now()
WHERE prn IN ('PRN2026013', 'PRN2027013');

-- Update placed students with company details
UPDATE students 
SET 
  placed_company_name = 'TCS',
  package_offered = 7.5,
  placement_date = '2024-01-15'
WHERE prn IN ('PRN2026002', 'PRN2026014');

UPDATE students 
SET 
  placed_company_name = 'Infosys',
  package_offered = 8.0,
  placement_date = '2024-02-10'
WHERE prn = 'PRN2026008';

UPDATE students 
SET 
  placed_company_name = 'Wipro',
  package_offered = 6.5,
  placement_date = '2024-01-20'
WHERE prn IN ('PRN2026004', 'PRN2027004');

UPDATE students 
SET 
  placed_company_name = 'Accenture',
  package_offered = 7.0,
  placement_date = '2024-01-25'
WHERE prn = 'PRN2026010';

UPDATE students 
SET 
  placed_company_name = 'Cognizant',
  package_offered = 9.0,
  placement_date = '2024-02-05'
WHERE prn IN ('PRN2026006', 'PRN2026012', 'PRN2026018');

UPDATE students 
SET 
  placed_company_name = 'TCS',
  package_offered = 7.5,
  placement_date = '2024-02-15'
WHERE prn = 'PRN2026016';

-- Insert Companies
INSERT INTO companies (name, website, hr_name, hr_email, hr_contact, description) VALUES
('Tata Consultancy Services', 'https://www.tcs.com', 'Rajesh Kumar', 'rajesh.kumar@tcs.com', '022-12345678', 'Leading IT services and consulting company'),
('Infosys Technologies', 'https://www.infosys.com', 'Priya Sharma', 'priya.sharma@infosys.com', '080-12345678', 'Global leader in consulting, technology and outsourcing'),
('Wipro Limited', 'https://www.wipro.com', 'Amit Singh', 'amit.singh@wipro.com', '080-23456789', 'Leading technology services and consulting company'),
('Accenture India', 'https://www.accenture.com', 'Neha Patel', 'neha.patel@accenture.com', '022-34567890', 'Global professional services company'),
('Cognizant Technology Solutions', 'https://www.cognizant.com', 'Suresh Reddy', 'suresh.reddy@cognizant.com', '020-45678901', 'American multinational IT services company')
ON CONFLICT DO NOTHING;

-- Insert Job Drives
INSERT INTO job_drives (
  company_id, 
  title, 
  job_type, 
  description, 
  allowed_branches, 
  allowed_batches, 
  min_cgpa, 
  max_backlogs, 
  package_offered, 
  location, 
  application_start, 
  application_end,
  is_active
)
SELECT 
  c.id,
  'Software Developer - Campus Hiring',
  'FULL_TIME',
  'Looking for talented software developers for our product development team',
  ARRAY['COMPUTER', 'IT']::branch_type[],
  ARRAY[2026, 2027],
  7.0,
  1,
  8.5,
  'Mumbai',
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '10 days',
  true
FROM companies c WHERE c.name = 'Tata Consultancy Services'
ON CONFLICT DO NOTHING;

INSERT INTO job_drives (
  company_id, 
  title, 
  job_type, 
  description, 
  allowed_branches, 
  allowed_batches, 
  min_cgpa, 
  max_backlogs, 
  package_offered, 
  location, 
  application_start, 
  application_end,
  is_active
)
SELECT 
  c.id,
  'System Engineer',
  'FULL_TIME',
  'Join our technology consulting team as a System Engineer',
  ARRAY['COMPUTER', 'IT', 'ENTC']::branch_type[],
  ARRAY[2026, 2027],
  6.5,
  2,
  7.0,
  'Bangalore',
  CURRENT_DATE - INTERVAL '3 days',
  CURRENT_DATE + INTERVAL '12 days',
  true
FROM companies c WHERE c.name = 'Infosys Technologies'
ON CONFLICT DO NOTHING;

INSERT INTO job_drives (
  company_id, 
  title, 
  job_type, 
  description, 
  allowed_branches, 
  allowed_batches, 
  min_cgpa, 
  max_backlogs, 
  package_offered, 
  location, 
  application_start, 
  application_end,
  is_active
)
SELECT 
  c.id,
  'Project Engineer',
  'FULL_TIME',
  'Exciting opportunity for engineering graduates in various domains',
  ARRAY['COMPUTER', 'IT', 'ENTC', 'MECHANICAL']::branch_type[],
  ARRAY[2026, 2027],
  6.0,
  2,
  6.5,
  'Pune',
  CURRENT_DATE - INTERVAL '2 days',
  CURRENT_DATE + INTERVAL '15 days',
  true
FROM companies c WHERE c.name = 'Wipro Limited'
ON CONFLICT DO NOTHING;

INSERT INTO job_drives (
  company_id, 
  title, 
  job_type, 
  description, 
  allowed_branches, 
  allowed_batches, 
  min_cgpa, 
  max_backlogs, 
  package_offered, 
  location, 
  application_start, 
  application_end,
  is_active
)
SELECT 
  c.id,
  'Associate Software Engineer',
  'FULL_TIME',
  'Looking for passionate engineers to join our technology team',
  ARRAY['COMPUTER', 'IT']::branch_type[],
  ARRAY[2027],
  7.5,
  0,
  9.0,
  'Hyderabad',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '20 days',
  true
FROM companies c WHERE c.name = 'Accenture India'
ON CONFLICT DO NOTHING;

INSERT INTO job_drives (
  company_id, 
  title, 
  job_type, 
  description, 
  allowed_branches, 
  allowed_batches, 
  min_cgpa, 
  max_backlogs, 
  package_offered, 
  location, 
  application_start, 
  application_end,
  is_active
)
SELECT 
  c.id,
  'Summer Internship Program',
  'INTERNSHIP',
  '2-month summer internship program for pre-final year students',
  ARRAY['COMPUTER', 'IT', 'ENTC']::branch_type[],
  ARRAY[2027],
  7.0,
  1,
  0.3,
  'Chennai',
  CURRENT_DATE - INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '18 days',
  true
FROM companies c WHERE c.name = 'Cognizant Technology Solutions'
ON CONFLICT DO NOTHING;

INSERT INTO job_drives (
  company_id, 
  title, 
  job_type, 
  description, 
  allowed_branches, 
  allowed_batches, 
  min_cgpa, 
  max_backlogs, 
  package_offered, 
  location, 
  application_start, 
  application_end,
  is_active
)
SELECT 
  c.id,
  'Pre-Placement Offer Program',
  'PPO',
  'Internship with Pre-Placement Offer for exceptional students',
  ARRAY['COMPUTER', 'IT']::branch_type[],
  ARRAY[2027],
  8.0,
  0,
  10.0,
  'Mumbai',
  CURRENT_DATE + INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '25 days',
  true
FROM companies c WHERE c.name = 'Tata Consultancy Services'
ON CONFLICT DO NOTHING;

INSERT INTO job_drives (
  company_id, 
  title, 
  job_type, 
  description, 
  allowed_branches, 
  allowed_batches, 
  min_cgpa, 
  max_backlogs, 
  package_offered, 
  location, 
  application_start, 
  application_end,
  is_active
)
SELECT 
  c.id,
  'Technical Consultant',
  'FULL_TIME',
  'Join as a Technical Consultant in our growing consulting practice',
  ARRAY['COMPUTER', 'IT', 'ENTC', 'INSTRUMENTATION']::branch_type[],
  ARRAY[2026, 2027],
  6.8,
  1,
  7.5,
  'Multiple Locations',
  CURRENT_DATE - INTERVAL '4 days',
  CURRENT_DATE + INTERVAL '14 days',
  true
FROM companies c WHERE c.name = 'Accenture India'
ON CONFLICT DO NOTHING;

INSERT INTO job_drives (
  company_id, 
  title, 
  job_type, 
  description, 
  allowed_branches, 
  allowed_batches, 
  min_cgpa, 
  max_backlogs, 
  package_offered, 
  location, 
  application_start, 
  application_end,
  is_active
)
SELECT 
  c.id,
  'Software Engineering Intern',
  'INTERNSHIP',
  '6-month internship program with stipend',
  ARRAY['COMPUTER', 'IT']::branch_type[],
  ARRAY[2027],
  7.2,
  1,
  0.25,
  'Bangalore',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '22 days',
  true
FROM companies c WHERE c.name = 'Wipro Limited'
ON CONFLICT DO NOTHING;
