export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_role: 'student' | 'admin';
  receiver_role: 'student' | 'admin';
  message: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  attachment_url?: string;
  attachment_name?: string;
  sender_name?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  created_by?: string;
  created_at: string;
  updated_at?: string;
  expires_at?: string;
  is_active?: boolean;
  is_pinned: boolean;
  attachment_url?: string;
  attachment_name?: string;
  target_branches?: string[];
  target_batches?: number[];
  target_programs?: string[];
  is_read?: boolean;
  read_count?: number;
}

export interface ChatRoom {
  id: string;
  student_id: string;
  admin_id?: string;
  status: 'active' | 'closed' | 'archived';
  last_message_at: string;
  created_at: string;
  updated_at: string;
  student_name?: string;
  student_prn?: string;
  unread_count?: number;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'notice' | 'message' | 'application_update';
  title: string;
  content: string;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}
