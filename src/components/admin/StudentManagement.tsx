import { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, Download, CheckCircle, XCircle, Ban, Eye,
  ChevronDown, ChevronUp, AlertCircle,
  Award, UserCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { Student, Branch, PlacementStatus, BlockReason } from '../../lib/database.types';
import { apiGet, apiPatch } from '../../lib/api';

interface StudentManagementProps {
  onUpdate: () => void;
}

interface BlockFormData {
  reason: BlockReason;
  remark: string;
  duration: '1M' | '3M' | '6M' | '1Y' | 'PERMANENT';
}

interface PlacementFormData {
  studentId: string;
  placementType: 'FULL_TIME' | 'PPO' | 'INTERNSHIP';
  companyName: string;
  package?: number;
  blockUntilDate?: string;
}

interface PlacementUpdateData {
  placement_status: PlacementFormData['placementType'];
  placed_company_name: string;
  package_offered: number | null;
  placement_date: string;
  is_blocked?: boolean;
  block_reason?: BlockReason;
  block_type?: 'PERMANENT' | 'TEMPORARY';
  block_until?: string | null;
}

export default function StudentManagement({ onUpdate }: StudentManagementProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [placementData, setPlacementData] = useState<Partial<PlacementFormData>>({});
  const [blockData, setBlockData] = useState<BlockFormData>({ 
    reason: 'CHEATING', 
    remark: '',
    duration: '1M'
  });
  const [exportLoading, setExportLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [filters, setFilters] = useState({
    batch: 'all',
    branch: 'all',
    approved: 'all',
    blocked: 'all',
    placementStatus: 'all',
  });

  // Auto unblock expired students
  const autoUnblockExpired = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      await apiPatch('/students/auto-unblock', {
        data: {
          is_blocked: false,
          block_reason: null,
          block_remark: null,
          block_until: null,
          blocked_at: null,
        },
        where: {
          lt: { block_until: now },
          eq: { is_blocked: true },
        },
      });
    } catch (err) {
      console.error('Error auto-unblocking expired students:', err);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await autoUnblockExpired();

      const response = await apiGet<{ data: Student[] }>('/students');
      setStudents(response.data || []);
    } catch (err) {
      console.error('Error loading students:', err);
      setError('Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [autoUnblockExpired]);

  const applyFilters = useCallback(() => {
    try {
      let filtered = [...students];

      if (searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(
          (s) =>
            s.prn.toLowerCase().includes(term) ||
            s.full_name.toLowerCase().includes(term) ||
            s.email.toLowerCase().includes(term) ||
            s.phone?.toLowerCase().includes(term)
        );
      }

      if (filters.batch !== 'all') {
        filtered = filtered.filter((s) => s.batch_year.toString() === filters.batch);
      }

      if (filters.branch !== 'all') {
        filtered = filtered.filter((s) => s.branch === filters.branch);
      }

      if (filters.approved !== 'all') {
        filtered = filtered.filter((s) => s.is_approved === (filters.approved === 'true'));
      }

      if (filters.blocked !== 'all') {
        filtered = filtered.filter((s) => s.is_blocked === (filters.blocked === 'true'));
      }

      if (filters.placementStatus !== 'all') {
        filtered = filtered.filter((s) => s.placement_status === filters.placementStatus);
      }

      setFilteredStudents(filtered);
    } catch (err) {
      console.error('Error applying filters:', err);
      setError('Failed to apply filters.');
    }
  }, [students, searchTerm, filters]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleApprove = async (studentId: string) => {
    try {
      setActionLoading(studentId);
      setError(null);
      
      await apiPatch(`/students/${studentId}`, { data: { is_approved: true } });
      
      await loadStudents();
      onUpdate();
    } catch (err) {
      console.error('Error approving student:', err);
      setError('Failed to approve student. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePlacement = async () => {
    if (!placementData.studentId || !placementData.placementType || !placementData.companyName) return;

    try {
      setActionLoading(placementData.studentId);
      setError(null);

      const updateData: PlacementUpdateData = {
        placement_status: placementData.placementType,
        placed_company_name: placementData.companyName,
        package_offered: placementData.package || null,
        placement_date: new Date().toISOString(),
      };

      if (placementData.placementType === 'FULL_TIME') {
        updateData.is_blocked = true;
        updateData.block_reason = 'PLACED_FULL_TIME';
        updateData.block_type = 'PERMANENT';
        updateData.block_until = null;
      } else if (placementData.placementType === 'PPO' && placementData.blockUntilDate) {
        updateData.is_blocked = true;
        updateData.block_reason = 'PLACED_PPO';
        updateData.block_type = 'TEMPORARY';
        updateData.block_until = placementData.blockUntilDate;
      } else if (placementData.placementType === 'INTERNSHIP' && placementData.blockUntilDate) {
        updateData.is_blocked = true;
        updateData.block_reason = 'PLACED_INTERNSHIP';
        updateData.block_type = 'TEMPORARY';
        updateData.block_until = placementData.blockUntilDate;
      }

      await apiPatch(`/students/${placementData.studentId}`, { data: updateData });

      setShowPlacementModal(false);
      setPlacementData({});
      setSelectedStudent(null);
      await loadStudents();
      onUpdate();
    } catch (err) {
      console.error('Error updating placement:', err);
      setError('Failed to update placement. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlock = async () => {
    if (!selectedStudent) return;

    try {
      setActionLoading(selectedStudent.id);
      setError(null);

      let blockUntil: string | null = null;
      const now = new Date();

      switch (blockData.duration) {
        case '1M':
          now.setMonth(now.getMonth() + 1);
          blockUntil = now.toISOString();
          break;
        case '3M':
          now.setMonth(now.getMonth() + 3);
          blockUntil = now.toISOString();
          break;
        case '6M':
          now.setMonth(now.getMonth() + 6);
          blockUntil = now.toISOString();
          break;
        case '1Y':
          now.setFullYear(now.getFullYear() + 1);
          blockUntil = now.toISOString();
          break;
        case 'PERMANENT':
          blockUntil = null;
          break;
      }

      await apiPatch(`/students/${selectedStudent.id}`, {
        data: {
          is_blocked: true,
          block_reason: blockData.reason,
          block_remark: blockData.remark,
          block_until: blockUntil,
          block_type: blockData.duration === 'PERMANENT' ? 'PERMANENT' : 'TEMPORARY',
          blocked_at: new Date().toISOString(),
        },
      });
      
      setShowBlockModal(false);
      setSelectedStudent(null);
      setBlockData({ reason: 'CHEATING', remark: '', duration: '1M' });
      await loadStudents();
      onUpdate();
    } catch (err) {
      console.error('Error blocking student:', err);
      setError('Failed to block student. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblock = async (studentId: string) => {
    try {
      setActionLoading(studentId);
      setError(null);
      
      await apiPatch(`/students/${studentId}`, {
        data: {
          is_blocked: false,
          block_reason: null,
          block_remark: null,
          block_until: null,
          block_type: null,
          blocked_at: null,
        },
      });
      
      await loadStudents();
      onUpdate();
    } catch (err) {
      console.error('Error unblocking student:', err);
      setError('Failed to unblock student. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdrawPlacement = async (studentId: string) => {
    try {
      setActionLoading(studentId);
      setError(null);
      
      await apiPatch(`/students/${studentId}`, {
        data: {
          placement_status: 'NOT_PLACED',
          placed_company_name: null,
          package_offered: null,
          placement_date: null,
          is_blocked: false,
          block_reason: null,
          block_remark: null,
          block_until: null,
          block_type: null,
          blocked_at: null,
        },
      });
      
      await loadStudents();
      onUpdate();
    } catch (err) {
      console.error('Error withdrawing placement:', err);
      setError('Failed to withdraw placement. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const getBlockReasonText = (reason: string | null | undefined): string => {
    switch (reason) {
      case 'PLACED_FULL_TIME': return 'Placed (Full Time)';
      case 'PLACED_PPO': return 'Placed (PPO)';
      case 'PLACED_INTERNSHIP': return 'Placed (Internship)';
      case 'CHEATING': return 'Cheating';
      case 'FAKE_DOCUMENTS': return 'Fake Documents';
      case 'MISCONDUCT': return 'Misconduct';
      case 'LOW_CGPA': return 'Low CGPA';
      case 'OTHER': return 'Other';
      default: return reason || 'Unknown';
    }
  };

  const exportToExcel = async () => {
    try {
      setExportLoading(true);
      setError(null);

      const excelData = filteredStudents.map((s, index) => ({
        'S.No': index + 1,
        'PRN': s.prn,
        'Name': s.full_name,
        'Email': s.email,
        'Phone': s.phone || '',
        'Branch': s.branch,
        'Batch': s.batch_year,
        'CGPA': s.current_cgpa,
        'Backlogs': s.backlogs,
        'Approved': s.is_approved ? 'Yes' : 'No',
        'Blocked': s.is_blocked ? 'Yes' : 'No',
        'Block Type': s.block_type || '',
        'Block Reason': getBlockReasonText(s.block_reason),
        'Block Until': s.block_until ? new Date(s.block_until).toLocaleDateString() : '',
        'Block Remark': s.block_remark || '',
        'Placement Status': s.placement_status.replace('_', ' '),
        'Company': s.placed_company_name || '',
        'Package (LPA)': s.package_offered || '',
        'Placement Date': s.placement_date ? new Date(s.placement_date).toLocaleDateString() : '',
        'Resume URL': s.resume_url || '',
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const colWidths = [
        { wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
        { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 8 },
        { wch: 10 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 20 },
        { wch: 18 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 30 },
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Students');
      XLSX.writeFile(wb, `students_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      setError('Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const batches = Array.from(new Set(students.map((s) => s.batch_year))).sort((a, b) => b - a);
  const branches: Branch[] = ['COMPUTER', 'IT', 'ENTC', 'MECHANICAL', 'CIVIL', 'INSTRUMENTATION'];
  const placementStatuses: PlacementStatus[] = ['NOT_PLACED', 'INTERNSHIP', 'PPO', 'FULL_TIME'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage student profiles, approvals, and placements
          </p>
        </div>
        <button
          onClick={exportToExcel}
          disabled={exportLoading || filteredStudents.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exportLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Export to Excel
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm flex-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by PRN, name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 bg-gray-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <select
              value={filters.batch}
              onChange={(e) => setFilters({ ...filters, batch: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Batches</option>
              {batches.map((batch) => (
                <option key={batch} value={batch}>
                  Batch {batch}
                </option>
              ))}
            </select>

            <select
              value={filters.branch}
              onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Branches</option>
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>

            <select
              value={filters.approved}
              onChange={(e) => setFilters({ ...filters, approved: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="true">Approved</option>
              <option value="false">Pending</option>
            </select>

            <select
              value={filters.blocked}
              onChange={(e) => setFilters({ ...filters, blocked: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Block Status</option>
              <option value="true">Blocked</option>
              <option value="false">Not Blocked</option>
            </select>

            <select
              value={filters.placementStatus}
              onChange={(e) => setFilters({ ...filters, placementStatus: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Placement</option>
              {placementStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Stats */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center gap-4 text-sm">
          <span className="text-gray-600">
            Showing <span className="font-medium">{filteredStudents.length}</span> of{' '}
            <span className="font-medium">{students.length}</span> students
          </span>
          <span className="text-gray-300 hidden sm:inline">|</span>
          <span className="text-gray-600">
            Approved: <span className="font-medium text-green-600">
              {filteredStudents.filter(s => s.is_approved).length}
            </span>
          </span>
          <span className="text-gray-300 hidden sm:inline">|</span>
          <span className="text-gray-600">
            Blocked: <span className="font-medium text-red-600">
              {filteredStudents.filter(s => s.is_blocked).length}
            </span>
          </span>
          <span className="text-gray-300 hidden sm:inline">|</span>
          <span className="text-gray-600">
            Placed: <span className="font-medium text-blue-600">
              {filteredStudents.filter(s => s.placement_status !== 'NOT_PLACED').length}
            </span>
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">PRN</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Branch</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Batch</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">CGPA</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Placement</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.prn}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{student.full_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{student.branch}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{student.batch_year}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{student.current_cgpa}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-col gap-1">
                      {student.is_approved ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                      {student.is_blocked && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Blocked
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          student.placement_status === 'NOT_PLACED'
                            ? 'bg-gray-100 text-gray-800'
                            : student.placement_status === 'INTERNSHIP'
                            ? 'bg-blue-100 text-blue-800'
                            : student.placement_status === 'PPO'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {student.placement_status.replace('_', ' ')}
                      </span>
                      {student.placed_company_name && (
                        <span className="text-xs text-gray-600 mt-1">
                          {student.placed_company_name}
                          {student.package_offered && ` (${student.package_offered} LPA)`}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {!student.is_approved && (
                        <button
                          onClick={() => handleApprove(student.id)}
                          disabled={actionLoading === student.id}
                          className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                          title="Approve"
                        >
                          {actionLoading === student.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                          ) : (
                            <CheckCircle className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      
                      {student.placement_status === 'NOT_PLACED' ? (
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setPlacementData({ studentId: student.id });
                            setShowPlacementModal(true);
                          }}
                          className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                          title="Mark as Placed"
                        >
                          <Award className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleWithdrawPlacement(student.id)}
                          disabled={actionLoading === student.id}
                          className="p-1 text-orange-600 hover:bg-orange-50 rounded disabled:opacity-50"
                          title="Withdraw Placement"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}

                      {!student.is_blocked ? (
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowBlockModal(true);
                          }}
                          disabled={actionLoading === student.id}
                          className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                          title="Block"
                        >
                          <Ban className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnblock(student.id)}
                          disabled={actionLoading === student.id}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                          title="Unblock"
                        >
                          {actionLoading === student.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Placement Modal */}
      {showPlacementModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Mark Student as Placed</h3>
            <p className="text-gray-600 mb-4">
              {selectedStudent.full_name} ({selectedStudent.prn})
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Placement Type *</label>
                <select
                  value={placementData.placementType || ''}
                  onChange={(e) => setPlacementData({ 
                    ...placementData, 
                    placementType: e.target.value as 'FULL_TIME' | 'PPO' | 'INTERNSHIP' 
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Type</option>
                  <option value="FULL_TIME">Full Time (Permanent Block)</option>
                  <option value="PPO">PPO (Temporary Block)</option>
                  <option value="INTERNSHIP">Internship (Temporary Block)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                <input
                  type="text"
                  value={placementData.companyName || ''}
                  onChange={(e) => setPlacementData({ ...placementData, companyName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., TCS, Infosys"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Package (LPA)</label>
                <input
                  type="number"
                  step="0.1"
                  value={placementData.package || ''}
                  onChange={(e) => setPlacementData({ ...placementData, package: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional"
                />
              </div>

              {(placementData.placementType === 'PPO' || placementData.placementType === 'INTERNSHIP') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {placementData.placementType === 'PPO' ? 'PPO Block Until' : 'Internship End Date'} *
                  </label>
                  <input
                    type="date"
                    value={placementData.blockUntilDate || ''}
                    onChange={(e) => setPlacementData({ ...placementData, blockUntilDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPlacementModal(false);
                  setSelectedStudent(null);
                  setPlacementData({});
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePlacement}
                disabled={!placementData.placementType || !placementData.companyName}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {showBlockModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Block Student</h3>
            <p className="text-gray-600 mb-4">
              Block <span className="font-medium">{selectedStudent.full_name}</span> ({selectedStudent.prn})
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration *</label>
                <select
                  value={blockData.duration}
                  onChange={(e) => setBlockData({ ...blockData, duration: e.target.value as BlockFormData['duration'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1M">1 Month</option>
                  <option value="3M">3 Months</option>
                  <option value="6M">6 Months</option>
                  <option value="1Y">1 Year</option>
                  <option value="PERMANENT">Permanent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                <select
                  value={blockData.reason}
                  onChange={(e) => setBlockData({ ...blockData, reason: e.target.value as BlockReason })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="CHEATING">Cheating</option>
                  <option value="FAKE_DOCUMENTS">Fake Documents</option>
                  <option value="MISCONDUCT">Misconduct</option>
                  <option value="LOW_CGPA">Low CGPA</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                <textarea
                  value={blockData.remark}
                  onChange={(e) => setBlockData({ ...blockData, remark: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any additional remarks..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  setSelectedStudent(null);
                  setBlockData({ reason: 'CHEATING', remark: '', duration: '1M' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBlock}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Block Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && !showBlockModal && !showPlacementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedStudent(null)}>
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Student Details</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">PRN</p>
                <p className="font-medium text-gray-900">{selectedStudent.prn}</p>
              </div>
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{selectedStudent.full_name}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Email</p>
                <p className="text-gray-900">{selectedStudent.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="text-gray-900">{selectedStudent.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Branch</p>
                <p className="text-gray-900">{selectedStudent.branch}</p>
              </div>
              <div>
                <p className="text-gray-500">Batch</p>
                <p className="text-gray-900">{selectedStudent.batch_year}</p>
              </div>
              <div>
                <p className="text-gray-500">CGPA</p>
                <p className="text-gray-900">{selectedStudent.current_cgpa}</p>
              </div>
              <div>
                <p className="text-gray-500">Backlogs</p>
                <p className="text-gray-900">{selectedStudent.backlogs}</p>
              </div>
              <div>
                <p className="text-gray-500">Placement Status</p>
                <p className="text-gray-900">{selectedStudent.placement_status.replace('_', ' ')}</p>
              </div>
              {selectedStudent.placed_company_name && (
                <div>
                  <p className="text-gray-500">Company</p>
                  <p className="text-gray-900">{selectedStudent.placed_company_name}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedStudent(null)}
              className="mt-6 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
