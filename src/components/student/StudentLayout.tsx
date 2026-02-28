import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  User,
  Bell,
  BookOpen,
  ClipboardList,
  FileText,
  MapPin,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';

const menuItems = [
  { path: '/student/dashboard', icon: LayoutDashboard, label: 'Companies Dashboard' },
  { path: '/student/applications', icon: Briefcase, label: 'Applied Company' },
  { path: '/student/scheduled', icon: Calendar, label: 'Scheduled Companies New' },
  { path: '/student/profile', icon: User, label: 'Fill Profile' },
  { path: '/student/notices', icon: Bell, label: 'Notices' },
  { path: '/student/question-bank', icon: BookOpen, label: 'Question Bank' },
  { path: '/student/tpo-registration', icon: ClipboardList, label: 'TPO Registration' },
  { path: '/student/tracking', icon: FileText, label: 'Application Tracking' },
  { path: '/student/off-campus', icon: MapPin, label: 'Off Campus Job' },
];

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const student = user as { full_name?: string; prn?: string } | null;

  useEffect(() => {
    const handlePathChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePathChange);
    return () => window.removeEventListener('popstate', handlePathChange);
  }, []);

  const navigateTo = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigateTo('/login');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{student?.full_name || 'Student'}</h3>
              <p className="text-xs text-gray-500 truncate">{student?.prn || 'PRN'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => (
              <li key={item.path}>
                <button
                  type="button"
                  onClick={() => navigateTo(item.path)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all w-full text-left ${
                    currentPath === item.path ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${currentPath === item.path ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {currentPath === item.path && <ChevronRight className="w-4 h-4" />}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-900">{student?.full_name}</span>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closeMobileMenu} />
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">Menu</h2>
              <button onClick={closeMobileMenu} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{student?.full_name}</h3>
                  <p className="text-xs text-gray-500">{student?.prn}</p>
                </div>
              </div>
            </div>

            <nav className="py-4">
              <ul className="space-y-1 px-2">
                {menuItems.map((item) => (
                  <li key={item.path}>
                    <button
                      type="button"
                      onClick={() => {
                        navigateTo(item.path);
                        closeMobileMenu();
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left ${
                        currentPath === item.path ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
              <button
                onClick={() => {
                  handleLogout();
                  closeMobileMenu();
                }}
                className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-600">
            Select a student section from the sidebar menu.
          </div>
        </div>
      </main>
    </div>
  );
}
