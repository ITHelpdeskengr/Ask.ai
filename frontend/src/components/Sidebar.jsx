import { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import CreateMeetingModal from './CreateMeetingModal';
import AdminDashboard from './AdminDashboard';
import CalendarDashboard from './CalendarDashboard';
import EmailDashboard from './EmailDashboard';
import TaskDashboard from './TaskDashboard';
import { useUI } from '../context/UIContext';

const IconPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);
const IconEllipsis = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/>
  </svg>
);

const QUICK_ACTIONS = [
  { icon: '📧', label: 'Check my emails', prompt: 'I want to see my latest emails', isEmail: true },
  { icon: '📅', label: 'View Calendar', prompt: 'Show me my calendar for today and this week', isCalendar: true },
  { icon: '🤝', label: 'Create Meeting', prompt: 'Schedule a meeting', isCreateMeeting: true },
  { icon: '📋', label: 'Tasks', prompt: 'View my task list', isViewTasks: true },
];


export default function Sidebar({ open, onToggle, onOpenFilesPanel, isAdmin, onSwitchToAdmin }) {
  const { sessions, activeId, setActiveId, newSession, deleteSession, sendMessage } = useChat();
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const {
    showMeetingModal, setShowMeetingModal,
    showEmailDashboard, setShowEmailDashboard,
    showCalendarDashboard, setShowCalendarDashboard,
    showTaskDashboard, setShowTaskDashboard,
    showAdminDashboard, setShowAdminDashboard,
    isFetchingGmail,
    isFetchingCalendar,
    openCalendar,
    openEmails,
    getTargetSessionId
  } = useUI();

  const [hoveredSession, setHoveredSession] = useState(null);
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);


  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          onClick={onToggle}
          style={{
            display: 'none',
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
          className="mobile-overlay"
        />
      )}

      <aside style={{
        width: open ? '260px' : '72px',
        minWidth: open ? '260px' : '72px',
        height: '100vh',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 50,
        flexShrink: 0,
      }}>

        {/* Logo + Toggle */}
        <div style={{
          height: 62,
          padding: open ? '0 18px' : '0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          justifyContent: open ? 'space-between' : 'center',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div style={{
              width: 36, height: 36,
              background: 'var(--accent)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 16px var(--glow)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
            </div>
            {open && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>ASK.ai</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>AI Assistant</div>
              </div>
            )}
          </div>
          {open && (
            <button
              onClick={onToggle}
              style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'transparent', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer', flexShrink: 0,
                transition: 'all var(--transition)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              title="Close sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>



        {/* New Chat Button */}
        <div style={{ padding: open ? '0 10px 10px' : '0 10px 10px' }}>
          <button
            onClick={newSession}
            title={!open ? 'New Chat' : undefined}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: open ? 'flex-start' : 'center',
              gap: '10px',
              padding: open ? '10px 12px' : '10px',
              borderRadius: 10,
              background: 'var(--accent)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.88rem',
              transition: 'all var(--transition)',
              boxShadow: '0 2px 12px var(--glow)',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <IconPlus />
            {open && <span>New Chat</span>}
          </button>
        </div>

        {/* Quick Actions Section */}
        <div style={{ padding: '0 10px 14px' }}>
          {open && (
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', padding: '0 4px 6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Quick Tools
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {QUICK_ACTIONS.map((a, i) => (
              <button
                key={i}
                onClick={() => {
                  if (a.isEmail) setShowEmailDashboard(true);
                  else if (a.isCalendar) openCalendar();
                  else if (a.isCreateMeeting) setShowMeetingModal(true);
                  else if (a.isViewTasks) setShowTaskDashboard(true);
                  else sendMessage(a.prompt, null, getTargetSessionId());
                }}
                disabled={(a.isEmail && isFetchingGmail) || (a.isCalendar && isFetchingCalendar)}
                title={a.label}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: open ? '8px 12px' : '9px',
                  borderRadius: 10,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  transition: 'all var(--transition)',
                  flexShrink: 0,
                  justifyContent: open ? 'flex-start' : 'center',
                  opacity: ((a.isEmail && isFetchingGmail) || (a.isCalendar && isFetchingCalendar)) ? 0.6 : 1,
                  cursor: ((a.isEmail && isFetchingGmail) || (a.isCalendar && isFetchingCalendar)) ? 'wait' : 'pointer',
                }}
                onMouseEnter={e => {
                  if ((a.isEmail && isFetchingGmail) || (a.isCalendar && isFetchingCalendar)) return;
                  e.currentTarget.style.background = 'var(--bg-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  if ((a.isEmail && isFetchingGmail) || (a.isCalendar && isFetchingCalendar)) return;
                  e.currentTarget.style.background = 'var(--bg-card)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>
                  {((a.isEmail && isFetchingGmail) || (a.isCalendar && isFetchingCalendar)) ? (
                    <div style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  ) : a.icon}
                </span>
                {open && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {((a.isEmail && isFetchingGmail) || (a.isCalendar && isFetchingCalendar)) ? 'Working...' : a.label}
                </span>}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        {open && (
          <div style={{
            flex: 1, overflowY: 'auto', padding: '0 10px',
            display: 'flex', flexDirection: 'column', gap: '3px',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', padding: '6px 4px 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Recent
            </div>
            {sessions.filter(s => s.messages && s.messages.length > 0).map(session => (
              <div
                key={session.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '9px 10px',
                  borderRadius: 10,
                  background: session.id === activeId ? 'var(--bg-hover)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                  border: session.id === activeId ? '1px solid var(--border)' : '1px solid transparent',
                }}
                onMouseEnter={e => {
                  setHoveredSession(session.id);
                  if (session.id !== activeId) e.currentTarget.style.background = 'var(--bg-hover)';
                }}
                onMouseLeave={e => {
                  setHoveredSession(null);
                  if (session.id !== activeId) e.currentTarget.style.background = 'transparent';
                }}
                onClick={() => setActiveId(session.id)}
              >
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: session.id === activeId ? 'var(--accent)' : 'var(--text-muted)',
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{
                    fontSize: '0.84rem', fontWeight: session.id === activeId ? 600 : 400,
                    color: session.id === activeId ? 'var(--text-primary)' : 'var(--text-secondary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {session.title}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                  </div>
                </div>
                {hoveredSession === session.id || menuOpenFor === session.id ? (
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={e => { e.stopPropagation(); setMenuOpenFor(menuOpenFor === session.id ? null : session.id); }}
                      style={{
                        padding: '4px', borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: menuOpenFor === session.id ? 'var(--text-primary)' : 'var(--text-muted)',
                        background: menuOpenFor === session.id ? 'var(--bg-hover)' : 'transparent',
                        transition: 'all var(--transition)'
                      }}
                      onMouseEnter={e => { if(menuOpenFor !== session.id) e.currentTarget.style.color = 'var(--text-primary)'; }}
                      onMouseLeave={e => { if(menuOpenFor !== session.id) e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      <IconEllipsis />
                    </button>
                    {menuOpenFor === session.id && (
                      <div 
                        style={{
                          position: 'absolute', top: '100%', right: 0, marginTop: 4,
                          background: 'var(--bg-card)', border: '1px solid var(--border)',
                          borderRadius: 8, boxShadow: 'var(--shadow-md)', zIndex: 100,
                          display: 'flex', flexDirection: 'column', padding: 4, minWidth: 140
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <button 
                          style={{ padding: '8px 10px', fontSize: '0.78rem', textAlign: 'left', borderRadius: 5, color: 'var(--text-primary)', background: 'transparent', transition: 'background 0.15s', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          onClick={() => { setActiveId(session.id); onOpenFilesPanel?.(); setMenuOpenFor(null); }}
                        >
                          🖼️ View Uploads
                        </button>
                        <button 
                          style={{ padding: '8px 10px', fontSize: '0.78rem', textAlign: 'left', borderRadius: 5, color: '#e63946', background: 'transparent', transition: 'background 0.15s', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(230,57,70,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          onClick={() => { deleteSession(session.id); setMenuOpenFor(null); }}
                        >
                          🗑️ Delete Chat
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {!open && <div style={{ flex: 1 }} />}

        {/* Bottom: User info + Theme toggle + Logout */}
        <div style={{
          padding: open ? '12px 14px' : '12px 10px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          justifyContent: open ? 'space-between' : 'center',
        }}>
          {open && user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', overflow: 'hidden', flex: 1 }}>
              {user.avatar ? (
                <img src={user.avatar} alt="" style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  border: '2px solid var(--accent)',
                }} />
              ) : (
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), #ff6b6b)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
              </div>
            </div>
          )}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: open ? 8 : 4,
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <button
              onClick={toggle}
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
              style={{
                width: open ? 34 : 28, height: open ? 34 : 28, borderRadius: 8,
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all var(--transition)',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
            >
              {theme === 'dark'
                ? <svg width={open ? "14" : "12"} height={open ? "14" : "12"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                : <svg width={open ? "14" : "12"} height={open ? "14" : "12"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              }
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Sign out"
              style={{
                width: open ? 34 : 28, height: open ? 34 : 28, borderRadius: 8,
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all var(--transition)',
                border: '1px solid var(--border)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(230,57,70,0.1)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <svg width={open ? "14" : "12"} height={open ? "14" : "12"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            padding: '30px',
            borderRadius: '20px',
            width: '90%',
            maxWidth: '360px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)',
            textAlign: 'center',
            display: 'flex', flexDirection: 'column', gap: '20px',
            animation: 'fadeUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <div style={{
              width: '50px', height: '50px',
              background: 'rgba(230,57,70,0.1)',
              borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)', margin: '0 auto'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Sign Out</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>Are you sure you want to log out of your account?</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  background: 'var(--bg-hover)', color: 'var(--text-primary)',
                  fontWeight: 600, fontSize: '0.9rem',
                  border: '1px solid var(--border)', transition: 'all var(--transition)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-input)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              >
                No, stay
              </button>
              <button
                onClick={logout}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  background: 'var(--accent)', color: '#fff',
                  fontWeight: 600, fontSize: '0.9rem',
                  boxShadow: '0 4px 12px var(--glow)',
                  transition: 'all var(--transition)'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Yes, sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateMeetingModal 
        isOpen={showMeetingModal} 
        onClose={() => setShowMeetingModal(false)}
        onSuccess={(title, date) => {
          const sid = getTargetSessionId();
          const d = new Date(date).toLocaleString();
          sendMessage(`I have just scheduled a new meeting titled "${title}" for ${d}. Please confirm and note it down.`, null, sid);
        }}
      />

      {showAdminDashboard && (
        <AdminDashboard onClose={() => setShowAdminDashboard(false)} />
      )}

      {showCalendarDashboard && (
        <CalendarDashboard onClose={() => setShowCalendarDashboard(false)} />
      )}

      {showEmailDashboard && (
        <EmailDashboard onClose={() => setShowEmailDashboard(false)} />
      )}

      {showTaskDashboard && (
        <TaskDashboard onClose={() => setShowTaskDashboard(false)} />
      )}
    </>
  );
}
