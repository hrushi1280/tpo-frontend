import { useEffect, useState } from 'react';
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  LogOut,
  UserCheck,
  UserX,
  Award,
  Clock,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

import { useAuth } from '../../context/useAuth';
import { apiGet } from '../../lib/api';
import StudentManagement from './StudentManagement';
import CompanyManagement from './CompanyManagement';
import JobDriveManagement from './JobDriveManagement';
import ApprovalRequests from './ApprovalRequests';
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

type AdminTab = 'dashboard' | 'students' | 'companies' | 'jobs' | 'approvals' | 'notices';

type MenuItem = {
  id: AdminTab;
  label: string;
  icon: typeof Award;
};

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Award },
  { id: 'approvals', label: 'Approval Requests', icon: Clock },
  { id: 'students', label: 'All Students', icon: Users },
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'jobs', label: 'Job Drives', icon: Briefcase },
  { id: 'notices', label: 'Notices', icon: FileText },
];

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
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    loadMetrics().catch(() => undefined);
  }, []);

  const loadMetrics = async () => {
    const result = await apiGet<{
      metrics: {
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
      } | null;
    }>('/admin/metrics');

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
      case 'notices':
        return <NoticeBoard isAdmin={true} />;
      default:
        return <DashboardMetricsPanel metrics={metrics} onOpenTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200 lg:z-30">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">TPO Admin</h1>
              <p className="text-xs text-gray-600">AISSMS IOIT</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative ${
                    activeTab === item.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                  {item.id === 'approvals' && metrics.pendingRequests > 0 && (
                    <span className="absolute top-2 right-9 bg-red-500 text-white text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                      {metrics.pendingRequests}
                    </span>
                  )}
                  {activeTab === item.id && <ChevronRight className="w-4 h-4" />}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <header className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900">TPO Admin Portal</h1>
            <p className="text-xs text-gray-600">AISSMS IOIT</p>
          </div>
          <button onClick={logout} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Logout">
            <LogOut className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">Menu</h2>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <nav className="py-4">
              <ul className="space-y-1 px-2">
                {menuItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left relative ${
                        activeTab === item.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.id === 'approvals' && metrics.pendingRequests > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                          {metrics.pendingRequests}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="lg:ml-72 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">{renderContent()}</main>
    </div>
  );
}

function DashboardMetricsPanel({
  metrics,
  onOpenTab,
}: {
  metrics: DashboardMetrics;
  onOpenTab: (tab: AdminTab) => void;
}) {
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

  const tabByLabel: Record<string, AdminTab> = {
    'Total Students': 'students',
    Approved: 'students',
    Pending: 'approvals',
    Blocked: 'students',
    Companies: 'companies',
    'Active Drives': 'jobs',
    Applications: 'jobs',
  };

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

  const exportSummaryCsv = () => {
    const lines = [
      'metric,value',
      ...statCards.map((c) => `"${c.label.replace(/"/g, '""')}",${c.value}`),
      '',
      'batch,count',
      ...metrics.batchStats.map((b) => `${b.batch},${b.count}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard_summary_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button
          onClick={exportSummaryCsv}
          className="px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Export Summary
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const colors = colorClasses[stat.color];
          return (
            <button
              key={stat.label}
              onClick={() => onOpenTab(tabByLabel[stat.label] || 'dashboard')}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${colors.text}`} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </button>
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
