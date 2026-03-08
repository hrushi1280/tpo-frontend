export type PlacementStatus = 'NOT_PLACED' | 'INTERNSHIP' | 'PPO' | 'FULL_TIME';
export type JobType = 'INTERNSHIP' | 'PPO' | 'FULL_TIME';
export type BlockReason =
  | 'CHEATING'
  | 'FAKE_DOCUMENTS'
  | 'MISCONDUCT'
  | 'LOW_CGPA'
  | 'OTHER'
  | 'PLACED_FULL_TIME'
  | 'PLACED_PPO'
  | 'PLACED_INTERNSHIP';
export type ApplicationStatus = 'APPLIED' | 'SHORTLISTED' | 'INTERVIEW' | 'SELECTED' | 'REJECTED';
export type Branch = 'COMPUTER' | 'IT' | 'AIDS' | 'ENTC' | 'ELECTRICAL' | 'INSTRUMENTATION' | 'MECHANICAL' | 'CIVIL';
export type QuestionType = 'text' | 'textarea' | 'number' | 'file' | 'dropdown' | 'radio';

export interface Student {
  id: string;
  user_id?: string;
  prn: string;
  password_hash: string;
  full_name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  mother_name?: string;
  date_of_birth?: string;
  is_handicapped?: boolean;
  handicap_details?: string;
  email: string;
  phone: string;
  branch: Branch;
  division?: 'A' | 'B';
  batch_year: number;
  graduation_year: number;
  current_cgpa: number;
  tenth_percentage?: number;
  twelfth_percentage?: number;
  backlogs: number;
  profile_photo_url?: string;
  resume_url?: string;
  is_approved: boolean;
  is_blocked: boolean;
  block_reason?: BlockReason;
  block_remark?: string;
  block_until?: string;
  block_type?: 'TEMPORARY' | 'PERMANENT';
  blocked_at?: string;
  blocked_by?: string;
  placement_status: PlacementStatus;
  placed_company_id?: string;
  placed_company_name?: string;
  placement_date?: string;
  package_offered?: number;
  created_at: string;
  updated_at: string;
  last_login?: string;
  active_session_id?: string;
  last_login_ip?: string;
  last_login_device?: string;
}

export interface CustomQuestion {
  id: string;
  job_drive_id: string;
  question_text: string;
  question_type: QuestionType;
  is_required: boolean;
  placeholder?: string;
  options?: string[];
  display_order: number;
  created_at: string;
}

export interface StudentAnswer {
  id: string;
  application_id: string;
  question_id: string;
  answer_text?: string;
  answer_file_url?: string;
  created_at: string;
  question?: CustomQuestion;
}

export interface Application {
  id: string;
  job_drive_id: string;
  student_id: string;
  status: ApplicationStatus;
  applied_at: string;
  updated_at: string;
  remarks?: string;
  custom_resume_url?: string;
  custom_resume_name?: string;
  job_drive?: JobDrive;
  student?: Student;
  answers?: StudentAnswer[];
}

export interface JobDrive {
  id: string;
  company_id: string;
  title: string;
  job_type: JobType;
  description?: string;
  allowed_branches: Branch[];
  allowed_batches: number[];
  min_cgpa: number;
  max_backlogs: number;
  package_offered?: number;
  location?: string;
  jd_pdf_url?: string;
  jd_file_url?: string;
  application_start: string;
  application_end: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  company?: Company;
  questions?: CustomQuestion[];
}

export interface Company {
  id: string;
  name: string;
  logo_url?: string;
  website?: string;
  hr_name?: string;
  hr_email?: string;
  hr_contact?: string;
  description?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      students: {
        Row: Student;
        Insert: Omit<Student, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Student, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      admin_users: {
        Row: AdminUser;
        Insert: Omit<AdminUser, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AdminUser, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      companies: {
        Row: Company;
        Insert: Omit<Company, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Company, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      job_drives: {
        Row: JobDrive;
        Insert: Omit<JobDrive, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<JobDrive, 'id' | 'created_at' | 'updated_at'>>;
        Relationships: [];
      };
      applications: {
        Row: Application;
        Insert: Omit<Application, 'id' | 'applied_at' | 'updated_at'>;
        Update: Partial<Omit<Application, 'id' | 'applied_at' | 'updated_at'>>;
        Relationships: [];
      };
      custom_questions: {
        Row: CustomQuestion;
        Insert: Omit<CustomQuestion, 'id' | 'created_at'>;
        Update: Partial<Omit<CustomQuestion, 'id' | 'created_at'>>;
        Relationships: [];
      };
      student_answers: {
        Row: StudentAnswer;
        Insert: Omit<StudentAnswer, 'id' | 'created_at'>;
        Update: Partial<Omit<StudentAnswer, 'id' | 'created_at'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      login_student_secure: {
        Args: {
          prn_input: string;
          password_input: string;
          device_input?: string | null;
        };
        Returns: {
          success: boolean;
          message: string | null;
          user_data: Student | null;
          session_id: string | null;
        }[];
      };
      login_admin_secure: {
        Args: {
          email_input: string;
          password_input: string;
        };
        Returns: {
          success: boolean;
          message: string | null;
          user_data: AdminUser | null;
        }[];
      };
      get_admin_dashboard_metrics: {
        Args: Record<string, never>;
        Returns: {
          total_students: number;
          approved_students: number;
          blocked_students: number;
          pending_requests: number;
          placed_students: number;
          internships: number;
          ppo_count: number;
          full_time_count: number;
          total_companies: number;
          active_jobs: number;
          total_applications: number;
          batch_stats: { batch: number; count: number }[];
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
