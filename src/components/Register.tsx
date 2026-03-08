import { useMemo, useState } from 'react';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { registerStudent } from '../lib/auth';
import type { Branch } from '../lib/database.types';

interface RegisterProps {
  onBackToLogin: () => void;
}

type Division = 'A' | 'B';

const BRANCH_OPTIONS: Array<{ value: Branch; label: string; divisions: Division[] }> = [
  { value: 'COMPUTER', label: 'CS (A, B)', divisions: ['A', 'B'] },
  { value: 'IT', label: 'IT (A, B)', divisions: ['A', 'B'] },
  { value: 'AIDS', label: 'AIDS (A, B)', divisions: ['A', 'B'] },
  { value: 'ENTC', label: 'E&TC (A, B)', divisions: ['A', 'B'] },
  { value: 'ELECTRICAL', label: 'Electrical', divisions: ['A'] },
  { value: 'INSTRUMENTATION', label: 'Instrumentation', divisions: ['A'] },
];

export default function Register({ onBackToLogin }: RegisterProps) {
  const currentYear = new Date().getFullYear();
  const minPassoutYear = 2027;
  const passoutStart = Math.max(currentYear, minPassoutYear);

  const [formData, setFormData] = useState({
    prn: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    email: '',
    phone: '',
    branch: 'COMPUTER' as Branch,
    division: 'A' as Division,
    batch_year: currentYear,
    graduation_year: passoutStart,
    current_cgpa: 0,
    tenth_percentage: 0,
    twelfth_percentage: 0,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedBranch = useMemo(
    () => BRANCH_OPTIONS.find((b) => b.value === formData.branch) || BRANCH_OPTIONS[0],
    [formData.branch]
  );

  const passoutYears = Array.from({ length: 8 }, (_, i) => passoutStart + i);
  const batchYears = Array.from({ length: 6 }, (_, i) => currentYear - 3 + i);

  const handleBranchChange = (branch: Branch) => {
    const next = BRANCH_OPTIONS.find((b) => b.value === branch) || BRANCH_OPTIONS[0];
    const nextDivision = next.divisions.includes(formData.division) ? formData.division : 'A';
    setFormData({ ...formData, branch, division: nextDivision });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.graduation_year < minPassoutYear) {
      setError(`Only passout year ${minPassoutYear} and above is allowed`);
      return;
    }

    if (formData.current_cgpa < 0 || formData.current_cgpa > 10) {
      setError('CGPA must be between 0 and 10');
      return;
    }

    if (formData.tenth_percentage < 0 || formData.tenth_percentage > 100) {
      setError('10th percentage must be between 0 and 100');
      return;
    }

    if (formData.twelfth_percentage < 0 || formData.twelfth_percentage > 100) {
      setError('12th percentage must be between 0 and 100');
      return;
    }

    if (!selectedBranch.divisions.includes(formData.division)) {
      setError('Invalid division selected for branch');
      return;
    }

    setLoading(true);

    try {
      const response = await registerStudent({
        prn: formData.prn,
        password: formData.password,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        branch: formData.branch,
        division: formData.division,
        batch_year: formData.batch_year,
        graduation_year: formData.graduation_year,
        current_cgpa: formData.current_cgpa,
        tenth_percentage: formData.tenth_percentage,
        twelfth_percentage: formData.twelfth_percentage,
      });

      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your account has been created. Please wait for admin approval before logging in.
          </p>
          <button
            onClick={onBackToLogin}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <button
          onClick={onBackToLogin}
          className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Login
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Student Registration</h1>
            <p className="text-gray-600">Create your TPO portal account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PRN <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.prn}
                  onChange={(e) => setFormData({ ...formData, prn: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your PRN"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your phone"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch <span className="text-red-500">*</span></label>
                <select
                  required
                  value={formData.branch}
                  onChange={(e) => handleBranchChange(e.target.value as Branch)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {BRANCH_OPTIONS.map((branch) => (
                    <option key={branch.value} value={branch.value}>
                      {branch.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Division <span className="text-red-500">*</span></label>
                <select
                  required
                  value={formData.division}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value as Division })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {selectedBranch.divisions.map((division) => (
                    <option key={division} value={division}>
                      {division}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Year <span className="text-red-500">*</span></label>
                <select
                  required
                  value={formData.batch_year}
                  onChange={(e) => setFormData({ ...formData, batch_year: parseInt(e.target.value, 10) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {batchYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passout Year <span className="text-red-500">*</span></label>
                <select
                  required
                  value={formData.graduation_year}
                  onChange={(e) => setFormData({ ...formData, graduation_year: parseInt(e.target.value, 10) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {passoutYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current CGPA <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.01"
                  required
                  value={formData.current_cgpa}
                  onChange={(e) => setFormData({ ...formData, current_cgpa: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">10th Percentage <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  value={formData.tenth_percentage}
                  onChange={(e) => setFormData({ ...formData, tenth_percentage: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">12th Percentage <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                  value={formData.twelfth_percentage}
                  onChange={(e) => setFormData({ ...formData, twelfth_percentage: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm password"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                'Registering...'
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Register
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
