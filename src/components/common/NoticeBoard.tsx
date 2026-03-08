import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Filter,
  Loader2,
  Paperclip,
  Pin,
  Trash2,
  Edit2,
  X,
  Image as ImageIcon,
} from 'lucide-react';

import { useAuth } from '../../context/useAuth';
import { apiDelete, apiGet, apiPatch, apiPost, apiUpload } from '../../lib/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { Notice } from '../../types/chat.types';

interface NoticeBoardProps {
  isAdmin?: boolean;
}

interface NoticeFormState {
  title: string;
  content: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  is_pinned: boolean;
  expires_at: string;
  attachment_url: string;
  attachment_name: string;
}

const defaultFormState: NoticeFormState = {
  title: '',
  content: '',
  priority: 'NORMAL',
  is_pinned: false,
  expires_at: '',
  attachment_url: '',
  attachment_name: '',
};

const formatRelative = (value: string) => {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

function isImageAttachment(url?: string | null): boolean {
  if (!url) return false;
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
}

export default function NoticeBoard({ isAdmin = false }: NoticeBoardProps) {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [form, setForm] = useState<NoticeFormState>(defaultFormState);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadNotices = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (user?.id) query.set('student_id', user.id);
      if (isAdmin) query.set('is_admin', 'true');
      const response = await apiGet<Notice[]>(`/notices?${query.toString()}`);
      setNotices(response || []);
    } catch (error) {
      console.error('Error loading notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const { isConnected } = useWebSocket({
    onNotice: () => {
      loadNotices().catch(() => undefined);
    },
    onMessage: (data) => {
      if (data.type === 'notice_created' || data.type === 'notice_updated' || data.type === 'notice_deleted') {
        loadNotices().catch(() => undefined);
      }
    },
  });

  useEffect(() => {
    loadNotices().catch(() => undefined);
  }, [isAdmin, user?.id]);

  const markAsRead = async (noticeId: string) => {
    try {
      await apiPost(`/notices/${noticeId}/read`, { student_id: user?.id });
      setNotices((prev) => prev.map((n) => (n.id === noticeId ? { ...n, is_read: true } : n)));
    } catch (error) {
      console.error('Error marking notice as read:', error);
    }
  };

  const handleNoticeClick = (noticeId: string) => {
    if (expandedId === noticeId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(noticeId);
    const selected = notices.find((n) => n.id === noticeId);
    if (selected && !selected.is_read && !isAdmin) {
      markAsRead(noticeId).catch(() => undefined);
    }
  };

  const openCreateModal = () => {
    setEditingNoticeId(null);
    setForm(defaultFormState);
    setShowFormModal(true);
  };

  const openEditModal = (notice: Notice) => {
    setEditingNoticeId(notice.id);
    setForm({
      title: notice.title || '',
      content: notice.content || '',
      priority: (notice.priority || 'NORMAL') as NoticeFormState['priority'],
      is_pinned: Boolean(notice.is_pinned),
      expires_at: notice.expires_at ? String(notice.expires_at).slice(0, 10) : '',
      attachment_url: notice.attachment_url || '',
      attachment_name: notice.attachment_name || '',
    });
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingNoticeId(null);
    setForm(defaultFormState);
  };

  const handleUpload = async (file: File, type: 'image' | 'document') => {
    if (!file) return;

    if (type === 'image' && !file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'notice-attachments');
      formData.append('folder', 'notices');
      formData.append('prefix', `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`);

      const response = await apiUpload<{ publicUrl: string }>('/files/upload', formData);
      setForm((prev) => ({
        ...prev,
        attachment_url: response.publicUrl,
        attachment_name: file.name,
      }));
    } catch (error) {
      console.error('Error uploading notice file:', error);
      alert(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const saveNotice = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        priority: form.priority,
        is_pinned: form.is_pinned,
        expires_at: form.expires_at || null,
        attachment_url: form.attachment_url || null,
        attachment_name: form.attachment_name || null,
        created_by: user?.id,
      };

      if (editingNoticeId) {
        await apiPatch(`/notices/${editingNoticeId}`, payload);
      } else {
        await apiPost('/notices', payload);
      }

      closeFormModal();
      await loadNotices();
    } catch (error) {
      console.error('Error saving notice:', error);
      alert('Failed to save notice');
    } finally {
      setSaving(false);
    }
  };

  const deleteNotice = async (noticeId: string) => {
    try {
      await apiDelete(`/notices/${noticeId}`);
      setDeleteConfirmId(null);
      await loadNotices();
    } catch (error) {
      console.error('Error deleting notice:', error);
      alert('Failed to delete notice');
    }
  };

  const filteredNotices = useMemo(() => {
    let filtered = [...notices];

    if (!isAdmin && filter === 'unread') {
      filtered = filtered.filter((n) => !n.is_read);
    }
    if (filter === 'high') {
      filtered = filtered.filter((n) => n.priority === 'HIGH');
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (n) => n.title.toLowerCase().includes(term) || n.content.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [notices, filter, searchTerm, isAdmin]);

  const unreadCount = notices.filter((n) => !n.is_read).length;

  const exportNoticesCsv = () => {
    const headers = ['title', 'content', 'priority', 'is_pinned', 'created_at', 'expires_at', 'attachment_name', 'read_count'];
    const escapeCsv = (value: unknown) => {
      const str = String(value ?? '');
      return ' + str.replace(/"/g, ) + ';
    };

    const lines = [headers.join(',')];
    for (const n of filteredNotices) {
      lines.push([
        escapeCsv(n.title),
        escapeCsv(n.content),
        escapeCsv(n.priority),
        escapeCsv(Boolean(n.is_pinned)),
        escapeCsv(n.created_at),
        escapeCsv(n.expires_at || ''),
        escapeCsv(n.attachment_name || ''),
        escapeCsv(n.read_count ?? ''),
      ].join(','));
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notices_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <AlertCircle className="w-4 h-4" />;
      case 'NORMAL':
        return <Bell className="w-4 h-4" />;
      case 'LOW':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">{isAdmin ? 'Notice Management' : 'Notice Board'}</h3>
            {!isAdmin && unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">{unreadCount} new</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-600">{isConnected ? 'Live' : 'Offline'}</span>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notices..."
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={() => setShowFilters((prev) => !prev)} className="p-2 hover:bg-gray-100 rounded-lg">
              <Filter className="w-4 h-4 text-gray-600" />
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={exportNoticesCsv}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
                >
                  Export CSV
                </button>
                <button
                  onClick={openCreateModal}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  New Notice
                </button>
              </>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {!isAdmin && (
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Unread ({unreadCount})
              </button>
            )}
            <button
              onClick={() => setFilter('high')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                filter === 'high' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              High Priority
            </button>
          </div>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {filteredNotices.length > 0 ? (
          filteredNotices.map((notice) => (
            <div key={notice.id} className={!notice.is_read ? 'bg-blue-50/30' : ''}>
              <div onClick={() => handleNoticeClick(notice.id)} className="p-4 cursor-pointer hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  {notice.is_pinned && <Pin className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-1" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notice.priority)}`}>
                        {getPriorityIcon(notice.priority)}
                        {notice.priority}
                      </span>
                      {!isAdmin && !notice.is_read && <span className="w-2 h-2 bg-blue-600 rounded-full" />}
                      {isAdmin && notice.read_count !== undefined && (
                        <span className="text-xs text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                          <Eye className="w-3 h-3" />
                          {notice.read_count} reads
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{notice.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatRelative(notice.created_at)}
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEditModal(notice)}
                        className="p-1 hover:bg-gray-100 rounded-lg text-gray-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(notice.id)}
                        className="p-1 hover:bg-red-100 rounded-lg text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <button className="p-1" onClick={(e) => e.stopPropagation()}>
                    {expandedId === notice.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {expandedId === notice.id && (
                <div className="px-4 pb-4">
                  <div className="pl-7 pr-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{notice.content}</p>

                    {notice.attachment_url && (
                      <div className="mt-3">
                        {isImageAttachment(notice.attachment_url) ? (
                          <div className="space-y-2">
                            <img
                              src={notice.attachment_url}
                              alt={notice.attachment_name || 'notice attachment'}
                              className="max-w-full rounded-lg border border-gray-200"
                            />
                            <a
                              href={notice.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                            >
                              <Download className="w-3 h-3" />
                              {notice.attachment_name || 'Open image'}
                            </a>
                          </div>
                        ) : (
                          <a
                            href={notice.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                          >
                            <Download className="w-3 h-3" />
                            {notice.attachment_name || 'Download attachment'}
                          </a>
                        )}
                      </div>
                    )}

                    {isAdmin && deleteConfirmId === notice.id && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg flex items-center justify-between">
                        <p className="text-sm text-red-800">Delete this notice?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => deleteNotice(notice.id)}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No notices to display</p>
          </div>
        )}
      </div>

      {showFormModal && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-900">{editingNoticeId ? 'Edit Notice' : 'Create Notice'}</h3>
              <button onClick={closeFormModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Notice title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Notice content"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, priority: e.target.value as NoticeFormState['priority'] }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expires On (optional)</label>
                  <input
                    type="date"
                    value={form.expires_at}
                    onChange={(e) => setForm((prev) => ({ ...prev, expires_at: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.is_pinned}
                      onChange={(e) => setForm((prev) => ({ ...prev, is_pinned: e.target.checked }))}
                    />
                    Pin notice
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attachment (optional)</label>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploading}
                    className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4 text-blue-600" />}
                    <span className="text-sm text-blue-600">Add Image</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-500"
                  >
                    <Paperclip className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Add File</span>
                  </button>
                </div>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file, 'image').catch(() => undefined);
                  }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file, 'document').catch(() => undefined);
                  }}
                />

                {form.attachment_url && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg flex items-center justify-between">
                    <a
                      href={form.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate"
                    >
                      {form.attachment_name || 'Attached file'}
                    </a>
                    <button
                      onClick={() => setForm((prev) => ({ ...prev, attachment_url: '', attachment_name: '' }))}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={closeFormModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => saveNotice().catch(() => undefined)}
                disabled={saving || !form.title.trim() || !form.content.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingNoticeId ? 'Update Notice' : 'Post Notice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
