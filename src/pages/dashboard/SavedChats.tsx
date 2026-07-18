import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ChatList from '../../components/dashboard/ChatList';
import { useAuth } from '../../context/AuthContext';

export default function SavedChats() {
  const { firebaseUser } = useAuth();
  return (
    <DashboardLayout>
      <div className="section-pad max-w-2xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-1">Saved Chats</h1>
        <p className="text-ink/50 text-sm mb-8">Conversations you've starred for quick access.</p>
        <ChatList uid={firebaseUser?.uid} savedOnly />
      </div>
    </DashboardLayout>
  );
}
