import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Download, Upload, X, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { JobDrive, Company, Branch, JobType, Application, Student } from '../../lib/database.types';
import { apiDelete, apiGet, apiPatch, apiPost, apiUpload } from '../../lib/api';

type JobDriveWithMeta = JobDrive & { company: Company; applications: { count: number }[] };
type ApplicationWithStudent = Application & { student: Student };

export default function JobDriveManagement() {
  const [jobDrives, setJobDrives] = useState<JobDriveWithMeta[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobDrive | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Applications Modal States
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobDrive | null>(null);
  const [applications, setApplications] = useState<ApplicationWithStudent[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [exportingApplications, setExportingApplications] = useState(false);
  const [applicationsPage, setApplicationsPage] = useState(0);
  const [hasMoreApplications, setHasMoreApplications] = useState(false);
  const applicationsPageSize = 200;

  const [formData, setFormData] = useState({
    company_id: '',
    title: '',
    job_type: 'FULL_TIME' as JobType,
    description: '',
    jd_file_url: '',
    allowed_branches: [] as Branch[],
    allowed_batches: [] as number[],
    min_cgpa: 6.0,
    max_backlogs: 0,
    package_offered: 0,
    location: '',
    application_start: '',
    application_end: '',
  });

  const branches: Branch[] = ['COMPUTER', 'IT', 'ENTC', 'MECHANICAL', 'CIVIL', 'INSTRUMENTATION'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  useEffect(() => {
    loadJobDrives();
    loadCompanies();
  }, []);

  const loadJobDrives = async () => {
    setLoading(true);
    const response = await apiGet<{ data: JobDriveWithMeta[] }>('/job-drives');
    setJobDrives(response.data || []);
    setLoading(false);
  };

  const loadCompanies = async () => {
    const response = await apiGet<{ data: Company[] }>('/companies');
    const sorted = [...(response.data || [])].sort((a, b) => a.name.localeCompare(b.name));
    setCompanies(sorted);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload PDF, PPT, PPTX, DOC, or DOCX files only.');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size should be less than 10MB.');
      return;
    }

    setUploadingFile(true);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('bucket', 'job-descriptions');
      form.append('folder', 'job-descriptions');
      form.append('prefix', `jd_${Date.now()}`);
      const uploadResult = await apiUpload<{ success: boolean; publicUrl: string }>('/files/upload', form);
      const publicUrl = uploadResult.publicUrl;

      setFormData({ ...formData, jd_file_url: publicUrl });
      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleViewApplications = async (job: JobDrive) => {
    setSelectedJob(job);
    setShowApplicationsModal(true);
    setLoadingApplications(true);
    setApplications([]);
    setApplicationsPage(0);
    setHasMoreApplications(false);

    const data = await fetchApplicationsPage(job.id, 0);
    setApplications(data);
    setHasMoreApplications(data.length === applicationsPageSize);
    setLoadingApplications(false);
  };

  const fetchApplicationsPage = async (jobDriveId: string, page: number) => {
    const response = await apiGet<{ data: ApplicationWithStudent[] }>(
      `/job-drives/${jobDriveId}/applications?page=${page}&page_size=${applicationsPageSize}`
    );
    return response.data || [];
  };

  const loadMoreApplications = async () => {
    if (!selectedJob || loadingApplications || !hasMoreApplications) return;
    setLoadingApplications(true);
    const nextPage = applicationsPage + 1;
    const data = await fetchApplicationsPage(selectedJob.id, nextPage);
    setApplications((prev) => [...prev, ...data]);
    setApplicationsPage(nextPage);
    setHasMoreApplications(data.length === applicationsPageSize);
    setLoadingApplications(false);
  };

  const exportToExcel = async () => {
    if (!selectedJob || applications.length === 0) return;
    setExportingApplications(true);

    try {
      // Fetch all applications for export (not just the current page)
      const allApplications: ApplicationWithStudent[] = [];
      for (let page = 0; ; page += 1) {
        const data = await fetchApplicationsPage(selectedJob.id, page);
        if (!data) break;
        allApplications.push(...data);
        if (data.length < applicationsPageSize) break;
      }

      const excelData = allApplications.map((app, index) => ({
      'S.No': index + 1,
      'PRN': app.student?.prn || '',
      'Student Name': app.student?.full_name || '',
      'Email': app.student?.email || '',
      'Phone': app.student?.phone || '',
      'Branch': app.student?.branch || '',
      'Batch': app.student?.batch_year || '',
      'CGPA': app.student?.current_cgpa || '',
      'Backlogs': app.student?.backlogs || '',
      'Placement Status': app.student?.placement_status || '',
      'Application Status': app.status,
      'Applied Date': new Date(app.applied_at).toLocaleDateString(),
      'Remarks': app.remarks || '',
      'Resume Name': app.custom_resume_name || '',
      'Resume URL': app.custom_resume_url || app.student?.resume_url || ''
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 5 },   // S.No
      { wch: 15 },  // PRN
      { wch: 25 },  // Student Name
      { wch: 30 },  // Email
      { wch: 15 },  // Phone
      { wch: 12 },  // Branch
      { wch: 8 },   // Batch
      { wch: 8 },   // CGPA
      { wch: 10 },  // Backlogs
      { wch: 18 },  // Placement Status
      { wch: 18 },  // Application Status
      { wch: 15 },  // Applied Date
      { wch: 30 },  // Remarks
      { wch: 25 },  // Resume Name
      { wch: 40 },  // Resume URL
    ];
    ws['!cols'] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Applications');

    // Generate filename
    const fileName = `${selectedJob.title}_Applications_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, fileName);
    } finally {
      setExportingApplications(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    await apiPatch(`/job-drives/${id}`, { data: { is_active: !currentStatus } });
    loadJobDrives();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const jobData = {
      ...formData,
      package_offered: parseFloat(formData.package_offered.toString()),
      min_cgpa: parseFloat(formData.min_cgpa.toString()),
      is_active: true,
    };

    if (editingJob) {
      await apiPatch(`/job-drives/${editingJob.id}`, { data: jobData });
      resetForm();
      loadJobDrives();
    } else {
      await apiPost('/job-drives', { data: jobData });
      resetForm();
      loadJobDrives();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this job drive?')) {
      await apiDelete(`/job-drives/${id}`);
      loadJobDrives();
    }
  };

  const handleEdit = (job: JobDrive) => {
    setEditingJob(job);
    setFormData({
      company_id: job.company_id,
      title: job.title,
      job_type: job.job_type,
      description: job.description || '',
      jd_file_url: job.jd_file_url || '',
      allowed_branches: job.allowed_branches,
      allowed_batches: job.allowed_batches,
      min_cgpa: job.min_cgpa,
      max_backlogs: job.max_backlogs,
      package_offered: job.package_offered || 0,
      location: job.location || '',
      application_start: job.application_start.split('T')[0],
      application_end: job.application_end.split('T')[0],
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      company_id: '',
      title: '',
      job_type: 'FULL_TIME',
      description: '',
      jd_file_url: '',
      allowed_branches: [],
      allowed_batches: [],
      min_cgpa: 6.0,
      max_backlogs: 0,
      package_offered: 0,
      location: '',
      application_start: '',
      application_end: '',
    });
    setEditingJob(null);
    setShowModal(false);
  };

  const toggleBranch = (branch: Branch) => {
    setFormData({
      ...formData,
      allowed_branches: formData.allowed_branches.includes(branch)
        ? formData.allowed_branches.filter((b) => b !== branch)
        : [...formData.allowed_branches, branch],
    });
  };

  const toggleBatch = (year: number) => {
    setFormData({
      ...formData,
      allowed_batches: formData.allowed_batches.includes(year)
        ? formData.allowed_batches.filter((y) => y !== year)
        : [...formData.allowed_batches, year],
    });
  };

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄 PDF';
      case 'ppt':
      case 'pptx':
        return '📊 PPT';
      case 'doc':
      case 'docx':
        return '📝 DOC';
      default:
        return '📎 File';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'APPLIED':
        return 'bg-blue-100 text-blue-800';
      case 'SHORTLISTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'INTERVIEW':
        return 'bg-purple-100 text-purple-800';
      case 'SELECTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading job drives...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Job Drive Management</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Job Drive
        </button>
      </div>

      {/* Job Drives Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {jobDrives.map((job) => (
          <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Card Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-600">{job.company?.name}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(job.id, job.is_active)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      job.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {job.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      job.job_type === 'INTERNSHIP'
                        ? 'bg-blue-100 text-blue-800'
                        : job.job_type === 'PPO'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {job.job_type}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
              {/* Applications Count */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">Total Applications</span>
                <span className="text-2xl font-bold text-blue-700">{job.applications?.[0]?.count || 0}</span>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-500">Package:</span>
                  <p className="font-medium text-gray-900">{job.package_offered} LPA</p>
                </div>
                <div>
                  <span className="text-gray-500">Location:</span>
                  <p className="font-medium text-gray-900">{job.location || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Min CGPA:</span>
                  <p className="font-medium text-gray-900">{job.min_cgpa}</p>
                </div>
                <div>
                  <span className="text-gray-500">Max Backlogs:</span>
                  <p className="font-medium text-gray-900">{job.max_backlogs}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div>
                  <span className="text-gray-500">Branches:</span>
                  <p className="text-gray-900 mt-1">{job.allowed_branches.join(', ')}</p>
                </div>
                <div>
                  <span className="text-gray-500">Batches:</span>
                  <p className="text-gray-900 mt-1">{job.allowed_batches.join(', ')}</p>
                </div>
                <div>
                  <span className="text-gray-500">Application Period:</span>
                  <p className="text-gray-900 mt-1">
                    {new Date(job.application_start).toLocaleDateString()} -{' '}
                    {new Date(job.application_end).toLocaleDateString()}
                  </p>
                </div>
                {job.jd_file_url && (
                  <div>
                    <span className="text-gray-500">Job Description:</span>
                    <a
                      href={job.jd_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      <FileText className="w-4 h-4" />
                      {getFileIcon(job.jd_file_url)}
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleViewApplications(job)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  View Applications
                </button>
                <button
                  onClick={() => handleEdit(job)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(job.id)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Job Drive Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingJob ? 'Edit Job Drive' : 'Add Job Drive'}
              </h3>
              <button onClick={resetForm} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.company_id}
                    onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.job_type}
                    onChange={(e) => setFormData({ ...formData, job_type: e.target.value as JobType })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="INTERNSHIP">Internship</option>
                    <option value="PPO">PPO</option>
                    <option value="FULL_TIME">Full Time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Package (LPA) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.package_offered}
                    onChange={(e) => setFormData({ ...formData, package_offered: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min CGPA <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.min_cgpa}
                    onChange={(e) => setFormData({ ...formData, min_cgpa: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Backlogs <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.max_backlogs}
                    onChange={(e) => setFormData({ ...formData, max_backlogs: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Start <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.application_start}
                    onChange={(e) => setFormData({ ...formData, application_start: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application End <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.application_end}
                    onChange={(e) => setFormData({ ...formData, application_end: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description File (Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                        <Upload className="w-5 h-5 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {uploadingFile ? 'Uploading...' : 'Upload PDF, PPT, DOC'}
                        </span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.ppt,.pptx,.doc,.docx"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                      />
                    </label>
                    {formData.jd_file_url && (
                      <a
                        href={formData.jd_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        View Uploaded
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: PDF, PPT, PPTX, DOC, DOCX (Max 10MB)
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allowed Branches <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {branches.map((branch) => (
                      <button
                        key={branch}
                        type="button"
                        onClick={() => toggleBranch(branch)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.allowed_branches.includes(branch)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {branch}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allowed Batches <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {years.map((year) => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => toggleBatch(year)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.allowed_batches.includes(year)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingJob ? 'Update' : 'Add'} Job Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Applications Modal - Table View */}
      {showApplicationsModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Applications - {selectedJob.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Total Applications: <span className="font-medium">{applications.length}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                {applications.length > 0 && (
                  <button
                    onClick={exportToExcel}
                    disabled={exportingApplications}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    {exportingApplications ? 'Exporting...' : 'Export to Excel'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowApplicationsModal(false);
                    setApplications([]);
                  }}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Table View */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loadingApplications ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading applications...</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-12">
                  <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h4>
                  <p className="text-gray-600">No students have applied to this job drive.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          S.No
                        </th>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          PRN
                        </th>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student Name
                        </th>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Branch
                        </th>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Batch
                        </th>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          CGPA
                        </th>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Backlogs
                        </th>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applied Date
                        </th>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Remarks
                        </th>
                        <th scope="col" className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Resume
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {applications.map((app, index) => (
                        <tr key={app.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {app.student?.prn}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {app.student?.full_name}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {app.student?.email}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {app.student?.phone}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {app.student?.branch}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {app.student?.batch_year}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {app.student?.current_cgpa}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {app.student?.backlogs}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(app.status)}`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(app.applied_at).toLocaleDateString()}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[10rem] sm:max-w-xs truncate">
                            {app.remarks || '-'}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(app.custom_resume_url || app.student?.resume_url) ? (
                              <a
                                href={(app.custom_resume_url || app.student?.resume_url) as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                <Download className="w-4 h-4" />
                                {app.custom_resume_name || 'View'}
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {hasMoreApplications && (
                    <div className="mt-4 flex justify-center">
                      <button
                        onClick={loadMoreApplications}
                        disabled={loadingApplications}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        {loadingApplications ? 'Loading...' : 'Load more'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
