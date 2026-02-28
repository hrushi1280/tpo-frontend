import { useState } from 'react';
import { Upload, X, FileText, Download, AlertCircle } from 'lucide-react';
import { apiUpload } from '../../lib/api';
import type { CustomQuestion } from '../../lib/database.types';

interface JobApplicationFormProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  questions: CustomQuestion[];
  studentId: string;
  onClose: () => void;
  onSubmit: (data: { answers: Record<string, string>; customResumeUrl: string; customResumeName?: string }) => void;
}

export default function JobApplicationForm({
  jobId,
  jobTitle,
  companyName,
  questions,
  studentId,
  onClose,
  onSubmit
}: JobApplicationFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [customResume, setCustomResume] = useState<File | null>(null);
  const [customResumeUrl, setCustomResumeUrl] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleFileUpload = async (questionId: string, file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setErrors({ ...errors, [questionId]: 'Please upload PDF, DOC, DOCX, JPG, or PNG files only.' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, [questionId]: 'File size should be less than 5MB.' });
      return;
    }

    setUploading({ ...uploading, [questionId]: true });

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('bucket', 'question-files');
      form.append('folder', 'question-files');
      form.append('prefix', `${studentId}_${jobId}_${Date.now()}_${questionId}`);
      const upload = await apiUpload<{ success: boolean; publicUrl: string }>('/files/upload', form);

      setAnswers({ ...answers, [questionId]: upload.publicUrl });
      setErrors({ ...errors, [questionId]: '' });
    } catch (error) {
      console.error('Error uploading file:', error);
      setErrors({ ...errors, [questionId]: 'Failed to upload file.' });
    } finally {
      setUploading({ ...uploading, [questionId]: false });
    }
  };

  const handleCustomResumeUpload = async (file: File) => {
    // Validate file type
    if (file.type !== 'application/pdf') {
      setErrors({ ...errors, resume: 'Please upload PDF files only.' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, resume: 'File size should be less than 5MB.' });
      return;
    }

    setUploading({ ...uploading, resume: true });

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('bucket', 'job-resumes');
      form.append('folder', 'job-resumes');
      form.append('prefix', `${studentId}_${jobId}_resume_${Date.now()}`);
      const upload = await apiUpload<{ success: boolean; publicUrl: string }>('/files/upload', form);

      setCustomResume(file);
      setCustomResumeUrl(upload.publicUrl);
      setErrors({ ...errors, resume: '' });
    } catch (error) {
      console.error('Error uploading resume:', error);
      setErrors({ ...errors, resume: 'Failed to upload resume.' });
    } finally {
      setUploading({ ...uploading, resume: false });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    questions.forEach(q => {
      if (q.is_required) {
        if (!answers[q.id] && q.question_type !== 'file') {
          newErrors[q.id] = 'This field is required';
        } else if (q.question_type === 'file' && !answers[q.id]) {
          newErrors[q.id] = 'Please upload a file';
        }
      }
    });

    if (!customResume && !customResumeUrl) {
      newErrors.resume = 'Please upload your resume';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setSubmitting(true);
      onSubmit({
        answers,
        customResumeUrl,
        customResumeName: customResume?.name
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Apply for {jobTitle}</h3>
              <p className="text-sm text-gray-600 mt-1">{companyName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Resume Upload Section */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <label className="block text-sm font-medium text-blue-900 mb-2">
              Upload Resume for this Application <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => e.target.files?.[0] && handleCustomResumeUpload(e.target.files[0])}
                className="hidden"
                id="resume-upload"
              />
              <label
                htmlFor="resume-upload"
                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
              >
                {uploading.resume ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-blue-600 text-sm">Uploading...</span>
                  </>
                ) : customResume ? (
                  <>
                    <FileText className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 text-sm truncate max-w-[200px]">{customResume.name}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-600 text-sm">Click to upload resume (PDF only, max 5MB)</span>
                  </>
                )}
              </label>
            </div>
            {errors.resume && (
              <div className="flex items-center gap-1 text-red-600 text-sm mt-2">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.resume}</span>
              </div>
            )}
          </div>

          {/* Custom Questions */}
          {questions.map((question, index) => (
            <div key={question.id} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {index + 1}. {question.question_text}
                {question.is_required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {question.question_type === 'text' && (
                <input
                  type="text"
                  value={answers[question.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                  placeholder={question.placeholder}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              )}

              {question.question_type === 'textarea' && (
                <textarea
                  value={answers[question.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                  placeholder={question.placeholder}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              )}

              {question.question_type === 'number' && (
                <input
                  type="number"
                  value={answers[question.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                  placeholder={question.placeholder}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              )}

              {question.question_type === 'dropdown' && question.options && (
                <select
                  value={answers[question.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select an option</option>
                  {question.options.map((option, idx) => (
                    <option key={idx} value={option}>{option}</option>
                  ))}
                </select>
              )}

              {question.question_type === 'radio' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option, idx) => (
                    <label key={idx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.question_type === 'file' && (
                <div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(question.id, e.target.files[0])}
                    className="hidden"
                    id={`file-${question.id}`}
                  />
                  <label
                    htmlFor={`file-${question.id}`}
                    className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    {uploading[question.id] ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm">Uploading...</span>
                      </>
                    ) : answers[question.id] ? (
                      <>
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">File uploaded</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">Upload file</span>
                      </>
                    )}
                  </label>
                  {answers[question.id] && (
                    <a
                      href={answers[question.id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                    >
                      <Download className="w-3 h-3" />
                      View uploaded file
                    </a>
                  )}
                </div>
              )}

              {errors[question.id] && (
                <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors[question.id]}</span>
                </div>
              )}
            </div>
          ))}

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
