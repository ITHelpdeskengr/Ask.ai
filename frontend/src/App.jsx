import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider } from './context/ChatContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';

import PublicCalendar from './components/PublicCalendar';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

import { UIProvider } from './context/UIContext';
import VoiceFloatingButton from './components/VoiceFloatingButton';

import AdminDashboard from './components/AdminDashboard';
import { useState, useEffect } from 'react';

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const [activeAppView, setActiveAppView] = useState('chat');
  
  useEffect(() => {
    if (user?.role === 'admin') setActiveAppView('admin');
  }, [user]);

  const path = window.location.pathname;
  if (path.startsWith('/calendar/')) {
    const token = path.split('/')[2];
    if (token) {
      return <PublicCalendar token={token} />;
    }
  }

  return isAuthenticated ? (
    <ChatProvider>
      <UIProvider>
        {user?.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <>
            <Layout />
            <VoiceFloatingButton />
          </>
        )}
      </UIProvider>
    </ChatProvider>
  ) : (
    <LoginPage />
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
