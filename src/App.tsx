import { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import SplashScreen from './components/common/SplashScreen';
import ProtectedRoute from './routes/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import AIChat from './pages/dashboard/AIChat';
import VoiceChat from './pages/dashboard/VoiceChat';
import ChatHistory from './pages/dashboard/ChatHistory';
import SavedChats from './pages/dashboard/SavedChats';
import Profile from './pages/dashboard/Profile';
import Settings from './pages/dashboard/Settings';
import Admin from './pages/dashboard/Admin';
import NotFound from './pages/NotFound';

function Protected({ children }: { children: JSX.Element }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AuthProvider>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <HashRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/dashboard" element={<Protected><AIChat /></Protected>} />
          <Route path="/dashboard/voice" element={<Protected><VoiceChat /></Protected>} />
          <Route path="/dashboard/history" element={<Protected><ChatHistory /></Protected>} />
          <Route path="/dashboard/saved" element={<Protected><SavedChats /></Protected>} />
          <Route path="/dashboard/profile" element={<Protected><Profile /></Protected>} />
          <Route path="/dashboard/settings" element={<Protected><Settings /></Protected>} />
          <Route path="/dashboard/admin" element={<Protected><Admin /></Protected>} />

                    <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
