import { useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import WelcomeScreen from './WelcomeScreen';
import ChatInput from './ChatInput';

export default function ChatArea({ sidebarOpen, onMenuClick, filesPanelOpen, onToggleFilesPanel }) {
  const { activeSession, loading, newSession } = useChat();

  const uploadCount = (activeSession?.messages || []).filter(m => m.attachment).length;
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession.messages, loading]);

  const hasMessages = activeSession.messages.length > 0;

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'var(--bg-surface)',
      overflow: 'hidden',
      minWidth: 0,
    }}>
      {/* Header */}
      <header style={{
        padding: '0 24px',
        height: 'var(--header-height, 62px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        background: 'var(--header-bg)',
        backdropFilter: 'blur(12px)',
        flexShrink: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!sidebarOpen && (
            <button
              onClick={onMenuClick}
              style={{
                width: 'var(--btn-size-sm, 34px)', height: 'var(--btn-size-sm, 34px)', borderRadius: 8,
                background: 'var(--bg-card)', color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all var(--transition)', border: '1px solid var(--border)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}

          {hasMessages && (
            <div style={{ overflow: 'hidden' }}>
              <h2 style={{
                fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                maxWidth: 320,
              }}>
                {activeSession.title}
              </h2>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

          {/* Status badge - hidden on narrow headers to save space */}
          <div style={{
            display: 'none', 
            '@media (min-width: 600px)': { display: 'flex' },
            alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 99,
            background: 'rgba(46,196,182,0.11)', border: '1px solid rgba(46,196,182,0.22)',
            fontSize: '0.74rem', fontWeight: 600, color: '#2ec4b6',
          }} className="header-status">
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2ec4b6', display: 'inline-block', animation: 'pulse 2s ease infinite' }} />
            Active Online
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            title="Toggle theme"
            style={{
              width: 'var(--btn-size-sm, 36px)', height: 'var(--btn-size-sm, 36px)', borderRadius: 10,
              background: 'var(--bg-card)', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--border)', transition: 'all var(--transition)',
            }}
          >
            {theme === 'dark'
              ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            }
          </button>

          {/* User Profile */}
          <div style={{
            marginLeft: 8,
            display: 'flex',
            alignItems: 'center',
          }}>
            <div style={{
              width: 'var(--btn-size-sm, 38px)', height: 'var(--btn-size-sm, 38px)',
              borderRadius: 12,
              background: 'var(--accent)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.9rem', fontWeight: 700, color: '#fff',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
              transition: 'all var(--transition)',
            }} 
            title={`${user?.name} (You)`}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Messages / Welcome */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {hasMessages ? (
          <div className="chat-messages-container" style={{ display: 'flex', flexDirection: 'column', gap: 18, margin: '0 auto' }}>
            {activeSession.messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} style={{ height: 4 }} />
          </div>
        ) : (
          <WelcomeScreen />
        )}
      </div>

      <ChatInput />
    </div>
  );
}
