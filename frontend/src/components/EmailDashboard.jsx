import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

export default function EmailDashboard({ onClose }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { googleToken, requestGoogleAccess } = useAuth();

  useEffect(() => {
    if (googleToken) {
      fetchEmails();
    } else {
      setLoading(false);
      setError('Google Workspace access is required to view your emails.');
    }
  }, [googleToken]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/gmail/list', {
        headers: { 'x-google-token': googleToken }
      });
      setEmails(data.emails || []);
      setLoading(false);
    } catch (err) {
      console.error('[EMAIL DASHBOARD ERROR]', err);
      const status = err.response?.status;
      if (status === 401 || status === 400) {
        setError('Your Google session has expired. Please re-authorize.');
      } else {
        setError('Failed to fetch emails. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleAuthorize = () => {
    requestGoogleAccess();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: '20px'
    }}>
      <div style={{
        width: '100%', maxWidth: '900px', height: '90vh',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '24px', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 32px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(to right, var(--bg-hover), transparent)'
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.8rem' }}>📧</span> My Inbox
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Latest messages from Gmail</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              onClick={fetchEmails}
              disabled={loading}
              style={{
                padding: '8px 16px', borderRadius: '10px',
                background: 'var(--bg-hover)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem',
                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              🔄 Refresh
            </button>
            <button onClick={onClose} style={{
              background: 'transparent', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem',
              width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>✕</button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
               <div className="dash-spinner"></div>
               <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Syncing with Google...</span>
            </div>
          ) : error ? (
             <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' }}>
                <div style={{ maxWidth: '400px' }}>
                   <span style={{ fontSize: '3rem', display: 'block', marginBottom: '20px' }}>⚠️</span>
                   <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>{error}</h3>
                   {error.includes('expire') || error.includes('authorized') ? (
                     <button 
                        onClick={handleAuthorize}
                        style={{ 
                          marginTop: '12px', padding: '12px 28px', borderRadius: '12px', 
                          background: 'var(--accent)', color: 'white', border: 'none', fontWeight: 600,
                          cursor: 'pointer', boxShadow: '0 4px 12px var(--glow)'
                        }}
                     >Authorize Workspace</button>
                   ) : (
                     <button 
                        onClick={fetchEmails}
                        style={{ 
                          marginTop: '12px', padding: '12px 28px', borderRadius: '12px', 
                          background: 'var(--accent)', color: 'white', border: 'none', fontWeight: 600,
                          cursor: 'pointer'
                        }}
                     >Retry Sync</button>
                   )}
                </div>
             </div>
          ) : emails.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
               <span style={{ fontSize: '4rem', opacity: 0.3 }}>📬</span>
               <h3 style={{ color: 'var(--text-muted)' }}>Your inbox is completely clear!</h3>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {emails.map(email => (
                <a 
                  key={email.id} 
                  href={`https://mail.google.com/mail/u/0/#inbox/${email.id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '20px 24px', background: 'var(--bg-input)',
                    border: '1px solid var(--border)', borderRadius: '18px',
                    display: 'flex', alignItems: 'flex-start', gap: '16px',
                    transition: 'all 0.2s', textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    background: 'rgba(230, 57, 70, 0.1)', color: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', flexShrink: 0
                  }}>
                    {email.from.charAt(0).toUpperCase()}
                  </div>
                  
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {email.from}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {email.subject || '(No Subject)'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {email.snippet}
                    </div>
                  </div>

                  <div style={{ alignSelf: 'center', opacity: 0.5 }}>
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                     </svg>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .dash-spinner {
          width: 32px; height: 32px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: dspin 0.8s linear infinite;
        }
        @keyframes dspin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
