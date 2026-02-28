import { useState } from 'react';
import { LogIn, UserCircle, Shield, CheckSquare } from 'lucide-react';
import { loginStudent, loginAdmin } from '../lib/auth';
import { useAuth } from '../context/useAuth';

export default function Login() {
  const [mode, setMode] = useState<'student' | 'admin'>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNotRobot, setIsNotRobot] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedIdentifier =
      mode === 'admin'
        ? identifier.trim().toLowerCase()
        : identifier.trim().toUpperCase();

    if (!isNotRobot) {
      setError('Please confirm you are not a robot');
      return;
    }

    if (!trimmedIdentifier || !password) {
      setError(
        `Please enter ${mode === 'student' ? 'PRN' : 'email'} and password`
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        mode === 'student'
          ? await loginStudent(trimmedIdentifier, password)
          : await loginAdmin(trimmedIdentifier, password);

      if (!response.success || !response.user || !response.userType) {
        setError(response.message || 'Invalid credentials');
        return;
      }

      login(response.user, response.userType);
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/Revised_updated_ioit_logo_jpg_(1).jpg"
            alt="AISSMS IOIT Logo"
            className="h-28 mx-auto mb-4 object-contain"
          />
          <h1 className="text-xl font-bold text-gray-900">
            AISSMS IOIT
          </h1>
          <p className="text-sm text-blue-600 font-semibold">
            Training & Placement Portal
          </p>
        </div>

        {/* Mode Switch */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('student')}
            className={`flex-1 py-3 rounded-lg font-medium transition ${
              mode === 'student'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <UserCircle className="w-5 h-5 inline mr-2" />
            Student
          </button>

          <button
            onClick={() => setMode('admin')}
            className={`flex-1 py-3 rounded-lg font-medium transition ${
              mode === 'admin'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Shield className="w-5 h-5 inline mr-2" />
            Admin
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Identifier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {mode === 'student' ? 'PRN' : 'Email'}
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={
                mode === 'student'
                  ? 'Enter your PRN'
                  : 'Enter your email'
              }
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter your password"
            />
          </div>

          {/* Fake Captcha */}
          <button
            type="button"
            onClick={() => setIsNotRobot(!isNotRobot)}
            className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${
              isNotRobot
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300'
            }`}
          >
            <CheckSquare
              className={`w-5 h-5 ${
                isNotRobot ? 'text-blue-600' : 'text-gray-400'
              }`}
            />
            <span className="text-sm">I am not a robot</span>
          </button>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-blue-400"
          >
            {loading ? 'Logging in...' : (
              <>
                <LogIn className="w-5 h-5 inline mr-2" />
                Login
              </>
            )}
          </button>
        </form>

        {/* Register Link - Only show for student mode */}
        {mode === 'student' && (
          <div className="text-center mt-6 pt-4 border-t border-gray-200">
            <p className="text-gray-600 mb-3">New Student? Register here</p>
            <a 
              href="#register" 
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <UserCircle className="w-5 h-5" />
              Create New Account
            </a>
            <p className="text-xs text-gray-500 mt-3">
              After registration, wait for admin approval
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          For support, contact TPO office
        </div>
      </div>
    </div>
  );
}
