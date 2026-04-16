import { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { format } from 'date-fns';

export default function FilesPanel({ open, onClose }) {
  const { activeSession } = useChat();
  const [tab, setTab] = useState('all'); // 'all' | 'images' | 'files'
  const [preview, setPreview] = useState(null);

  // Collect all attachments from messages
  const attachments = (activeSession?.messages || [])
    .filter(m => m.attachment)
    .map(m => ({
      ...m.attachment,
      timestamp: m.timestamp,
      role: m.role,
    }));

  const images = attachments.filter(a => a.mimeType?.startsWith('image/'));
  const docs = attachments.filter(a => !a.mimeType?.startsWith('image/'));

  const displayed = tab === 'images' ? images : tab === 'files' ? docs : attachments;

  if (!open) return null;

  return (
    <>
      {/* Overlay for mobile */}
      <div
        onClick={onClose}
        style={{
          display: 'none',
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 39,
        }}
        className="files-overlay"
      />

      <aside style={{
        width: 280,
        minWidth: 280,
        height: '100vh',
        background: 'var(--sidebar-bg)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        zIndex: 40,
        animation: 'slideInRight 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Header */}
        <div style={{
          height: 62,
          padding: '0 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'rgba(var(--accent-rgb),0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>Uploads</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{attachments.length} item{attachments.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'transparent', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, padding: '10px 12px 0',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          {[['all', 'All'], ['images', '🖼️ Images'], ['files', '📄 Docs']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px 8px 0 0',
                fontSize: '0.75rem', fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: tab === key ? 'var(--bg-surface)' : 'transparent',
                color: tab === key ? 'var(--accent)' : 'var(--text-muted)',
                borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all var(--transition)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {displayed.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', gap: 12,
              color: 'var(--text-muted)',
            }}>
              <div style={{ fontSize: '2.5rem', opacity: 0.4 }}>📂</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 500, textAlign: 'center' }}>
                No {tab === 'images' ? 'images' : tab === 'files' ? 'documents' : 'uploads'} yet
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: 180, lineHeight: 1.5 }}>
                Files and images attached in chat will appear here
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {displayed.map((item, i) => {
                const isImage = item.mimeType?.startsWith('image/');
                const timeStr = item.timestamp ? format(new Date(item.timestamp), 'MMM d, h:mm a') : '';
                return (
                  <div
                    key={i}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      overflow: 'hidden',
                      transition: 'all var(--transition)',
                      cursor: isImage ? 'zoom-in' : 'default',
                    }}
                    onClick={() => isImage && setPreview(item.url)}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {isImage ? (
                      <div>
                        <img
                          src={item.url}
                          alt={item.originalName || 'Image'}
                          style={{ width: '100%', maxHeight: 160, objectFit: 'cover', display: 'block' }}
                        />
                        <div style={{ padding: '8px 10px' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.originalName || 'Image'}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{timeStr}</div>
                        </div>
                      </div>
                    ) : (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                          background: 'rgba(var(--accent-rgb),0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.2rem',
                        }}>
                          {item.originalName?.endsWith('.pdf') ? '📕' :
                            item.originalName?.match(/\.(doc|docx)$/) ? '📘' :
                            item.originalName?.endsWith('.txt') ? '📃' : '📄'}
                        </div>
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.originalName || 'Document'}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{timeStr}</div>
                        </div>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* Image preview lightbox */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease',
            cursor: 'zoom-out',
          }}
        >
          <img
            src={preview}
            alt="Preview"
            style={{
              maxWidth: '90vw', maxHeight: '88vh',
              borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              objectFit: 'contain',
            }}
          />
          <button
            onClick={() => setPreview(null)}
            style={{
              position: 'fixed', top: 20, right: 20,
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#fff', fontSize: '1.2rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 700px) {
          .files-overlay { display: block !important; }
        }
      `}</style>
    </>
  );
}
