import { useState, useEffect } from 'react';
import { Users, Building2, Briefcase, FileText, LogOut, UserCheck, UserX, Award, Clock } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import StudentManagement from './StudentManagement';
import CompanyManagement from './CompanyManagement';
import JobDriveManagement from './JobDriveManagement';
import ApprovalRequests from './ApprovalRequests';
import { apiGet } from '../../lib/api';
import NoticeBoard from '../common/NoticeBoard';

interface DashboardMetrics {
  totalStudents: number;
  approvedStudents: number;
  blockedStudents: number;
  pendingRequests: number;
  placedStudents: number;
  internships: number;
  ppoCount: number;
  fullTimeCount: number;
  totalCompanies: number;
  activeJobs: number;
  totalApplications: number;
  batchStats: { batch: number; count: number }[];
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalStudents: 0,
    approvedStudents: 0,
    blockedStudents: 0,
    pendingRequests: 0,
    placedStudents: 0,
    internships: 0,
    ppoCount: 0,
    fullTimeCount: 0,
    totalCompanies: 0,
    activeJobs: 0,
    totalApplications: 0,
    batchStats: [],
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'companies' | 'jobs' | 'approvals'>('dashboard');
  const { logout } = useAuth();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    const result = await apiGet<{ metrics: {
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
      batch_stats: Array<{ batch: number; count: number }>;
    } | null }>('/admin/metrics');
    const row = result.metrics;

    if (!row) {
      console.error('Failed to load dashboard metrics');
      return;
    }

    setMetrics({
      totalStudents: row.total_students || 0,
      approvedStudents: row.approved_students || 0,
      blockedStudents: row.blocked_students || 0,
      pendingRequests: row.pending_requests || 0,
      placedStudents: row.placed_students || 0,
      internships: row.internships || 0,
      ppoCount: row.ppo_count || 0,
      fullTimeCount: row.full_time_count || 0,
      totalCompanies: row.total_companies || 0,
      activeJobs: row.active_jobs || 0,
      totalApplications: row.total_applications || 0,
      batchStats: row.batch_stats || [],
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'students':
        return <StudentManagement onUpdate={loadMetrics} />;
      case 'companies':
        return <CompanyManagement />;
      case 'jobs':
        return <JobDriveManagement />;
      case 'approvals':
        return <ApprovalRequests onUpdate={loadMetrics} />;
      default:
        return (
          <div className="space-y-6">
            <DashboardMetrics metrics={metrics} />
            <NoticeBoard isAdmin={true} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">TPO Admin Portal</h1>
                <p className="text-sm text-gray-600">AISSMS IOIT</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`whitespace-nowrap px-4 sm:px-6 py-4 font-medium transition-colors relative ${
                activeTab === 'dashboard'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Award className="w-5 h-5 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`whitespace-nowrap px-4 sm:px-6 py-4 font-medium transition-colors relative ${
                activeTab === 'approvals'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="w-5 h-5 inline mr-2" />
              Approval Requests
              {metrics.pendingRequests > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {metrics.pendingRequests}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`whitespace-nowrap px-4 sm:px-6 py-4 font-medium transition-colors ${
                activeTab === 'students'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-5 h-5 inline mr-2" />
              All Students
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`whitespace-nowrap px-4 sm:px-6 py-4 font-medium transition-colors ${
                activeTab === 'companies'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-5 h-5 inline mr-2" />
              Companies
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`whitespace-nowrap px-4 sm:px-6 py-4 font-medium transition-colors ${
                activeTab === 'jobs'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Briefcase className="w-5 h-5 inline mr-2" />
              Job Drives
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}

function DashboardMetrics({ metrics }: { metrics: DashboardMetrics }) {
  const statCards = [
    { label: 'Total Students', value: metrics.totalStudents, icon: Users, color: 'blue' },
    { label: 'Approved', value: metrics.approvedStudents, icon: UserCheck, color: 'green' },
    { label: 'Pending', value: metrics.pendingRequests, icon: Clock, color: 'yellow' },
    { label: 'Blocked', value: metrics.blockedStudents, icon: UserX, color: 'red' },
    { label: 'Placed Students', value: metrics.placedStudents, icon: Award, color: 'yellow' },
    { label: 'Internships', value: metrics.internships, icon: FileText, color: 'indigo' },
    { label: 'PPO', value: metrics.ppoCount, icon: FileText, color: 'purple' },
    { label: 'Full Time', value: metrics.fullTimeCount, icon: Briefcase, color: 'teal' },
    { label: 'Companies', value: metrics.totalCompanies, icon: Building2, color: 'orange' },
    { label: 'Active Drives', value: metrics.activeJobs, icon: Briefcase, color: 'cyan' },
    { label: 'Applications', value: metrics.totalApplications, icon: FileText, color: 'pink' },
  ];

  const colorClasses: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-600' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-600' },
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const colors = colorClasses[stat.color];
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${colors.text}`} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {metrics.batchStats.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Students per Batch</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {metrics.batchStats.map((stat) => (
              <div key={stat.batch} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stat.count}</div>
                <div className="text-sm text-gray-600 mt-1">Batch {stat.batch}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
