import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../utils/api';

const AuthContext = createContext();

const STORAGE_KEY = 'ask_ai_user';
const GMAIL_TOKEN_KEY = 'ask_ai_google_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [googleToken, setGoogleToken] = useState(() => {
    return localStorage.getItem(GMAIL_TOKEN_KEY) || null;
  });

  const [challengeData, setChallengeData] = useState(null);
  const [googleAuthPending, setGoogleAuthPending] = useState(null);
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(GMAIL_TOKEN_KEY);
      setGoogleToken(null);
    }
  }, [user]);

  useEffect(() => {
    if (googleToken) localStorage.setItem(GMAIL_TOKEN_KEY, googleToken);
    else localStorage.removeItem(GMAIL_TOKEN_KEY);
  }, [googleToken]);

  const handleAuthResponse = useCallback((data) => {
    if (data.requireVerification) {
      setChallengeData({
        tempToken: data.tempToken,
        email: data.email
      });
      return { requireVerification: true };
    }

    const u = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      avatar: data.user.avatar,
      role: data.user.role,
      token: data.token
    };
    setUser(u);
    return { success: true };
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      return handleAuthResponse(data);
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
  }, [handleAuthResponse]);

  const register = useCallback(async (name, email, password) => {
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      return handleAuthResponse(data);
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Registration failed' };
    }
  }, [handleAuthResponse]);

  const loginWithGoogle = useCallback(async (response) => {
    try {
      const payload = {};
      
      // Handle either Auth Code or Tokens for backward/forward compatibility
      if (response.code) {
        payload.code = response.code;
        payload.state = response.originalState;
      }
      if (response.credential) payload.idToken = response.credential;
      if (response.access_token) payload.accessToken = response.access_token;
      
      const { data } = await api.post('/auth/google', payload);

      // Handle pending admin approval (new or returning pending user)
      if (data.pendingApproval) {
        return { success: false, pendingApproval: true, isNewUser: data.isNewUser, email: data.email };
      }

      const authResult = handleAuthResponse(data);
      
      // If the backend sent back a new access token (standard with Code Flow), save it
      if (data.accessToken) {
        setGoogleToken(data.accessToken);
      } else if (response.access_token) {
        setGoogleToken(response.access_token);
      }
      
      return authResult;
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Google Sign-In failed' };
    }
  }, [handleAuthResponse]);

  const verifySecurityCode = useCallback(async (tempToken, code) => {
    try {
      const { data } = await api.post('/auth/verify-security-code', { tempToken, code });
      setChallengeData(null);
      return handleAuthResponse(data);
    } catch (err) {
      throw err; // Let the component handle the specific error
    }
  }, [handleAuthResponse]);

  // Handle Google Auth safely - move to top level to comply with React Hook rules
  const loginAndAuthorizeWithGoogle = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      setGoogleAuthLoading(true);
      setGoogleAuthPending(null);
      const result = await loginWithGoogle(codeResponse);
      setGoogleAuthLoading(false);
      if (result.pendingApproval) {
        setGoogleAuthPending({ isNewUser: result.isNewUser, email: result.email });
      }
    },
    onError: (error) => {
      console.error('[GOOGLE AUTH] Error:', error);
      setGoogleAuthLoading(false);
    },
    scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.metadata.readonly',
    prompt: 'consent',
  });

  const requestGoogleAccess = loginAndAuthorizeWithGoogle;

  const updateProfile = useCallback((updatedUser, newToken) => {
    setUser(prev => ({
      ...prev,
      ...updatedUser,
      token: newToken || prev?.token
    }));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setGoogleToken(null);
    setChallengeData(null);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register,
      loginWithGoogle, 
      verifySecurityCode,
      challengeData,
      setChallengeData,
      logout,
      updateProfile,
      requestGoogleAccess,
      loginAndAuthorizeWithGoogle,
      googleAuthPending,
      setGoogleAuthPending,
      googleAuthLoading,
      googleToken,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
