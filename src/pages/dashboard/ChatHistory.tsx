import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ChatList from '../../components/dashboard/ChatList';
import { useAuth } from '../../context/AuthContext';

export default function ChatHistory() {
  const { firebaseUser } = useAuth();
  return (
    <DashboardLayout>
      <div className="section-pad max-w-2xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-1">Chat History</h1>
        <p className="text-ink/50 text-sm mb-8">All your past conversations, most recent first.</p>
        <ChatList uid={firebaseUser?.uid} savedOnly={false} />
      </div>
    </DashboardLayout>
  );
}
