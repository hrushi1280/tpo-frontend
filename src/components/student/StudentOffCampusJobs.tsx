// src/components/student/StudentOffCampusJobs.tsx
import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Building2, 
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Filter,
  Calendar,
  IndianRupee,
  Clock,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { apiGet, apiPost, apiDelete } from '../../lib/api';

interface OffCampusJob {
  id: string;
  company: string;
  title: string;
  location: string;
  description?: string;
  salary?: string;
  job_type?: string;
  experience_required?: string;
  posted_date: string;
  apply_url: string;
  source_website?: string;
  logo_url?: string;
  is_bookmarked?: boolean;
  has_applied?: boolean;
}

interface JobsResponse {
  data: OffCampusJob[];
  total: number;
  page: number;
  total_pages: number;
}

export default function StudentOffCampusJobs() {
  const { user } = useAuth();
  const student = user as { id: string };
  
  // Search state
  const [searchRole, setSearchRole] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [jobs, setJobs] = useState<OffCampusJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    jobType: '',
    minSalary: '',
    maxSalary: '',
    experience: '',
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  
  // Bookmark state
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<string>>(new Set());
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  
  // Applied jobs tracking
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());

  // Load initial jobs and user data
  useEffect(() => {
    loadInitialJobs();
    loadUserInteractions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load jobs when search/filters change
  useEffect(() => {
    if (!initialLoading) {
      searchJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, showBookmarksOnly]);

  const loadInitialJobs = async () => {
    setInitialLoading(true);
    try {
      const response = await apiGet<JobsResponse>('/off-campus-jobs/recent?limit=12');
      setJobs(response.data || []);
      setTotalPages(response.total_pages || 1);
      setTotalJobs(response.total || 0);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadUserInteractions = async () => {
    try {
      // Load bookmarked jobs
      const bookmarksRes = await apiGet<{ data: string[] }>(`/student/${student.id}/job-bookmarks`);
      setBookmarkedJobs(new Set(bookmarksRes.data || []));

      // Load applied jobs
      const appliedRes = await apiGet<{ data: string[] }>(`/student/${student.id}/job-applications`);
      setAppliedJobs(new Set(appliedRes.data || []));
    } catch (error) {
      console.error('Error loading user interactions:', error);
    }
  };

  const searchJobs = useCallback(async () => {
    if (!searchRole && !searchLocation && !showBookmarksOnly) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        ...(searchRole && { role: searchRole }),
        ...(searchLocation && { location: searchLocation }),
        ...(filters.jobType && { job_type: filters.jobType }),
        ...(filters.minSalary && { min_salary: filters.minSalary }),
        ...(filters.maxSalary && { max_salary: filters.maxSalary }),
        ...(filters.experience && { experience: filters.experience }),
        ...(showBookmarksOnly && { bookmarks_only: 'true', student_id: student.id }),
      });

      const response = await apiGet<JobsResponse>(`/off-campus-jobs/search?${params.toString()}`);
      setJobs(response.data || []);
      setTotalPages(response.total_pages || 1);
      setTotalJobs(response.total || 0);
    } catch (error) {
      console.error('Error searching jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [searchRole, searchLocation, filters, currentPage, showBookmarksOnly, student.id]);

  const handleSearch = () => {
    setCurrentPage(1);
    searchJobs();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleBookmark = async (jobId: string) => {
    try {
      if (bookmarkedJobs.has(jobId)) {
        await apiDelete(`/student/${student.id}/job-bookmarks/${jobId}`);
        setBookmarkedJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      } else {
        await apiPost(`/student/${student.id}/job-bookmarks`, { job_id: jobId });
        setBookmarkedJobs(prev => new Set([...prev, jobId]));
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const trackApplication = async (jobId: string) => {
    try {
      await apiPost(`/student/${student.id}/job-applications`, { job_id: jobId });
      setAppliedJobs(prev => new Set([...prev, jobId]));
      
      // Track in analytics
      await apiPost('/analytics/job-application', {
        student_id: student.id,
        job_id: jobId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking application:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const clearFilters = () => {
    setSearchRole('');
    setSearchLocation('');
    setFilters({
      jobType: '',
      minSalary: '',
      maxSalary: '',
      experience: '',
    });
    setShowBookmarksOnly(false);
    setCurrentPage(1);
    loadInitialJobs();
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Off Campus Jobs</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showBookmarksOnly 
                ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span className="text-sm font-medium">Bookmarks</span>
            {bookmarkedJobs.size > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded-full">
                {bookmarkedJobs.size}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Job title or keyword (e.g., Java, React, Developer)"
              value={searchRole}
              onChange={(e) => setSearchRole(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Location (e.g., Pune, Mumbai, Remote)"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search</span>
              </>
            )}
          </button>
        </div>

        {/* Active Filters */}
        {(searchRole || searchLocation || filters.jobType || filters.minSalary || filters.maxSalary || filters.experience) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {searchRole && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Role: {searchRole}
                <button onClick={() => setSearchRole('')} className="hover:text-blue-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchLocation && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Location: {searchLocation}
                <button onClick={() => setSearchLocation('')} className="hover:text-blue-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.jobType && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                Type: {filters.jobType}
                <button onClick={() => setFilters({ ...filters, jobType: '' })} className="hover:text-purple-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.experience && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Exp: {filters.experience}
                <button onClick={() => setFilters({ ...filters, experience: '' })} className="hover:text-green-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Advanced Filters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Job Type</label>
              <select
                value={filters.jobType}
                onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Types</option>
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Remote">Remote</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Experience</label>
              <select
                value={filters.experience}
                onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Any Experience</option>
                <option value="Fresher">Fresher</option>
                <option value="0-1 years">0-1 years</option>
                <option value="1-3 years">1-3 years</option>
                <option value="3-5 years">3-5 years</option>
                <option value="5+ years">5+ years</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Min Salary (LPA)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={filters.minSalary}
                onChange={(e) => setFilters({ ...filters, minSalary: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="e.g., 3"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Max Salary (LPA)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={filters.maxSalary}
                onChange={(e) => setFilters({ ...filters, maxSalary: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="e.g., 10"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                setShowFilters(false);
                handleSearch();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Results Stats */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <p>
          Found <span className="font-medium text-gray-900">{totalJobs}</span> jobs
          {showBookmarksOnly && ' in your bookmarks'}
        </p>
        {showBookmarksOnly && (
          <button
            onClick={() => setShowBookmarksOnly(false)}
            className="text-blue-600 hover:text-blue-800"
          >
            Show all jobs
          </button>
        )}
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group"
              >
                <div className="p-6">
                  {/* Header with Bookmark */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {job.logo_url ? (
                        <img
                          src={job.logo_url}
                          alt={job.company}
                          className="w-12 h-12 rounded-lg object-contain bg-gray-50"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {job.company}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-1">{job.title}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleBookmark(job.id)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      {bookmarkedJobs.has(job.id) ? (
                        <BookmarkCheck className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <Bookmark className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* Job Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="line-clamp-1">{job.location}</span>
                    </div>
                    
                    {job.salary && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <IndianRupee className="w-4 h-4 flex-shrink-0" />
                        <span>{job.salary} LPA</span>
                      </div>
                    )}
                    
                    {job.job_type && (
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="w-4 h-4 flex-shrink-0 text-gray-600" />
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {job.job_type}
                        </span>
                      </div>
                    )}
                    
                    {job.experience_required && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>{job.experience_required}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>Posted {formatDate(job.posted_date)}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {job.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {job.description}
                    </p>
                  )}

                  {/* Source */}
                  {job.source_website && (
                    <p className="text-xs text-gray-400 mb-3">
                      Source: {job.source_website}
                    </p>
                  )}

                  {/* Apply Button */}
                  <div className="flex gap-2">
                    <a
                      href={job.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackApplication(job.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <span>Apply Now</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    {appliedJobs.has(job.id) && (
                      <span className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                        Applied
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {jobs.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600">
                Try adjusting your search criteria or check back later
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1 border rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1 border rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}