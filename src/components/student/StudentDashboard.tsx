import { useState, useEffect, useCallback } from 'react';
import type { ComponentType } from 'react';
import { 
  Briefcase, FileText, LogOut, User, AlertCircle,
  CheckCircle, XCircle, Calendar,
  ChevronRight, BookOpen, GraduationCap, Mail, Phone,
  Menu, X, Download, Filter, LayoutDashboard,
  Bell, ClipboardList, MapPin
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import JobApplicationForm from './JobApplicationForm';
import type { Student, JobDrive, Application, Company, CustomQuestion } from '../../lib/database.types';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import StudentOffCampusJobs from "./StudentOffCampusJobs";
import NoticeBoard from '../common/NoticeBoard';

type JobDriveWithCompany = JobDrive & { company: Company; questions?: CustomQuestion[] };
type ApplicationWithJobDrive = Application & { job_drive: JobDrive & { company: Company } };
type JobFilters = { jobType: 'all' | 'INTERNSHIP' | 'PPO' | 'FULL_TIME'; minPackage: number };
type ApplicationFormData = {
  customResumeUrl?: string;
  customResumeName?: string;
  answers?: Record<string, string>;
};

type ActiveTab =
  | 'dashboard'
  | 'applications'
  | 'scheduled'
  | 'profile'
  | 'notices'
  | 'question-bank'
  | 'tpo-registration'
  | 'tracking'
  | 'off-campus';

type MenuItem = {
  id: ActiveTab;
  icon: ComponentType<{ className?: string }>;
  label: string;
};

// Sidebar Menu Items
const menuItems: MenuItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Companies Dashboard' },
  { id: 'applications', icon: Briefcase, label: 'Applied Company' },
  { id: 'scheduled', icon: Calendar, label: 'Scheduled Companies New' },
  { id: 'profile', icon: User, label: 'Fill Profile' },
  { id: 'notices', icon: Bell, label: 'Notices' },
  { id: 'question-bank', icon: BookOpen, label: 'Question Bank' },
  { id: 'tpo-registration', icon: ClipboardList, label: 'TPO Registration' },
  { id: 'tracking', icon: FileText, label: 'Application Tracking' },
  { id: 'off-campus', icon: MapPin, label: 'Off Campus Job' },
];

