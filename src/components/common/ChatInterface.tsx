import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Paperclip, Check, CheckCheck, X, User, Phone, Video, MoreVertical } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useWebSocket } from '../../hooks/useWebSocket';
import { apiGet } from '../../lib/api';
import type { Message } from '../../types/chat.types';

interface ChatInterfaceProps {
  otherUserId?: string;
  otherUserName?: string;
  isAdmin?: boolean;
  onClose?: () => void;
}

export default function ChatInterface({ otherUserId, otherUserName, isAdmin = false, onClose }: ChatInterfaceProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { sendChatMessage, sendTyping, markAsRead, isConnected } = useWebSocket({
    onChatMessage: (message) => {
      const incoming = message as unknown as Message;
      if (!incoming.sender_id || !incoming.receiver_id) return;

      if (!otherUserId ||
        (incoming.sender_id === otherUserId && incoming.receiver_id === user?.id) ||
        (incoming.sender_id === user?.id && incoming.receiver_id === otherUserId)
      ) {
        setMessages((prev) => [
          ...prev,
          {
            ...incoming,
            id: incoming.id || `${Date.now()}`,
            created_at: incoming.created_at || new Date().toISOString(),
            sender_role: incoming.sender_role || (incoming.sender_id === user?.id ? 'admin' : 'student'),
            receiver_role: incoming.receiver_role || (incoming.sender_id === user?.id ? 'student' : 'admin'),
            message: incoming.message || '',
            is_read: Boolean(incoming.is_read),
          },
        ]);
      }
    },
    onTyping: (data) => {
      if ((data.user_id as string | undefined) === otherUserId) {
        setOtherUserTyping(Boolean(data.is_typing));
      }
    },
  });

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const response = await apiGet<Array<Partial<Message>>>(
          `/messages/${user?.id}${otherUserId ? `?other_id=${otherUserId}` : ''}`
        );
        const normalized: Message[] = (response || []).map((item) => ({
          id: item.id || `${Date.now()}-${Math.random()}`,
          sender_id: item.sender_id || '',
          receiver_id: item.receiver_id || '',
          sender_role: (item.sender_role as 'student' | 'admin') || 'student',
          receiver_role: (item.receiver_role as 'student' | 'admin') || 'admin',
          message: item.message || '',
          is_read: Boolean(item.is_read),
          created_at: item.created_at || new Date().toISOString(),
          read_at: item.read_at,
          attachment_url: item.attachment_url,
          attachment_name: item.attachment_name,
          sender_name: item.sender_name,
        }));
        setMessages(normalized);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadMessages();
    }
  }, [otherUserId, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherUserTyping]);

  useEffect(() => {
    if (isAdmin && otherUserId) {
      markAsRead(otherUserId);
    }
  }, [isAdmin, otherUserId, markAsRead]);

  const handleSendMessage = () => {
    const text = newMessage.trim();
    if (!text || !user?.id) return;

    sendChatMessage(text, otherUserId);
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        sender_id: user.id,
        receiver_id: otherUserId || '',
        sender_role: isAdmin ? 'admin' : 'student',
        receiver_role: isAdmin ? 'student' : 'admin',
        message: text,
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ]);
    setNewMessage('');
    sendTyping(false, otherUserId);
  };

  const handleTyping = () => {
    if (!otherUserId) return;
    if (!isTyping) {
      setIsTyping(true);
      sendTyping(true, otherUserId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTyping(false, otherUserId);
    }, 1500);
  };

  const groupedMessages = useMemo(() => {
    return messages.reduce<Record<string, Message[]>>((acc, msg) => {
      const date = new Date(msg.created_at).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(msg);
      return acc;
    }, {});
  }, [messages]);

  const formatDateTitle = (dateTitle: string) => {
    const date = new Date(dateTitle);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{otherUserName || (isAdmin ? 'Student' : 'Admin')}</h3>
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className={isConnected ? 'text-green-600' : 'text-gray-500'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Phone className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Video className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(groupedMessages).map(([dateTitle, dateMessages]) => (
          <div key={dateTitle}>
            <div className="text-center mb-4">
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{formatDateTitle(dateTitle)}</span>
            </div>
            {dateMessages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              return (
                <div key={message.id} className={`flex mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[70%]">
                    <div className={`rounded-lg p-3 ${isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                    </div>
                    <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <span>{formatTime(message.created_at)}</span>
                      {isOwn && (message.is_read ? <CheckCheck className="w-3 h-3 text-blue-600" /> : <Check className="w-3 h-3" />)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {otherUserTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 text-xs text-gray-600">Typing...</div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
