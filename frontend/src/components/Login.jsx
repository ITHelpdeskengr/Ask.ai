import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import SecurityChallenge from './SecurityChallenge';

export default function Login() {
  const { login, register, loginWithGoogle, challengeData, setChallengeData, verifySecurityCode } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    let result;
    if (isRegister) {
      result = await register(name, email, password);
    } else {
      result = await login(email, password);
    }

    if (!result.success && !result.requireVerification) {
      setError(result.error);
      setLoading(false);
    }
  };

  if (challengeData) {
    return (
      <SecurityChallenge 
        email={challengeData.email}
        tempToken={challengeData.tempToken}
        onVerify={verifySecurityCode}
        onCancel={() => setChallengeData(null)}
      />
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-section">
            <span className="logo-icon">✨</span>
            <h1>Ask.ai</h1>
          </div>
          <p>{isRegister ? 'Create your secure account' : 'Welcome back, please sign in'}</p>
        </div>

        <div className="login-tabs">
          <button 
            className={!isRegister ? 'active' : ''} 
            onClick={() => { setIsRegister(false); setError(null); }}
          >Sign In</button>
          <button 
            className={isRegister ? 'active' : ''} 
            onClick={() => { setIsRegister(true); setError(null); }}
          >Sign Up</button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isRegister && (
            <div className="input-group">
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Processing...' : (isRegister ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="divider">
          <span>OR CONTINUE WITH</span>
        </div>

        <div className="social-login">
          <GoogleLogin
            onSuccess={loginWithGoogle}
            onError={() => setError('Google Sign-In failed')}
            useOneTap
            theme="filled_blue"
            shape="pill"
            width="100%"
          />
        </div>
      </div>

      <style>{`
        .login-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: var(--bg-surface);
          padding: 20px;
        }
        .login-card {
          background: var(--bg-card);
          padding: 40px;
          border-radius: 24px;
          width: 100%;
          maxWidth: 440px;
          border: 1px solid var(--border);
          boxShadow: 0 20px 50px rgba(0,0,0,0.2);
        }
        .login-header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo-section {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .logo-icon {
          font-size: 2rem;
          text-shadow: 0 0 15px var(--glow);
        }
        .login-header h1 {
          font-size: 2rem;
          font-weight: 800;
          margin: 0;
          background: linear-gradient(135deg, var(--accent), #70e0ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .login-header p {
          color: var(--text-muted);
          font-size: 0.95rem;
        }
        .login-tabs {
          display: flex;
          background: var(--bg-hover);
          padding: 5px;
          border-radius: 12px;
          margin-bottom: 25px;
        }
        .login-tabs button {
          flex: 1;
          padding: 10px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-weight: 600;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .login-tabs button.active {
          background: var(--bg-card);
          color: var(--accent);
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .login-form .input-group {
          margin-bottom: 20px;
        }
        .login-form label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--text-secondary);
        }
        .login-form input {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--bg-input);
          color: var(--text-primary);
          transition: border-color 0.2s;
        }
        .login-form input:focus {
          border-color: var(--accent);
          outline: none;
        }
        .error-message {
          color: #ff4d4f;
          font-size: 0.85rem;
          margin-bottom: 20px;
          padding: 10px;
          background: rgba(255,77,79,0.1);
          border-radius: 8px;
          text-align: center;
        }
        .login-btn {
          width: 100%;
          padding: 14px;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px var(--glow);
        }
        .login-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.1);
        }
        .divider {
          display: flex;
          align-items: center;
          margin: 30px 0;
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 1px;
        }
        .divider::before, .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .divider span {
          padding: 0 15px;
        }
        .social-login {
          display: flex;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
