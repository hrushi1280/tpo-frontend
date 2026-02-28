import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Pin,
  AlertCircle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  Download,
  Filter,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { apiGet, apiPost } from '../../lib/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { Notice } from '../../types/chat.types';

interface NoticeBoardProps {
  isAdmin?: boolean;
  onSendNotice?: (title: string, content: string, priority: string) => void;
}

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

export default function NoticeBoard({ isAdmin = false, onSendNotice }: NoticeBoardProps) {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewNoticeModal, setShowNewNoticeModal] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', content: '', priority: 'NORMAL' });
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const { sendNotice, isConnected } = useWebSocket({
    onNotice: (noticeData) => {
      const incoming = noticeData as unknown as Notice;
      setNotices((prev) => [incoming, ...prev]);
      if (incoming.priority === 'HIGH' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('New Notice', { body: incoming.title });
      }
    },
  });

  useEffect(() => {
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

    loadNotices();
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
      markAsRead(noticeId);
    }
  };

  const handleSendNotice = () => {
    if (!newNotice.title.trim() || !newNotice.content.trim()) return;
    sendNotice(newNotice.title.trim(), newNotice.content.trim(), newNotice.priority);
    onSendNotice?.(newNotice.title.trim(), newNotice.content.trim(), newNotice.priority);
    setNewNotice({ title: '', content: '', priority: 'NORMAL' });
    setShowNewNoticeModal(false);
  };

  const filteredNotices = useMemo(
    () =>
      notices.filter((notice) => {
        if (filter === 'unread') return !notice.is_read;
        if (filter === 'high') return notice.priority === 'HIGH';
        return true;
      }),
    [filter, notices]
  );

  const unreadCount = notices.filter((n) => !n.is_read).length;

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
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Notice Board</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">{unreadCount} new</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isConnected && (
              <span className="text-xs text-red-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                Offline
              </span>
            )}
            <button onClick={() => setShowFilters((prev) => !prev)} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <Filter className="w-4 h-4 text-gray-600" />
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowNewNoticeModal(true)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                New Notice
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 flex gap-2">
            {(['all', 'unread', 'high'] as const).map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  filter === value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {value === 'all' ? 'All' : value === 'unread' ? 'Unread' : 'High Priority'}
              </button>
            ))}
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
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notice.priority)}`}>
                        {getPriorityIcon(notice.priority)}
                        {notice.priority}
                      </span>
                      {!notice.is_read && <span className="w-2 h-2 bg-blue-600 rounded-full"></span>}
                      {isAdmin && notice.read_count !== undefined && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {notice.read_count}
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
                  <button className="p-1">
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
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{notice.content}</p>
                    {notice.attachment_url && (
                      <a
                        href={notice.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-3"
                      >
                        <Download className="w-3 h-3" />
                        {notice.attachment_name || 'Download Attachment'}
                      </a>
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

      {showNewNoticeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Create New Notice</h3>
              <button onClick={() => setShowNewNoticeModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <input
                type="text"
                value={newNotice.title}
                onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Notice title..."
              />
              <textarea
                value={newNotice.content}
                onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Notice content..."
              />
              <select
                value={newNotice.priority}
                onChange={(e) => setNewNotice({ ...newNotice, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div className="p-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => setShowNewNoticeModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNotice}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Send Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
