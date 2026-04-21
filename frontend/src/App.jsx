import { ThemeProvider } from './context/ThemeContext';
import { ChatProvider } from './context/ChatContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';


import PublicCalendar from './components/PublicCalendar';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

import { UIProvider } from './context/UIContext';


import AdminDashboard from './components/AdminDashboard';
import { useState, useEffect } from 'react';

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const [activeAppView, setActiveAppView] = useState('chat');
  
  useEffect(() => {
    if (user?.role === 'admin') setActiveAppView('admin');
  }, [user]);

  const path = window.location.pathname;

  // Handle Public Routes
  if (path === '/privacy') return <PrivacyPolicy />;
  if (path === '/terms') return <TermsOfService />;

  if (path.startsWith('/calendar/')) {
    const token = path.split('/')[2];
    if (token) {
      return <PublicCalendar token={token} />;
    }
  }

  // Auth Routing
  if (!isAuthenticated) {
    if (path === '/login') return <LoginPage />;
    return <LandingPage />;
  }

  // Authenticated Dashboard
  return (
    <ChatProvider>
      <UIProvider>
        {user?.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <>
            <Layout />
          </>
        )}
      </UIProvider>
    </ChatProvider>
  );
}

export default function App() {
  const content = (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );

  if (GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {content}
      </GoogleOAuthProvider>
    );
  }

  return content;
}
