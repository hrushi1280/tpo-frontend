import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Eye, Search, UserCheck, Mail, Phone, BookOpen, GraduationCap, Calendar, Award, X } from 'lucide-react';
import type { Student } from '../../lib/database.types';
import { apiDelete, apiGet, apiPatch } from '../../lib/api';

interface ApprovalRequestsProps {
  onUpdate: () => void;
}

export default function ApprovalRequests({ onUpdate }: ApprovalRequestsProps) {
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadPendingStudents = useCallback(async () => {
    setLoading(true);
    const response = await apiGet<{ data: Student[] }>('/students/pending');
    setPendingStudents(response.data || []);
    setFilteredStudents(response.data || []);
    setLoading(false);
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...pendingStudents];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.prn.toLowerCase().includes(term) ||
          s.full_name.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term) ||
          s.branch.toLowerCase().includes(term)
      );
    }

    setFilteredStudents(filtered);
  }, [pendingStudents, searchTerm]);

  useEffect(() => {
    loadPendingStudents();
  }, [loadPendingStudents]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleApprove = async (studentId: string) => {
    setProcessing(studentId);
    const updatePayload = {
      data: { 
        is_approved: true,
        updated_at: new Date().toISOString()
      },
    };
    try {
      await apiPatch(`/students/${studentId}`, updatePayload);

      await loadPendingStudents();
      onUpdate();
      if (selectedStudent?.id === studentId) {
        setSelectedStudent(null);
      }
    } catch (error) {
      console.error('Approval failed:', error);
    }
    setProcessing(null);
  };

  const handleReject = async (studentId: string) => {
    if (!confirm('Are you sure you want to reject this registration?')) return;
    
    setProcessing(studentId);
    try {
      await apiDelete(`/students/${studentId}`);
      await loadPendingStudents();
      onUpdate();
      if (selectedStudent?.id === studentId) {
        setSelectedStudent(null);
      }
    } catch (error) {
      console.error('Reject failed:', error);
    }
    setProcessing(null);
  };

  const viewStudentDetails = (student: Student) => {
    setSelectedStudent(student);
  };

  const closeModal = () => {
    setSelectedStudent(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Approval Requests</h2>
          <p className="text-gray-600 mt-1">
            {pendingStudents.length} pending registration{pendingStudents.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by PRN, name, email, or branch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-200 text-center">
          <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Pending Requests</h3>
          <p className="text-gray-600">All student registrations have been processed</p>
        </div>
      ) : (
        /* Grid Layout - 3 cards per row */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div 
              key={student.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Card Content */}
              <div className="p-6">
                {/* Profile Initial Avatar */}
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-2xl">
                      {student.full_name.charAt(0)}
                    </span>
                  </div>
                </div>

                {/* Student Basic Info */}
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{student.full_name}</h3>
                  <p className="text-sm text-gray-600 font-mono">{student.prn}</p>
                </div>

                {/* Status Badge */}
                <div className="flex justify-center mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending Approval
                  </span>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <BookOpen className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                    <span className="text-xs text-gray-600">Branch</span>
                    <p className="font-medium text-gray-900 truncate">{student.branch}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <GraduationCap className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                    <span className="text-xs text-gray-600">Batch</span>
                    <p className="font-medium text-gray-900">{student.batch_year}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <Award className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                    <span className="text-xs text-gray-600">CGPA</span>
                    <p className="font-medium text-gray-900">{student.current_cgpa ?? '-'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <Award className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                    <span className="text-xs text-gray-600">Backlogs</span>
                    <p className="font-medium text-gray-900">{student.backlogs ?? '-'}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(student.id)}
                    disabled={processing === student.id}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {processing === student.id ? '...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => viewStudentDetails(student)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleReject(student.id)}
                    disabled={processing === student.id}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400 text-sm font-medium"
                  >
                    <XCircle className="w-4 h-4" />
                    {processing === student.id ? '...' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Student Details</h3>
              <button
                onClick={closeModal}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {selectedStudent.full_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{selectedStudent.full_name}</h4>
                  <p className="text-sm text-gray-600">{selectedStudent.prn}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    Personal Information
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm text-gray-900 flex items-center gap-2">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {selectedStudent.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm text-gray-900 flex items-center gap-2">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {selectedStudent.phone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-green-600" />
                    Academic Information
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Branch</p>
                      <p className="text-sm font-medium text-gray-900">{selectedStudent.branch}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Division</p>
                      <p className="text-sm text-gray-900">{selectedStudent.division || 'A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Batch Year</p>
                      <p className="text-sm text-gray-900">{selectedStudent.batch_year}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Graduation Year</p>
                      <p className="text-sm text-gray-900">{selectedStudent.graduation_year}</p>
                    </div>
                  </div>
                </div>

                {/* Performance Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-600" />
                    Performance
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Current CGPA</p>
                      <p className="text-sm font-medium text-gray-900">{selectedStudent.current_cgpa ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">10th Percentage</p>
                      <p className="text-sm text-gray-900">{selectedStudent.tenth_percentage ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">12th Percentage</p>
                      <p className="text-sm text-gray-900">{selectedStudent.twelfth_percentage ?? '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Backlogs</p>
                      <p className="text-sm text-gray-900">{selectedStudent.backlogs ?? '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Registration Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    Registration Details
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Registered On</p>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedStudent.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                {(selectedStudent.resume_url || selectedStudent.profile_photo_url) && (
                  <div className="md:col-span-2 bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-3">Additional Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedStudent.resume_url && (
                        <a 
                          href={selectedStudent.resume_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                        >
                          <span>📄</span> View Resume
                        </a>
                      )}
                      {selectedStudent.profile_photo_url && (
                        <a 
                          href={selectedStudent.profile_photo_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                        >
                          <span>🖼️</span> View Profile Photo
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Action Buttons */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleApprove(selectedStudent.id)}
                  disabled={processing === selectedStudent.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
                >
                  <CheckCircle className="w-4 h-4" />
                  {processing === selectedStudent.id ? 'Processing...' : 'Approve Student'}
                </button>
                <button
                  onClick={() => handleReject(selectedStudent.id)}
                  disabled={processing === selectedStudent.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-400"
                >
                  <XCircle className="w-4 h-4" />
                  {processing === selectedStudent.id ? 'Processing...' : 'Reject Student'}
                </button>
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
