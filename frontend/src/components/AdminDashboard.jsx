import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user: currentUser, logout, updateProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState('analytics');
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Delegated workspaces state
  const [selectedUser, setSelectedUser] = useState(null);
  const [userEmails, setUserEmails] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [viewMode, setViewMode] = useState('emails');
  const [fetchingData, setFetchingData] = useState(false);

  // Theme support
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme') || 'dark');
  const [showSignoutModal, setShowSignoutModal] = useState(false);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [usersRes, analyticsRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/auth/admin/analytics').catch(() => ({ data: { analytics: null } })) // Fallback if route issue
      ]);
      setUsers(usersRes.data.users);
      if (analyticsRes.data.analytics) setAnalytics(analyticsRes.data.analytics);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch admin data. Ensure you are logged in as an Admin.');
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId, status) => {
    try {
      await api.put(`/auth/users/${userId}/status`, { status });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, registrationStatus: status } : u));
      // Refresh analytics
      if (activeTab === 'analytics') fetchInitialData();
    } catch (err) {
      alert('Failed to update user status.');
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete the user ${name}?`)) return;
    try {
      await api.delete(`/auth/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
      if (activeTab === 'analytics') fetchInitialData();
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to delete user.');
    }
  };

  const selectUser = (email) => {
    setSelectedUser(email);
    if (viewMode === 'emails') fetchUserEmails(email);
    else fetchUserEvents(email);
  };

  const fetchUserEmails = async (email) => {
    try {
      setFetchingData(true);
      setUserEmails([]);
      const { data } = await api.get(`/gmail/admin/list/${email}`);
      setUserEmails(data.emails);
    } catch (err) {
      console.error('Error fetching emails', err);
    } finally {
      setFetchingData(false);
    }
  };

  const fetchUserEvents = async (email) => {
    try {
      setFetchingData(true);
      setUserEvents([]);
      const { data } = await api.get(`/calendar/admin/list/${email}`);
      setUserEvents(data.events);
    } catch (err) {
      console.error('Error fetching events', err);
    } finally {
      setFetchingData(false);
    }
  };

  const changeViewMode = (mode) => {
    setViewMode(mode);
    if (selectedUser) {
      if (mode === 'emails') fetchUserEmails(selectedUser);
      else fetchUserEvents(selectedUser);
    }
  };

  const tabs = [
    { id: 'analytics', label: '📊 Analytics' },
    { id: 'verification', label: '🛡️ Verification' },
    { id: 'knowledge', label: '🧠 Knowledge Base' },
    { id: 'profile', label: '👤 Profile' },
  ];

  const renderContent = () => {
    if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading portal...</div>;
    if (error) return <div style={{ padding: 20, color: '#ff4d4f' }}>{error}</div>;

    switch (activeTab) {
      case 'analytics':
        return (
          <div style={{ padding: 30 }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-primary)', marginBottom: 24 }}>System Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              {[
                { label: 'Total Users', value: analytics?.totalUsers || users.length, color: '#1d6ce8' },
                { label: 'Pending Approvals', value: analytics?.pendingUsers || users.filter(u => u.registrationStatus === 'pending').length, color: '#f39c12' },
                { label: 'Verified Users', value: analytics?.verifiedUsers || users.filter(u => u.registrationStatus === 'approved').length, color: '#2ec4b6' },
                { label: 'Total Conversations', value: analytics?.totalSessions || '0', color: '#9b59b6' },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: 'var(--bg-input)', border: '1px solid var(--border)',
                  borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column', gap: 10
                }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{stat.label}</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'verification':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '20px 30px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>User Verification Hub</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Accept or reject new platform registrations.</p>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} className="table-container">
              <div style={{ background: 'var(--bg-input)', borderRadius: 12, border: '1px solid var(--border)', overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>User</th>
                      <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Role</th>
                      <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status</th>
                      <th style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {u.role.toUpperCase()}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600,
                            background: u.registrationStatus === 'approved' || u.isVerified ? 'rgba(46,196,182,0.1)' : u.registrationStatus === 'rejected' ? 'rgba(230,57,70,0.1)' : 'rgba(243,156,18,0.1)',
                            color: u.registrationStatus === 'approved' || u.isVerified ? '#2ec4b6' : u.registrationStatus === 'rejected' ? 'var(--accent)' : '#f39c12'
                          }}>
                            {u.registrationStatus ? u.registrationStatus.toUpperCase() : (u.isVerified ? 'APPROVED (LEGACY)' : 'PENDING')}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              {(u.registrationStatus === 'pending' || !u.registrationStatus) && (
                                <>
                                  <button onClick={() => handleUpdateStatus(u._id, 'approved')} style={{
                                    padding: '6px 14px', background: '#2ec4b6', color: '#fff', borderRadius: 6, fontWeight: 600, fontSize: '0.8rem', border: 'none', cursor: 'pointer'
                                  }}>Accept</button>
                                  <button onClick={() => handleUpdateStatus(u._id, 'rejected')} style={{
                                    padding: '6px 14px', background: 'var(--bg-hover)', color: 'var(--accent)', borderRadius: 6, fontWeight: 600, fontSize: '0.8rem', border: '1px solid var(--border)', cursor: 'pointer'
                                  }}>Reject</button>
                                </>
                              )}
                              {u.registrationStatus === 'approved' && (
                                 <button onClick={() => handleUpdateStatus(u._id, 'rejected')} style={{
                                    padding: '6px 14px', background: 'transparent', color: 'var(--text-muted)', borderRadius: 6, fontWeight: 600, fontSize: '0.8rem', border: '1px solid var(--border)', cursor: 'pointer'
                                  }}>Revoke Access</button>
                              )}
                              {u.registrationStatus === 'rejected' && (
                                 <button onClick={() => handleUpdateStatus(u._id, 'approved')} style={{
                                    padding: '6px 14px', background: 'transparent', color: 'var(--text-muted)', borderRadius: 6, fontWeight: 600, fontSize: '0.8rem', border: '1px solid var(--border)', cursor: 'pointer'
                                  }}>Restore Access</button>
                              )}
                            </div>
                            
                            <button title="Delete User" onClick={() => handleDeleteUser(u._id, u.name)} style={{
                              padding: '6px', background: 'transparent', color: 'var(--accent)', borderRadius: 6, border: 'none', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s'
                            }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,57,70,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan="4" style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>No users found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'knowledge':
        return <KnowledgeBaseTab />;

      case 'profile':
        return <ProfileTab currentUser={currentUser} users={users} updateProfile={updateProfile} />;

      default: return null;
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: '100vw', height: '100vh',
      background: 'var(--bg-base)',
      overflow: 'hidden'
    }}>
        <div className="admin-header" style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(to right, var(--bg-hover), transparent)', flexShrink: 0,
          gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', flexShrink: 0 }}>🛡️</span> Admin Command Center
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <button onClick={toggleTheme} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)',
              padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', fontSize: '1.1rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
            }} title="Toggle Theme" onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        <div className="admin-layout" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Navigation Sidebar */}
          <div className="admin-sidebar" style={{ width: 260, borderRight: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', padding: '16px 12px' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  borderRadius: 12, border: 'none', background: activeTab === tab.id ? 'var(--bg-hover)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                  fontWeight: activeTab === tab.id ? 700 : 500, fontSize: '0.95rem',
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', marginBottom: 4
                }}
              >
                {tab.label}
              </button>
            ))}
            
            {/* Sidebar Bottom Action */}
            <button className="admin-signout-btn" onClick={() => setShowSignoutModal(true)} style={{
              marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              borderRadius: 12, border: 'none', background: 'transparent',
              color: '#e63946', fontWeight: 600, fontSize: '0.95rem',
              cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
            }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,57,70,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Sign Out</span>
            </button>
          </div>

          {/* Main Content Area */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {renderContent()}
          </div>
        </div>

      <style>{`
        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        @media (max-width: 768px) {
          .admin-header {
            padding: 14px 16px !important;
          }
          .admin-layout { flex-direction: column !important; }
          .admin-sidebar { 
            width: 100% !important; 
            border-right: none !important; 
            border-bottom: 1px solid var(--border) !important; 
            flex-direction: row !important; 
            overflow-x: auto; 
            padding: 8px 12px !important;
            gap: 4px;
            align-items: center;
          }
          .admin-sidebar button { 
            white-space: nowrap; 
            margin-bottom: 0 !important; 
            margin-right: 4px;
            padding: 10px 14px !important;
            font-size: 0.85rem !important;
            flex-shrink: 0;
          }
          .admin-signout-btn {
            margin-top: 0 !important;
            margin-left: auto !important;
          }
          .admin-sidebar::-webkit-scrollbar { height: 4px; }
          .table-container { padding: 12px !important; }
          
          .workspaces-layout { flex-direction: column !important; }
          .workspaces-users { 
            width: 100% !important; 
            border-right: none !important; 
            border-bottom: 1px solid var(--border); 
            display: flex !important; 
            overflow-x: auto !important; 
            overflow-y: hidden !important; 
            max-height: 80px !important;
          }
          .workspaces-users::-webkit-scrollbar { height: 4px; }
          .workspace-user-item { 
            border-bottom: none !important; 
            border-right: 1px solid var(--border); 
            min-width: 180px; 
            border-left: none !important;
            border-top: 4px solid transparent; 
          }
          .workspace-user-item.active {
            border-top: 4px solid var(--accent) !important;
          }
          .admin-knowledge-sync-row {
            flex-direction: column !important;
          }
          .admin-knowledge-sync-row input {
            width: 100% !important;
          }
          .admin-knowledge-sync-row button {
            width: 100% !important;
            padding: 12px !important;
            justify-content: center !important;
          }
          .admin-profile-card {
            padding: 24px 16px !important;
          }
        }
      `}</style>
      
      {/* Sign Out Modal Overlay */}
      {showSignoutModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--bg-surface)', padding: '36px 40px', borderRadius: '24px',
            width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center',
            boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{
              width: 56, height: 56, background: 'rgba(230, 57, 70, 0.1)',
              borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#e63946', marginBottom: 20
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </div>
            
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4rem', color: 'var(--text-primary)', fontWeight: 800 }}>Sign Out</h3>
            <p style={{ margin: '0 0 32px 0', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.98rem', lineHeight: 1.5 }}>
              Are you sure you want to log out of your account?
            </p>

            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button onClick={() => setShowSignoutModal(false)} style={{
                flex: 1, padding: '14px 0', borderRadius: '12px',
                background: 'var(--bg-input)', color: 'var(--text-primary)', border: 'none',
                fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'background 0.2s'
              }} onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-input)'}>
                No, stay
              </button>
              <button onClick={() => { setShowSignoutModal(false); logout(); }} style={{
                flex: 1, padding: '14px 0', borderRadius: '12px',
                background: 'var(--accent)', color: '#fff', border: 'none',
                fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'filter 0.2s'
              }} onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}>
                Yes, sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Standalone Profile Edit Tab ─────────────────────────────── */
function ProfileTab({ currentUser, users, updateProfile }) {
  const [name, setName] = useState(currentUser?.name || '');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const EyeIcon = ({ show }) => show ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );

  const inputStyle = {
    flex: 1, padding: '11px 12px',
    background: 'none', border: 'none', outline: 'none',
    color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit',
  };

  const fieldWrap = (focusRef) => ({
    display: 'flex', alignItems: 'center',
    background: 'var(--bg-input)', border: '1.5px solid var(--border)',
    borderRadius: 12, padding: '0 12px',
    transition: 'border-color 0.2s',
    overflow: 'hidden',
  });

  const handleSave = async () => {
    setError(''); setSuccess('');
    if (!name.trim()) { setError('Username cannot be empty.'); return; }
    if (newPass && newPass !== confirmPass) { setError('New passwords do not match.'); return; }
    if (newPass && newPass.length < 6) { setError('New password must be at least 6 characters.'); return; }
    if (newPass && !currentPass) { setError('Enter your current password to change it.'); return; }

    setLoading(true);
    try {
      const payload = { name };
      if (newPass) { payload.currentPassword = currentPass; payload.newPassword = newPass; }
      const { data } = await api.put('/auth/profile', payload);
      updateProfile(data.user, data.token);
      setSuccess('✅ Profile updated successfully!');
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const Label = ({ children }) => (
    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
      {children}
    </label>
  );

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 40px)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div className="admin-profile-card" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 24, padding: 'clamp(20px, 4vw, 40px)', width: '100%', maxWidth: 800, margin: '0 auto',
        boxShadow: '0 12px 48px rgba(0,0,0,0.12)',
      }}>

        {/* Avatar + badge */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%', background: 'var(--accent)',
            margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.4rem', color: '#fff', overflow: 'hidden',
            boxShadow: '0 6px 24px rgba(230,57,70,0.3)',
          }}>
            {currentUser?.avatar
              ? <img src={currentUser.avatar} alt="Admin" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : '🛡️'}
          </div>
          <div style={{
            display: 'inline-block', background: 'rgba(230,57,70,0.1)',
            color: 'var(--accent)', padding: '4px 14px', borderRadius: 99,
            fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em',
          }}>ADMINISTRATOR</div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{users.length}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Managed</div>
            </div>
          </div>
        </div>

        {/* Section title */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', color: 'var(--text-primary)' }}>Edit Profile</h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Update your display name or change your login password.</p>
        </div>

        {/* Feedback banners */}
        {success && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 18,
            background: 'rgba(46,196,182,0.08)', border: '1px solid rgba(46,196,182,0.3)',
            color: '#2ec4b6', fontSize: '0.85rem', animation: 'fadeUp 0.3s ease-out',
          }}>{success}</div>
        )}
        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 18,
            background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.25)',
            color: '#e63946', fontSize: '0.85rem', animation: 'fadeUp 0.3s ease-out',
          }}>{error}</div>
        )}

        {/* ── Username ── */}
        <div style={{ marginBottom: 16 }}>
          <Label>Display Name</Label>
          <div style={fieldWrap()}
            onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <input
              value={name}
              onChange={e => { setName(e.target.value); setSuccess(''); setError(''); }}
              placeholder="Display name"
              style={inputStyle}
            />
          </div>
        </div>

        {/* ── Email (read-only) ── */}
        <div style={{ marginBottom: 24 }}>
          <Label>Email Address <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(read-only)</span></Label>
          <div style={{ ...fieldWrap(), opacity: 0.6, cursor: 'not-allowed' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
            </svg>
            <input readOnly value={currentUser?.email || ''} style={{ ...inputStyle, cursor: 'not-allowed' }} />
          </div>
        </div>

        {/* ── Change Password ── */}
        <div style={{
          background: 'var(--bg-input)', borderRadius: 16, padding: 20,
          border: '1px solid var(--border)', marginBottom: 24,
        }}>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Change Password</span>
          </div>

          {/* Current password */}
          <div style={{ marginBottom: 12 }}>
            <Label>Current Password</Label>
            <div style={fieldWrap()}
              onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <input
                type={showCurrentPass ? 'text' : 'password'}
                value={currentPass}
                onChange={e => { setCurrentPass(e.target.value); setSuccess(''); setError(''); }}
                placeholder="Enter current password"
                style={inputStyle}
              />
              <button type="button" onClick={() => setShowCurrentPass(p => !p)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
                <EyeIcon show={showCurrentPass} />
              </button>
            </div>
          </div>

          {/* New password */}
          <div style={{ marginBottom: 12 }}>
            <Label>New Password</Label>
            <div style={fieldWrap()}
              onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <input
                type={showNewPass ? 'text' : 'password'}
                value={newPass}
                onChange={e => { setNewPass(e.target.value); setSuccess(''); setError(''); }}
                placeholder="Min. 6 characters"
                style={inputStyle}
              />
              <button type="button" onClick={() => setShowNewPass(p => !p)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
                <EyeIcon show={showNewPass} />
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <Label>Confirm New Password</Label>
            <div style={{
              ...fieldWrap(),
              borderColor: confirmPass && newPass !== confirmPass ? 'rgba(230,57,70,0.6)' : 'var(--border)',
            }}
              onFocusCapture={e => e.currentTarget.style.borderColor = confirmPass && newPass !== confirmPass ? 'rgba(230,57,70,0.6)' : 'var(--accent)'}
              onBlurCapture={e => e.currentTarget.style.borderColor = confirmPass && newPass !== confirmPass ? 'rgba(230,57,70,0.4)' : 'var(--border)'}
            >
              <input
                type={showConfirmPass ? 'text' : 'password'}
                value={confirmPass}
                onChange={e => { setConfirmPass(e.target.value); setSuccess(''); setError(''); }}
                placeholder="Re-enter new password"
                style={inputStyle}
              />
              <button type="button" onClick={() => setShowConfirmPass(p => !p)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
                <EyeIcon show={showConfirmPass} />
              </button>
            </div>
            {confirmPass && newPass !== confirmPass && (
              <p style={{ margin: '4px 0 0 2px', fontSize: '0.76rem', color: '#e63946' }}>Passwords do not match</p>
            )}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            width: '100%', padding: '13px 0',
            background: 'var(--accent)', color: '#fff',
            borderRadius: 12, fontWeight: 700, fontSize: '0.95rem',
            border: 'none', cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(230,57,70,0.25)',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          {loading
            ? <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            : <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                </svg>
                Save Changes
              </>
          }
        </button>
      </div>
    </div>
  );
}

/* ── Knowledge Base Tab ─────────────────────────────────── */
function KnowledgeBaseTab() {
  const { googleToken, requestGoogleAccess } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Personal Drive Sync State
  const [personalFolderId, setPersonalFolderId] = useState('');
  const [personalSyncing, setPersonalSyncing] = useState(false);
  const [personalSyncMsg, setPersonalSyncMsg] = useState(null); // { type: 'success'|'error', text }

  // Service Account Sync State (legacy)
  const [driveConfig, setDriveConfig] = useState({ folderId: '', isConfigured: false, lastSyncTime: null });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchDriveConfig();
  }, []);

  const fetchDriveConfig = async () => {
    try {
      const { data } = await api.get('/knowledge/sync-config');
      setDriveConfig({ 
        folderId: data.folderId, 
        isConfigured: data.isServiceAccountConfigured, 
        lastSyncTime: data.lastSyncTime 
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handlePersonalDriveSync = async () => {
    if (!personalFolderId.trim()) {
      setPersonalSyncMsg({ type: 'error', text: 'Please enter a Google Drive Folder ID first.' });
      return;
    }
    try {
      setPersonalSyncing(true);
      setPersonalSyncMsg(null);
      const { data } = await api.post('/knowledge/sync-personal-drive',
        { folderId: personalFolderId.trim() },
        { headers: { 'x-google-token': googleToken } }
      );
      setPersonalSyncMsg({ type: 'success', text: data.message });
      fetchDocuments();
    } catch (err) {
      const msg = err.response?.data?.error || 'Sync failed. Please try again.';
      setPersonalSyncMsg({ type: 'error', text: msg });
    } finally {
      setPersonalSyncing(false);
    }
  };

  const handleDriveSync = async () => {
    try {
      setSyncing(true);
      const { data } = await api.post('/knowledge/sync-config', { folderId: driveConfig.folderId });
      fetchDocuments();
      fetchDriveConfig();
      alert(data.message);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to execute Google Drive Sync.');
    } finally {
      setSyncing(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data } = await api.get('/knowledge');
      setDocuments(data.documents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      alert('Only PDF, DOCX, and TXT files are allowed.');
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);

    try {
      setUploading(true);
      const { data } = await api.post('/knowledge/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDocuments(prev => [data.document, ...prev]);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload document.');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}" from the system knowledge base?`)) return;
    try {
      await api.delete(`/knowledge/${id}`);
      setDocuments(prev => prev.filter(d => d._id !== id));
    } catch (err) {
      alert('Failed to delete document.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'clamp(16px, 4vw, 30px)' }}>
      {/* Header */}
      <h3 style={{ marginTop: 0, color: 'var(--text-primary)', marginBottom: 8 }}>Knowledge Base 🧠</h3>
      <p style={{ margin: '0 0 24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        Upload files manually or configure an automated Google Drive sync. The AI Assistant will natively read these files to answer questions system-wide.
      </p>

      {/* ── Personal Google Drive Sync ── */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16,
        padding: 'clamp(16px, 3vw, 30px)', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, background: 'rgba(46,196,182,0.12)', color: '#2ec4b6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
            🔗
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Sync via My Google Account</h4>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pull files (Docs, Sheets, PDFs, DOCX, TXT) from your own Google Drive folder — no service account needed.</div>
          </div>
          {googleToken && (
            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', background: 'rgba(46,196,182,0.1)', color: '#2ec4b6', padding: '4px 10px', borderRadius: 99, fontWeight: 700 }}>✓ CONNECTED</span>
          )}
        </div>

        {!googleToken ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Connect your Google account to sync files from your own Drive directly. No setup required.
            </div>
            <button
              onClick={requestGoogleAccess}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', background: '#fff', color: '#444',
                border: '1px solid #dadce0', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem',
                cursor: 'pointer', transition: 'box-shadow 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.1 0 5.8 1.1 7.9 2.9l5.9-5.9C34.4 3.4 29.5 1.5 24 1.5 14.9 1.5 7.2 7.1 3.9 15l6.9 5.4C12.3 13.7 17.7 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.5c0-1.6-.1-2.8-.4-4H24v7.6h12.4c-.5 2.8-2.1 5.2-4.4 6.8l6.8 5.3c4-3.7 6.3-9.2 6.3-15.7z"/><path fill="#FBBC05" d="M10.8 28.6A14.4 14.4 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6L3.4 14C1.9 17 1 20.4 1 24c0 3.6.9 7 2.5 9.9l7.3-5.3z"/><path fill="#EA4335" d="M24 46.5c5.5 0 10.1-1.8 13.5-4.9l-6.8-5.3c-1.8 1.2-4.2 2-6.7 2-6.3 0-11.6-4.2-13.5-10l-6.9 5.4C7.1 41.4 15 46.5 24 46.5z"/></svg>
              Connect Google Account
            </button>
          </div>
        ) : (
          <>
            <div className="admin-knowledge-sync-row" style={{ display: 'flex', gap: 12, alignItems: 'stretch', marginBottom: personalSyncMsg ? 12 : 0 }}>
              <input
                type="text"
                placeholder="Paste Google Drive Folder ID (from folder URL)"
                value={personalFolderId}
                onChange={e => { setPersonalFolderId(e.target.value); setPersonalSyncMsg(null); }}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 10, background: 'var(--bg-input)',
                  border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem'
                }}
                onFocus={e => e.target.style.borderColor = '#2ec4b6'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button
                onClick={handlePersonalDriveSync}
                disabled={personalSyncing}
                style={{
                  background: '#2ec4b6', color: '#fff', border: 'none', padding: '0 24px',
                  borderRadius: 10, fontWeight: 600, cursor: personalSyncing ? 'not-allowed' : 'pointer',
                  opacity: personalSyncing ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'filter 0.2s', whiteSpace: 'nowrap'
                }}
                onMouseEnter={e => { if (!personalSyncing) e.currentTarget.style.filter = 'brightness(1.1)'; }}
                onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
              >
                {personalSyncing ? (
                  <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Syncing...</>
                ) : '🔄 Sync Folder'}
              </button>
            </div>
            {personalSyncMsg && (
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: personalSyncMsg.type === 'success' ? 'rgba(46,196,182,0.08)' : 'rgba(230,57,70,0.08)',
                border: `1px solid ${personalSyncMsg.type === 'success' ? 'rgba(46,196,182,0.3)' : 'rgba(230,57,70,0.25)'}`,
                color: personalSyncMsg.type === 'success' ? '#2ec4b6' : '#e63946',
                fontSize: '0.85rem'
              }}>
                {personalSyncMsg.text}
              </div>
            )}
            <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              💡 Tip: Open the folder in Google Drive → copy the ID from the URL after <code>/folders/</code>
            </div>
          </>
        )}
      </div>

      {/* Service Account Sync (Collapsed / Secondary) */}
      {driveConfig.isConfigured && (
        <div style={{
          background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12,
          padding: '16px 20px', marginBottom: 24, opacity: 0.8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>⚙️ Service Account Sync</span>
            <span style={{ fontSize: '0.7rem', background: 'rgba(29,108,232,0.1)', color: 'var(--accent-blue)', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>CONFIGURED</span>
          </div>
          <div className="admin-knowledge-sync-row" style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              placeholder="Service Account Folder ID"
              value={driveConfig.folderId}
              onChange={e => setDriveConfig(prev => ({ ...prev, folderId: e.target.value }))}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem' }}
            />
            <button
              onClick={handleDriveSync}
              disabled={syncing}
              style={{ background: 'var(--accent-blue)', color: '#fff', border: 'none', padding: '0 18px', borderRadius: 8, fontWeight: 600, cursor: syncing ? 'not-allowed' : 'pointer', opacity: syncing ? 0.7 : 1, fontSize: '0.85rem' }}
            >
              {syncing ? 'Syncing...' : 'Save & Sync'}
            </button>
          </div>
          {driveConfig.lastSyncTime && (
            <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last sync: {new Date(driveConfig.lastSyncTime).toLocaleString()}</div>
          )}
        </div>
      )}

      {/* Upload Zone */}
      <div style={{ 
        border: '2px dashed var(--border)', borderRadius: 16, padding: '40px 20px', 
        textAlign: 'center', background: 'var(--bg-input)', position: 'relative',
        transition: 'all 0.2s', marginBottom: 24
      }}>
        <input 
          type="file" 
          accept=".pdf,.txt,.doc,.docx"
          onChange={handleFileUpload}
          disabled={uploading}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: uploading ? 'default' : 'pointer', width: '100%', zIndex: 10 }}
        />
        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>{uploading ? '⏳' : '📥'}</div>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          {uploading ? 'Extracting text and updating AI Memory...' : 'Click or drag a file to upload'}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Supported formats: PDF, DOCX, TXT (Max 20MB)</div>
      </div>

      {/* Document List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <h4 style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem', fontWeight: 600 }}>Active Knowledge Sources</h4>
        {loading ? (
          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 10 }}>
             <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> Loading AI memory banks...
          </div>
        ) : documents.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: 10, opacity: 0.5 }}>📚</span>
            No knowledge documents uploaded yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {documents.map(doc => (
              <div key={doc._id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: '1.5rem' }}>
                    {doc.mimeType === 'application/pdf' ? '📕' : doc.mimeType === 'text/plain' ? '📝' : '📘'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {doc.title}
                      {doc.isDriveSync ? (
                         <span style={{ fontSize: '0.65rem', background: 'rgba(29, 108, 232, 0.1)', color: 'var(--accent-blue)', padding: '2px 6px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>Google Drive</span>
                      ) : (
                         <span style={{ fontSize: '0.65rem', background: 'var(--bg-hover)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>Manual Upload</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {((doc.size || 0) / 1024).toFixed(1)} KB • {doc.isDriveSync ? 'Last synced' : 'Uploaded'} {new Date(doc.lastModifiedTime || doc.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(doc._id, doc.title)}
                  title="Remove from knowledge base"
                  style={{
                    background: 'transparent', border: 'none', color: '#e63946', padding: 8, cursor: 'pointer',
                    borderRadius: 8, transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,57,70,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
