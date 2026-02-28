import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';

const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const StudentDashboard = lazy(() => import('./components/student/StudentDashboard'));

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, userType, isLoading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    // Check for hash in URL on initial load
    if (window.location.hash === '#register') {
      setShowRegister(true);
      window.location.hash = ''; // Clear the hash
    }

    // Handle hash changes
    const handleHashChange = () => {
      if (window.location.hash === '#register') {
        setShowRegister(true);
        window.location.hash = ''; // Clear the hash
      }
    };

    // Handle click events on register links
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' && target.getAttribute('href') === '#register') {
        e.preventDefault();
        setShowRegister(true);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    document.addEventListener('click', handleLinkClick);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  // Loading state with spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading portal...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    if (showRegister) {
      return (
        <Suspense fallback={<FullPageLoader label="Loading registration..." />}>
          <Register onBackToLogin={() => setShowRegister(false)} />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<FullPageLoader label="Loading login..." />}>
        <Login />
      </Suspense>
    );
  }

  // Logged in - show appropriate dashboard
  if (userType === 'admin') {
    return (
      <Suspense fallback={<FullPageLoader label="Loading admin dashboard..." />}>
        <AdminDashboard />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<FullPageLoader label="Loading student dashboard..." />}>
      <StudentDashboard />
    </Suspense>
  );
}

export default App;

function FullPageLoader({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">{label}</p>
      </div>
    </div>
  );
}