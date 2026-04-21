import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useGoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(null); // { email, isNewUser }
  const { login, loginWithGoogle, challengeData, setChallengeData, verifySecurityCode } = useAuth();
  const { theme, toggle } = useTheme();

  const handleGoogleAuth = (() => {
    try {
      return useGoogleLogin({
        onSuccess: async (tokenResponse) => {
          setLoading(true);
          setError('');
          const result = await loginWithGoogle(tokenResponse);
          if (result?.pendingApproval) {
            setPendingVerification({ email: result.email, isNewUser: result.isNewUser });
          } else if (!result?.success) {
            setError(result?.error || 'Google Sign-In failed');
          }
          setLoading(false);
        },
        onError: () => setError('Google Sign-In was cancelled or failed'),
        scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.metadata.readonly',
        prompt: 'consent',
      });
    } catch (e) {
      return () => setError('Google Login is currently disabled. Please contact the administrator.');
    }
  })();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    
    setTimeout(async () => {
      const result = await login(email.trim(), password);
      if (!result.success) setError(result.error || 'Login failed');
      setLoading(false);
    }, 400);
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifySecurityCode(challengeData.tempToken, verificationCode);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = (credentialResponse) => {
    const result = loginWithGoogle(credentialResponse);
    if (!result.success) setError(result.error);
  };

  return (
    <div className="login-wrapper">
      {/* Theme toggle (moved outside the card to the top right) */}
      <button
        onClick={toggle}
        title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
        style={{
          position: 'absolute', top: 'clamp(12px, 3vw, 24px)', right: 'clamp(12px, 3vw, 24px)',
          width: 'clamp(32px, 8vw, 38px)', height: 'clamp(32px, 8vw, 38px)', borderRadius: 10,
          background: 'var(--bg-card)', color: 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--border)',
          transition: 'all var(--transition)',
          zIndex: 10
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
      >
        {theme === 'dark'
          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
        }
      </button>
      
      {/* Back to Home link */}
      <button
        onClick={() => window.location.href = '/'}
        style={{
          position: 'absolute', top: 'clamp(12px, 3vw, 24px)', left: 'clamp(12px, 3vw, 24px)',
          background: 'none', border: 'none',
          color: 'var(--text-secondary)', fontSize: 'clamp(0.78rem, 2.5vw, 0.9rem)',
          fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          transition: 'color var(--transition)',
          zIndex: 10
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Home
      </button>


      {/* Main centered panel */}
      <div className="login-form-panel">
        {/* Background ambient glows */}
        <div style={{ position: 'absolute', width: '40vw', height: '40vw', background: 'var(--glow)', borderRadius: '50%', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', filter: 'blur(100px)', opacity: 0.5, pointerEvents: 'none', zIndex: 0 }} />

        <div className="login-card">

          {/* Logo */}
          <div className="login-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>
          </div>

          <h1 style={{ animation: 'fadeUp 0.6s ease-out 0.1s both' }}>
            {challengeData ? 'Security Check' : 'Welcome to ASK.ai'}
          </h1>
          <p style={{
            color: 'var(--text-muted)', fontSize: 'clamp(0.8rem, 2.5vw, 0.94rem)',
            textAlign: 'center', marginBottom: 'clamp(20px, 4vw, 32px)',
            animation: 'fadeUp 0.6s ease-out 0.2s both',
          }}>{challengeData ? `Enter the code sent to ${challengeData.email}` : 'Sign in to your intelligent AI assistant'}</p>

          {/* Error message */}
          {error && (
            <div style={{
              width: '100%',
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.25)',
              color: '#e63946', fontSize: '0.84rem', marginBottom: 18,
              display: 'flex', alignItems: 'center', gap: 8,
              animation: 'fadeUp 0.3s ease-out',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          {challengeData ? (
            /* Security Challenge Form */
            <form onSubmit={handleVerifySubmit} style={{ width: '100%' }}>
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'block', fontSize: '0.82rem', fontWeight: 500,
                  color: 'var(--text-secondary)', marginBottom: 12,
                  textAlign: 'center'
                }}>6-Digit Verification Code</label>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--bg-input)', border: '1.5px solid var(--border)',
                  borderRadius: 16, padding: '12px 20px',
                  transition: 'border-color var(--transition)',
                }}
                  onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                    style={{
                      width: '100%', textAlign: 'center',
                      background: 'none', border: 'none', outline: 'none',
                      color: 'var(--text-primary)', fontSize: 'clamp(1.3rem, 5vw, 1.8rem)',
                      fontFamily: 'monospace', letterSpacing: 'clamp(4px, 2vw, 8px)',
                      fontWeight: 700
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '13px 0',
                  borderRadius: 12,
                  background: 'var(--accent)',
                  color: '#fff', fontSize: '0.95rem', fontWeight: 600,
                  transition: 'all var(--transition)',
                  boxShadow: '0 4px 16px rgba(230,57,70,0.25)',
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginBottom: 16
                }}
              >
                {loading ? (
                  <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                ) : 'Verify Code'}
              </button>

              <button
                type="button"
                onClick={() => setChallengeData(null)}
                style={{
                  width: '100%', background: 'none', border: 'none',
                  color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer',
                  textAlign: 'center', fontWeight: 500
                }}
              >
                Cancel and go back
              </button>
            </form>
          ) : (
            /* Standard Login Form */
            <>
              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                {/* Email */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{
                    display: 'block', fontSize: '0.82rem', fontWeight: 500,
                    color: 'var(--text-secondary)', marginBottom: 6,
                  }}>Email or Username</label>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    background: 'var(--bg-input)', border: '1.5px solid var(--border)',
                    borderRadius: 12, padding: '0 14px',
                    transition: 'border-color var(--transition)',
                  }}
                    onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    <input
                      type="text"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={{
                        flex: 1, padding: 'clamp(8px, 2vw, 12px) 10px',
                        background: 'none', border: 'none', outline: 'none',
                        color: 'var(--text-primary)', fontSize: 'clamp(0.82rem, 2.5vw, 0.9rem)',
                        fontFamily: 'var(--font-main)',
                      }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{
                    display: 'block', fontSize: '0.82rem', fontWeight: 500,
                    color: 'var(--text-secondary)', marginBottom: 6,
                  }}>Password</label>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    background: 'var(--bg-input)', border: '1.5px solid var(--border)',
                    borderRadius: 12, padding: '0 14px',
                    transition: 'border-color var(--transition)',
                    overflow: 'hidden',
                  }}
                    onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        flex: 1, padding: 'clamp(8px, 2vw, 12px) 10px',
                        background: 'none', border: 'none', outline: 'none',
                        color: 'var(--text-primary)', fontSize: 'clamp(0.82rem, 2.5vw, 0.9rem)',
                        fontFamily: 'var(--font-main)',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(p => !p)}
                      style={{
                        background: 'none', border: 'none', padding: 4,
                        color: 'var(--text-muted)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center',
                      }}
                      tabIndex={-1}
                    >
                      {showPass ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: 'clamp(10px, 3vw, 13px) 0',
                    borderRadius: 12,
                    background: 'var(--accent)',
                    color: '#fff', fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)', fontWeight: 600,
                    transition: 'all var(--transition)',
                    boxShadow: '0 4px 16px rgba(230,57,70,0.25)',
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {loading ? (
                    <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  ) : 'Sign In'}
                </button>
              </form>

              {/* Divider */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                margin: '24px 0', width: '100%'
              }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              {/* Unified Google Login & Authorization */}
              <div style={{ width: '100%', animation: 'fadeUp 0.6s ease-out 0.4s both' }}>
                <button
                  onClick={() => handleGoogleAuth()}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: 'clamp(9px, 2.5vw, 12px) 0',
                    borderRadius: 12,
                    background: theme === 'dark' ? '#fff' : '#1a1a1b',
                    color: theme === 'dark' ? '#1a1a1b' : '#fff',
                    fontSize: 'clamp(0.82rem, 2.5vw, 0.9rem)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>
              </div>

              {/* Privacy & Terms Links for Google Verification */}
              <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: 12, justifyContent: 'center' }}>
                <a href="/privacy" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Privacy Policy</a>
                <span>•</span>
                <a href="/terms" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Terms of Service</a>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Admin Pending Verification Banner ── */}
      {pendingVerification && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '0 16px 32px',
            pointerEvents: 'none',
          }}
        >
          {/* Backdrop blur hint */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(4px)',
            pointerEvents: 'all',
          }}
            onClick={() => setPendingVerification(null)}
          />

          {/* Toast card */}
          <div
            style={{
              position: 'relative',
              pointerEvents: 'all',
              background: 'var(--bg-card)',
              border: '1px solid rgba(250,189,0,0.35)',
              borderRadius: 'clamp(14px, 3vw, 20px)',
              padding: 'clamp(18px, 4vw, 28px) clamp(16px, 4vw, 32px)',
              maxWidth: 420,
              width: '100%',
              boxShadow: '0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(250,189,0,0.1)',
              animation: 'slideUpBanner 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {/* Glow accent */}
            <div style={{
              position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
              width: 160, height: 3,
              background: 'linear-gradient(90deg, transparent, #fabd00, transparent)',
              borderRadius: 2,
            }} />

            {/* Spinner + Icon */}
            <div style={{ position: 'relative', width: 56, height: 56 }}>
              <div style={{
                position: 'absolute', inset: 0,
                border: '3px solid rgba(250,189,0,0.15)',
                borderTopColor: '#fabd00',
                borderRadius: '50%',
                animation: 'spin 1.2s linear infinite',
              }} />
              <div style={{
                position: 'absolute', inset: 8,
                background: 'rgba(250,189,0,0.12)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fabd00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
            </div>

            {/* Headline */}
            <div style={{ textAlign: 'center' }}>
              <h2 style={{
                color: 'var(--text-primary)',
                fontSize: '1.15rem',
                fontWeight: 700,
                margin: '0 0 6px',
                letterSpacing: '-0.01em',
              }}>
                {pendingVerification.isNewUser ? '🎉 Account Created!' : '⏳ Account Pending'}
              </h2>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.88rem',
                lineHeight: 1.6,
                margin: 0,
              }}>
                {pendingVerification.isNewUser
                  ? 'Your Google account has been registered. An admin needs to approve your access before you can sign in.'
                  : 'Your account is still awaiting admin approval. You\'ll be notified once access is granted.'}
              </p>
            </div>

            {/* Email pill */}
            {pendingVerification.email && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(250,189,0,0.08)',
                border: '1px solid rgba(250,189,0,0.2)',
                borderRadius: 100,
                padding: '6px 14px',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fabd00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span style={{ fontSize: '0.82rem', color: '#fabd00', fontWeight: 600 }}>{pendingVerification.email}</span>
              </div>
            )}

            {/* Status steps */}
            <div style={{
              width: '100%',
              background: 'var(--bg-input)',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              {[
                { done: true,  label: 'Google account connected' },
                { done: true,  label: 'Registration received' },
                { done: false, label: 'Waiting for admin approval', active: true },
                { done: false, label: 'Access granted' },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: step.done ? 'rgba(52,200,89,0.15)'
                      : step.active ? 'rgba(250,189,0,0.15)' : 'rgba(120,120,140,0.1)',
                    border: `1.5px solid ${
                      step.done ? 'rgba(52,200,89,0.5)'
                      : step.active ? 'rgba(250,189,0,0.5)' : 'rgba(120,120,140,0.2)'
                    }`,
                    animation: step.active ? 'pulse 2s ease-in-out infinite' : 'none',
                  }}>
                    {step.done ? (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#34c859" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : step.active ? (
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fabd00' }} />
                    ) : null}
                  </div>
                  <span style={{
                    fontSize: '0.82rem',
                    color: step.done ? 'var(--text-secondary)'
                      : step.active ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: step.active ? 600 : 400,
                  }}>{step.label}</span>
                </div>
              ))}
            </div>

            {/* Dismiss */}
            <button
              onClick={() => setPendingVerification(null)}
              style={{
                width: '100%', padding: '10px 0',
                borderRadius: 10,
                background: 'rgba(250,189,0,0.1)',
                border: '1px solid rgba(250,189,0,0.25)',
                color: '#fabd00', fontSize: '0.88rem', fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(250,189,0,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(250,189,0,0.1)'}
            >
              Got it — I\'ll wait for approval
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