// Mobile-responsive dashboard with sidebar
export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const student = user as Student;
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [jobDrives, setJobDrives] = useState<JobDriveWithCompany[]>([]);
  const [applications, setApplications] = useState<ApplicationWithJobDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobDriveWithCompany | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<JobFilters>({
    jobType: 'all',
    minPackage: 0,
  });
  const [filteredJobs, setFilteredJobs] = useState<JobDriveWithCompany[]>([]);

  const loadJobDrives = useCallback(async () => {
    const response = await apiGet<{ data: JobDriveWithCompany[] }>(`/student/${student.id}/job-drives`);
    const jobDriveData = response.data || [];
    if (jobDriveData.length > 0) {
      const eligible = jobDriveData.filter((job) => {
        return (
          job.allowed_branches.includes(student.branch) &&
          job.allowed_batches.includes(student.batch_year) &&
          student.current_cgpa >= job.min_cgpa &&
          student.backlogs <= job.max_backlogs
        );
      });
      setJobDrives(eligible);
      setFilteredJobs(eligible);
    }
    if (jobDriveData.length === 0) {
      setJobDrives([]);
      setFilteredJobs([]);
    }
  }, [student.backlogs, student.batch_year, student.branch, student.current_cgpa, student.id]);

  const loadApplications = useCallback(async () => {
    const response = await apiGet<{ data: ApplicationWithJobDrive[] }>(`/student/${student.id}/applications`);
    setApplications(response.data || []);
  }, [student.id]);

  const applyFilters = useCallback(() => {
    let filtered = [...jobDrives];

    if (filters.jobType !== 'all') {
      filtered = filtered.filter(job => job.job_type === filters.jobType);
    }

    if (filters.minPackage > 0) {
      filtered = filtered.filter(job => (job.package_offered || 0) >= filters.minPackage);
    }

    setFilteredJobs(filtered);
  }, [filters, jobDrives]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadJobDrives(), loadApplications()]);
    setLoading(false);
  }, [loadApplications, loadJobDrives]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (jobDrives.length > 0) {
      applyFilters();
    }
  }, [applyFilters, jobDrives.length]);

  const handleApplyClick = (job: JobDriveWithCompany) => {
    setSelectedJob(job);
    setShowApplicationForm(true);
  };

  const handleApplicationSubmit = async (formData: ApplicationFormData) => {
    if (!selectedJob) return;

    if (student.is_blocked) {
      alert('You are blocked and cannot apply to job drives.');
      return;
    }

    if (!student.is_approved) {
      alert('Your account is not yet approved by admin.');
      return;
    }

    if (student.placement_status === 'FULL_TIME') {
      alert('You are already placed in a full-time position and cannot apply to more jobs.');
      return;
    }

    try {
      // Create application
      const response = await apiPost<{ success: boolean }>('/student/applications', {
        job_drive_id: selectedJob.id,
        student_id: student.id,
        custom_resume_url: formData.customResumeUrl,
        custom_resume_name: formData.customResumeName,
        answers: formData.answers || {},
      });
      if (!response.success) {
        throw new Error('Failed to submit');
      }

      alert('Application submitted successfully!');
      setShowApplicationForm(false);
      setSelectedJob(null);
      await loadApplications();
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPLIED': return 'bg-blue-100 text-blue-800';
      case 'SHORTLISTED': return 'bg-yellow-100 text-yellow-800';
      case 'INTERVIEW': return 'bg-purple-100 text-purple-800';
      case 'SELECTED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <JobList 
            jobs={filteredJobs}
            onApply={handleApplyClick}
            student={student}
            applications={applications}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            filters={filters}
            setFilters={setFilters}
          />
        );
      case 'applications':
        return <ApplicationList applications={applications} getStatusColor={getStatusColor} />;
      case 'profile':
        return <StudentProfile student={student} onUpdate={loadData} />;
      case 'off-campus':
        return <StudentOffCampusJobs />;
      case 'scheduled':
        return (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Scheduled Companies</h3>
            <p className="text-gray-600">No scheduled companies yet</p>
          </div>
        );
      case 'notices':
        return <NoticeBoard />;
      case 'question-bank':
        return (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Question Bank</h3>
            <p className="text-gray-600">No questions available</p>
          </div>
        );
      case 'tpo-registration':
        return <StudentProfile student={student} onUpdate={loadData} showAsRegistration={true} />;
      case 'tracking':
        return (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Application Tracking</h3>
            <p className="text-gray-600">Tracking updates will appear here</p>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200 lg:z-30">
        {/* Student Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{student.full_name}</h3>
              <p className="text-xs text-gray-500 truncate">{student.prn}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                  {activeTab === item.id && <ChevronRight className="w-4 h-4" />}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900">{student.full_name}</span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">Menu</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* Mobile Student Info */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{student.full_name}</h3>
                  <p className="text-xs text-gray-500">{student.prn}</p>
                </div>
              </div>
            </div>

            {/* Mobile Navigation */}
            <nav className="py-4">
              <ul className="space-y-1 px-2">
                {menuItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${
                        activeTab === item.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm font-medium text-left">{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Blocked Banner */}
      {student.is_blocked && (
        <div className="lg:pl-64">
          <div className="bg-red-50 border-b border-red-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">
                  Your account is blocked: {student.block_reason?.replace('_', ' ')}
                  {student.block_remark && ` - ${student.block_remark}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
          {renderContent()}
        </div>
      </main>

      {/* Application Form Modal */}
      {showApplicationForm && selectedJob && (
        <JobApplicationForm
          jobId={selectedJob.id}
          jobTitle={selectedJob.title}
          companyName={selectedJob.company?.name || ''}
          questions={selectedJob.questions || []}
          studentId={student.id}
          onClose={() => {
            setShowApplicationForm(false);
            setSelectedJob(null);
          }}
          onSubmit={handleApplicationSubmit}
        />
      )}
    </div>
  );
}

// Job List Component
function JobList({
  jobs, onApply, student, applications, showFilters, setShowFilters, filters, setFilters 
}: { 
  jobs: JobDriveWithCompany[];
  onApply: (job: JobDriveWithCompany) => void;
  student: Student;
  applications: ApplicationWithJobDrive[];
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  filters: JobFilters;
  setFilters: (filters: JobFilters) => void;
}) {
  const appliedJobIds = new Set(applications.map(a => a.job_drive_id));

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No job drives available</h3>
        <p className="text-gray-600">Check back later for new opportunities</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      >
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filter Jobs</span>
        {filters.jobType !== 'all' || filters.minPackage > 0 ? (
          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
            Active
          </span>
        ) : null}
      </button>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Filter Jobs</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Job Type</label>
              <select
                value={filters.jobType}
                onChange={(e) => setFilters({ ...filters, jobType: e.target.value as JobFilters['jobType'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Types</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="PPO">PPO</option>
                <option value="FULL_TIME">Full Time</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Minimum Package (LPA)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={filters.minPackage}
                onChange={(e) => setFilters({ ...filters, minPackage: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Enter amount"
              />
            </div>
            <button
              onClick={() => setFilters({ jobType: 'all', minPackage: 0 })}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Job Cards */}
      {jobs.map((job) => {
        const hasApplied = appliedJobIds.has(job.id);
        const isEligible = !student.is_blocked && student.is_approved;
        const canApply = isEligible && !hasApplied && student.placement_status !== 'FULL_TIME';

        return (
          <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all">
            <div className="p-4 sm:p-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between sm:justify-start sm:gap-3">
                    <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      job.job_type === 'INTERNSHIP' ? 'bg-blue-100 text-blue-800' :
                      job.job_type === 'PPO' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {job.job_type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{job.company?.name}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Package</p>
                  <p className="text-sm font-bold text-gray-900">{job.package_offered} LPA</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm text-gray-900 truncate">{job.location || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Min CGPA</p>
                  <p className="text-sm text-gray-900">{job.min_cgpa}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-500">Backlogs</p>
                  <p className="text-sm text-gray-900">{job.max_backlogs}</p>
                </div>
              </div>

              {/* Eligibility and Deadline */}
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Branches: {job.allowed_branches.join(', ')}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <GraduationCap className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Batches: {job.allowed_batches.join(', ')}</span>
                </div>
                <div className="flex items-center gap-2 text-orange-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Deadline: {new Date(job.application_end).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end">
                {hasApplied ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Applied</span>
                  </div>
                ) : canApply ? (
                  <button
                    onClick={() => onApply(job)}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span>Apply Now</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Not Eligible</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Application List Component
function ApplicationList({
  applications,
  getStatusColor
}: {
  applications: ApplicationWithJobDrive[];
  getStatusColor: (status: string) => string;
}) {
  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
        <p className="text-gray-600">Apply to job drives to see them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{app.job_drive?.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{app.job_drive?.company?.name}</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Applied On</p>
                    <p className="text-gray-900">{new Date(app.applied_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Package</p>
                    <p className="text-gray-900">{app.job_drive?.package_offered} LPA</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                </div>

                {app.custom_resume_url && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Resume Used</p>
                    <a
                      href={app.custom_resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      <Download className="w-3 h-3" />
                      {app.custom_resume_name || 'View Resume'}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Student Profile Component
function StudentProfile({
  student,
  onUpdate,
  showAsRegistration = false,
}: {
  student: Student;
  onUpdate: () => void;
  showAsRegistration?: boolean;
}) {
  const [editing, setEditing] = useState(showAsRegistration);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<Array<{ id: string; field_name: string; old_value: string | null; new_value: string | null; changed_at: string }>>([]);

  const [formData, setFormData] = useState({
    first_name: student.first_name || '',
    middle_name: student.middle_name || '',
    last_name: student.last_name || '',
    mother_name: student.mother_name || '',
    date_of_birth: student.date_of_birth || '',
    is_handicapped: !!student.is_handicapped,
    handicap_details: student.handicap_details || '',
    current_cgpa: student.current_cgpa,
    backlogs: student.backlogs,
    phone: student.phone,
    email: student.email,
    division: (student.division || 'A') as 'A' | 'B',
    tenth_percentage: student.tenth_percentage ?? 0,
    twelfth_percentage: student.twelfth_percentage ?? 0,
  });

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await apiGet<{ data: Array<{ id: string; field_name: string; old_value: string | null; new_value: string | null; changed_at: string }> }>(
          `/students/${student.id}/profile-history?limit=15`
        );
        setHistory(response.data || []);
      } catch (error) {
        console.error('Failed to load profile history', error);
      }
    };

    loadHistory();
  }, [student.id, saving]);

  const fieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      current_cgpa: 'CGPA',
      backlogs: 'Backlogs',
      tenth_percentage: '10th Percentage',
      twelfth_percentage: '12th Percentage',
      phone: 'Phone',
      email: 'Email',
      division: 'Division',
      first_name: 'First Name',
      middle_name: 'Middle Name',
      last_name: 'Last Name',
      mother_name: 'Mother Name',
      date_of_birth: 'Date of Birth',
      is_handicapped: 'Handicapped',
      handicap_details: 'Handicap Details',
    };
    return labels[field] || field;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.current_cgpa < 0 || formData.current_cgpa > 10) {
      alert('CGPA must be between 0 and 10');
      return;
    }

    if (formData.tenth_percentage < 0 || formData.tenth_percentage > 100) {
      alert('10th percentage must be between 0 and 100');
      return;
    }

    if (formData.twelfth_percentage < 0 || formData.twelfth_percentage > 100) {
      alert('12th percentage must be between 0 and 100');
      return;
    }

    setSaving(true);

    try {
      await apiPatch(`/students/${student.id}`, {
        data: {
          first_name: formData.first_name,
          middle_name: formData.middle_name,
          last_name: formData.last_name,
          mother_name: formData.mother_name,
          date_of_birth: formData.date_of_birth || null,
          is_handicapped: formData.is_handicapped,
          handicap_details: formData.is_handicapped ? formData.handicap_details : null,
          current_cgpa: formData.current_cgpa,
          backlogs: formData.backlogs,
          phone: formData.phone,
          email: formData.email,
          division: formData.division,
          tenth_percentage: formData.tenth_percentage,
          twelfth_percentage: formData.twelfth_percentage,
        },
      });
      setEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update profile', error);
      alert('Failed to update profile');
    }

    setSaving(false);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{showAsRegistration ? 'TPO Registration' : 'Fill Profile'}</h2>
                <p className="text-sm text-gray-600">{student.prn}</p>
              </div>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                  <input value={formData.middle_name} onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mother Name</label>
                  <input value={formData.mother_name} onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Handicapped</label>
                  <select value={formData.is_handicapped ? 'yes' : 'no'} onChange={(e) => setFormData({ ...formData, is_handicapped: e.target.value === 'yes' })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                {formData.is_handicapped && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Handicap Details</label>
                    <input value={formData.handicap_details} onChange={(e) => setFormData({ ...formData, handicap_details: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Division</label>
                  <select value={formData.division} onChange={(e) => setFormData({ ...formData, division: e.target.value as 'A' | 'B' })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CGPA</label>
                  <input type="number" step="0.01" min="0" max="10" value={formData.current_cgpa} onChange={(e) => setFormData({ ...formData, current_cgpa: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">10th Percentage</label>
                  <input type="number" step="0.01" min="0" max="100" value={formData.tenth_percentage} onChange={(e) => setFormData({ ...formData, tenth_percentage: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">12th Percentage</label>
                  <input type="number" step="0.01" min="0" max="100" value={formData.twelfth_percentage} onChange={(e) => setFormData({ ...formData, twelfth_percentage: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Backlogs</label>
                  <input type="number" min="0" value={formData.backlogs} onChange={(e) => setFormData({ ...formData, backlogs: parseInt(e.target.value, 10) || 0 })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button type="button" onClick={() => setEditing(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <p><span className="text-gray-500">Name:</span> {student.first_name || '-'} {student.middle_name || ''} {student.last_name || ''}</p>
              <p><span className="text-gray-500">Mother Name:</span> {student.mother_name || '-'}</p>
              <p><span className="text-gray-500">Date of Birth:</span> {student.date_of_birth || '-'}</p>
              <p><span className="text-gray-500">Handicapped:</span> {student.is_handicapped ? 'Yes' : 'No'}</p>
              <p><span className="text-gray-500">Handicap Details:</span> {student.handicap_details || '-'}</p>
              <p><span className="text-gray-500">Email:</span> {student.email}</p>
              <p><span className="text-gray-500">Phone:</span> {student.phone}</p>
              <p><span className="text-gray-500">Branch:</span> {student.branch}</p>
              <p><span className="text-gray-500">Division:</span> {student.division || '-'}</p>
              <p><span className="text-gray-500">Passout Year:</span> {student.graduation_year}</p>
              <p><span className="text-gray-500">CGPA:</span> {student.current_cgpa}</p>
              <p><span className="text-gray-500">Backlogs:</span> {student.backlogs}</p>
              <p><span className="text-gray-500">10th Percentage:</span> {student.tenth_percentage ?? '-'}</p>
              <p><span className="text-gray-500">12th Percentage:</span> {student.twelfth_percentage ?? '-'}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Last Profile Updates</h3>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500">No edits yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => (
              <div key={entry.id} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-sm font-medium text-gray-900">
                  {fieldLabel(entry.field_name)}: {entry.old_value ?? '-'} → {entry.new_value ?? '-'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(entry.changed_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
