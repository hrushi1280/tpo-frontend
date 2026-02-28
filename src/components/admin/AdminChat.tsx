import ChatInterface from '../common/ChatInterface';

interface AdminChatProps {
  studentId: string;
  studentName?: string;
  onClose?: () => void;
}

export default function AdminChat({ studentId, studentName, onClose }: AdminChatProps) {
  return <ChatInterface otherUserId={studentId} otherUserName={studentName} isAdmin={true} onClose={onClose} />;
}
