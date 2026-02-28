import { useState } from 'react';
import { 
  Mail, Phone, BookOpen, GraduationCap, Award,
  Calendar, Edit2, Save, X, AlertCircle,
  CheckCircle, Briefcase, FileText, Download, Upload 
} from 'lucide-react';
import type { Student } from '../../lib/database.types';
import { apiPatch, apiUpload } from '../../lib/api';

interface StudentProfileProps {
  student: Student;
  onUpdate: () => void;
}

export default function StudentProfile({ student, onUpdate }: StudentProfileProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  
  const [formData, setFormData] = useState({
    current_cgpa: student.current_cgpa,
    backlogs: student.backlogs,
    phone: student.phone,
    email: student.email,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      await apiPatch(`/students/${student.id}`, {
        data: {
          current_cgpa: formData.current_cgpa,
          backlogs: formData.backlogs,
          phone: formData.phone,
          email: formData.email,
        },
      });
      setSuccess('Profile updated successfully!');
      setEditing(false);
      onUpdate();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to update profile. Please try again.');
      console.error('Update error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Please upload PDF files only.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB.');
      return;
    }

    setUploadingResume(true);
    setError(null);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('bucket', 'resumes');
      form.append('folder', 'resumes');
      form.append('prefix', `${student.prn}_resume_${Date.now()}`);
      const upload = await apiUpload<{ success: boolean; publicUrl: string }>('/files/upload', form);
      await apiPatch(`/students/${student.id}`, { data: { resume_url: upload.publicUrl } });

      setSuccess('Resume uploaded successfully!');
      onUpdate();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error uploading resume:', error);
      setError('Failed to upload resume. Please try again.');
    } finally {
      setUploadingResume(false);
    }
  };

  const getPlacementStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_PLACED': return 'bg-gray-100 text-gray-800';
      case 'INTERNSHIP': return 'bg-blue-100 text-blue-800';
      case 'PPO': return 'bg-purple-100 text-purple-800';
      case 'FULL_TIME': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      {/* Success Message */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header with Cover */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-800 relative">
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {student.full_name.charAt(0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-16 p-6">
          {/* Header with Edit Button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{student.full_name}</h2>
              <p className="text-sm text-gray-600 mt-1">{student.prn}</p>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:w-auto w-full"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>

          {/* Profile Content */}
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CGPA <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={formData.current_cgpa}
                    onChange={(e) => setFormData({ ...formData, current_cgpa: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Backlogs <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.backlogs}
                    onChange={(e) => setFormData({ ...formData, backlogs: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm text-gray-900">{student.email}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm text-gray-900">{student.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Branch</p>
                      <p className="text-sm text-gray-900">{student.branch}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <GraduationCap className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Batch</p>
                      <p className="text-sm text-gray-900">{student.batch_year}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">CGPA</p>
                      <p className="text-sm font-semibold text-gray-900">{student.current_cgpa}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Backlogs</p>
                      <p className="text-sm font-semibold text-gray-900">{student.backlogs}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resume Section */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Resume</h3>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleResumeUpload}
                      className="hidden"
                      id="resume-upload"
                      disabled={uploadingResume}
                    />
                    <label
                      htmlFor="resume-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm cursor-pointer disabled:opacity-50"
                    >
                      {uploadingResume ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload New Resume
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {student.resume_url ? (
                  <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Current Resume</p>
                        <p className="text-xs text-blue-700">Uploaded resume is active</p>
                      </div>
                    </div>
                    <a
                      href={student.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      View
                    </a>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">No resume uploaded yet</p>
                    <p className="text-sm text-gray-500">Upload your resume to apply for jobs</p>
                  </div>
                )}
              </div>

              {/* Placement Status */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Placement Status</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Current Status</p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${getPlacementStatusColor(student.placement_status)}`}>
                          {student.placement_status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {student.placed_company_name && (
                      <div className="sm:text-right">
                        <p className="text-xs text-gray-500">Placed at</p>
                        <p className="text-sm font-medium text-gray-900">{student.placed_company_name}</p>
                        {student.package_offered && (
                          <p className="text-xs text-gray-600 mt-1">Package: {student.package_offered} LPA</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Member Since</p>
                    <p className="text-gray-900">{new Date(student.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Last Login</p>
                    <p className="text-gray-900">
                      {student.last_login ? new Date(student.last_login).toLocaleString() : 'Never'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Graduation Year</p>
                    <p className="text-gray-900">{student.graduation_year}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Account Status</p>
                    <p className="text-green-600 font-medium">Active</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
