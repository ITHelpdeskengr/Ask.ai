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
  const [googleAuthError, setGoogleAuthError] = useState(null);

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
    // Handle admin approval pending
    if (data.pendingApproval) {
      setGoogleAuthPending({ isNewUser: data.isNewUser, email: data.email });
      return { success: false, pendingApproval: true };
    }

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

  // ── Login Google hook using credential/idToken flow (no postmessage needed) ──
  // This uses the popup that returns a credential (idToken) directly,
  // which the backend already supports via the idToken path.
  const handleGoogleCredential = useCallback(async (credentialResponse) => {
    setGoogleAuthLoading(true);
    setGoogleAuthPending(null);
    setGoogleAuthError(null);
    try {
      const { data } = await api.post('/auth/google', { idToken: credentialResponse.credential });
      if (data.pendingApproval) {
        setGoogleAuthPending({ isNewUser: data.isNewUser, email: data.email });
      } else {
        const authResult = handleAuthResponse(data);
        if (!authResult.success && !authResult.requireVerification) {
          setGoogleAuthError('Google Sign-In failed. Please try again.');
        }
      }
    } catch (err) {
      setGoogleAuthError(err.response?.data?.error || 'Google Sign-In failed. Please try again.');
    } finally {
      setGoogleAuthLoading(false);
    }
  }, [handleAuthResponse]);

  const handleGoogleCredentialError = useCallback(() => {
    setGoogleAuthError('Google Sign-In was cancelled or failed.');
    setGoogleAuthLoading(false);
  }, []);

  // loginAndAuthorizeWithGoogle is kept for backward-compat (used in LoginPage)
  const loginAndAuthorizeWithGoogle = { handleGoogleCredential, handleGoogleCredentialError };

  // ── Full-scope Google hook (Gmail / Calendar / Drive) ──────────────────────
  // Requested only when user explicitly opens Calendar or Gmail features.
  const requestGoogleAccessHook = useGoogleLogin({
    flow: 'implicit',
    scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.metadata.readonly',
    onSuccess: async (tokenResponse) => {
      if (tokenResponse.access_token) {
        setGoogleToken(tokenResponse.access_token);
      }
    },
    onError: (error) => {
      console.error('[GOOGLE ACCESS] Error:', error);
    },
  });

  const requestGoogleAccess = requestGoogleAccessHook;

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
      googleAuthError,
      setGoogleAuthError,
      googleToken,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
