import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';

function ImageWithFallback({ src, alt }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { theme } = useTheme();

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: loading ? '200px' : 'auto', margin: '12px 0' }}>
      {loading && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'var(--bg-input)', borderRadius: 12,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
          zIndex: 2
        }}>
          <div style={{ width: 30, height: 30, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>AI is generating your image...</span>
        </div>
      )}
      
      {error ? (
        <div style={{
          width: '100%', padding: '32px 20px', 
          background: 'rgba(230,57,70,0.05)', border: '1px dashed var(--accent)', 
          borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10
        }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>Image failed to load</span>
          <button 
            onClick={() => { setError(false); setLoading(true); }}
            style={{ padding: '6px 14px', background: 'var(--accent)', color: '#fff', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600 }}
          >
            Retry
          </button>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoading(false)}
          onError={() => { setError(true); setLoading(false); }}
          style={{
            width: '100%', height: 'auto', borderRadius: 12,
            display: loading ? 'none' : 'block',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
            transition: 'opacity 0.4s ease'
          }}
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}

function CopyButton({ text }) {
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
  };
  return (
    <button
      onClick={copy}
      title="Copy"
      style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'var(--bg-card)', color: 'var(--text-muted)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all var(--transition)',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
    </button>
  );
}

function EditButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      title="Edit"
      style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'var(--bg-card)', color: 'var(--text-muted)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all var(--transition)',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </button>
  );
}

function ShareLinkButton({ url }) {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      title="Copy Shareable Link"
      style={{
        width: 32, height: 32, borderRadius: '50%',
        background: 'rgba(0,0,0,0.3)', color: '#fff',
        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.2s',
        backdropFilter: 'blur(4px)'
      }}
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
      )}
    </button>
  );
}

export default function MessageBubble({ message }) {
  const { activeId, updateMessage } = useChat();
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const time = message.timestamp ? format(new Date(message.timestamp), 'h:mm a') : '';
  
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  if (isSystem) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', width: '100%',
        animation: 'fadeUp 0.3s ease both', margin: '4px 0'
      }}>
        <div style={{
          background: 'var(--bg-card)', 
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          fontSize: '0.8rem', fontFamily: 'monospace',
          padding: '6px 12px', borderRadius: '6px',
          display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: 'var(--shadow-sm)',
          maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }} title={message.content}>
          {message.content}
        </div>
      </div>
    );
  }

  const handleSave = () => {
    if (editContent.trim() && editContent !== message.content) {
      updateMessage(activeId, message.id, editContent);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      gap: 12,
      alignItems: 'flex-end',
      animation: 'fadeUp 0.3s ease both',
      padding: '0 4px',
    }}>
      {/* Avatar */}
      {!isUser && (
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent) 0%, #c1121f 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontSize: '0.85rem',
          boxShadow: '0 0 12px var(--glow)',
        }}>
          🤖
        </div>
      )}

      <div className="message-bubble-container" style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 4 }}>
        {/* Attachment bubble */}
        {message.attachment && (
          <div style={{
            background: isUser ? 'var(--msg-user-bg)' : 'var(--msg-ai-bg)',
            color: isUser ? 'var(--msg-user-text)' : 'var(--msg-ai-text)',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            padding: message.attachment.mimeType?.startsWith('image/') ? '8px' : '12px 16px',
            boxShadow: 'var(--shadow-sm)',
            border: isUser ? 'none' : '1px solid var(--border)',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {message.attachment.mimeType?.startsWith('image/') ? (
              <div style={{ position: 'relative' }}>
                <img 
                  src={message.attachment.url} 
                  alt="Attachment" 
                  style={{ maxWidth: '100%', maxHeight: 250, borderRadius: 10, display: 'block' }} 
                />
                <div style={{ position: 'absolute', top: 8, right: 8 }}>
                  <ShareLinkButton url={message.attachment.url} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <a 
                  href={message.attachment.url} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 10, 
                    color: 'inherit', textDecoration: 'none',
                    fontWeight: 500
                  }}
                >
                  <span style={{ fontSize: '1.4rem' }}>📄</span>
                  <span style={{ textDecoration: 'underline' }}>{message.attachment.originalName || 'Attachment'}</span>
                </a>
                <ShareLinkButton url={message.attachment.url} />
              </div>
            )}
          </div>
        )}

        {/* Text Bubble */}
        {message.content && (
          <div style={{
            background: isUser ? 'var(--msg-user-bg)' : 'var(--msg-ai-bg)',
            color: isUser ? 'var(--msg-user-text)' : 'var(--msg-ai-text)',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            padding: isEditing ? '8px' : '12px 16px',
            fontSize: '0.9rem',
            lineHeight: 1.65,
            boxShadow: 'var(--shadow-sm)',
            border: isUser ? 'none' : '1px solid var(--border)',
            wordBreak: 'break-word',
            width: isEditing ? '100%' : 'auto',
            minWidth: isEditing ? 'min(400px, 100%)' : 'auto',
            ...(message.isError ? { borderColor: 'var(--accent)', background: 'rgba(230,57,70,0.08)' } : {}),
          }}>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button 
                  onClick={handleCancel}
                  style={{ 
                    padding: '4px 12px', borderRadius: 6, fontSize: '0.8rem', 
                    background: 'transparent', border: '1px solid var(--border)',
                    color: 'var(--text-secondary)', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  style={{ 
                    padding: '4px 12px', borderRadius: 6, fontSize: '0.8rem', 
                    background: 'var(--accent)', border: 'none',
                    color: '#fff', cursor: 'pointer'
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            isUser ? (
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.content}</p>
            ) : (
              <div className="md-content">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    img: ({ node, ...props }) => <ImageWithFallback {...props} />
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )
          )}
        </div>
        )}

        {/* Footer: time + copy + edit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: isUser ? 'row-reverse' : 'row' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{time}</span>
          {!isEditing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CopyButton text={message.content} />
              {isUser && <EditButton onClick={() => setIsEditing(true)} />}
            </div>
          )}
          {message.demo && (
            <span style={{
              fontSize: '0.67rem', background: 'rgba(29,108,232,0.15)',
              color: '#1d6ce8', padding: '1px 7px', borderRadius: 99, fontWeight: 600,
            }}>DEMO</span>
          )}
        </div>
      </div>
    </div>
  );
}
