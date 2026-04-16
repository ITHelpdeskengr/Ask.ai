import { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import api from '../utils/api';
import { useUI } from '../context/UIContext';

export default function ChatInput() {
  const [value, setValue] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const { sendMessage, loading } = useChat();
  const { 
    openCalendar, openEmails, 
    setShowMeetingModal, 
    setShowTodoModal, setShowTaskDashboard,
    toggleTheme, logoutUser, deleteCurrentSession,
    isListening, toggleListening
  } = useUI();

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [value]);

  const submit = async () => {
    const trimmed = value.trim();
    if ((!trimmed && !attachment) || loading || isUploading) return;

    let uploadedData = null;
    if (attachment) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', attachment.file);
        const { data } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedData = data.file;
      } catch (err) {
        console.error('Failed to upload file', err);
        alert('File upload failed. Please try again.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    sendMessage(trimmed, uploadedData);
    setValue('');
    setAttachment(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachment({
        file,
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      });
      setShowMenu(false);
    }
    e.target.value = null;
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div style={{ padding: '12px 24px 24px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 840, margin: '0 auto' }}>

        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 12,
          background: 'var(--bg-input)',
          border: '1.5px solid var(--border)',
          borderRadius: 20,
          padding: '14px 18px',
          transition: 'border-color var(--transition)',
          boxShadow: 'var(--shadow-sm)',
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: showMenu ? 'var(--bg-hover)' : 'transparent',
                border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                marginBottom: 2, transition: 'all var(--transition)'
              }}
              title="Attach a file"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />

            {showMenu && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 15px)', left: 0,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 8, minWidth: 160,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                display: 'flex', flexDirection: 'column', gap: 4, zIndex: 10
              }}>
                <button
                  onClick={() => { fileInputRef.current.click(); setShowMenu(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                    background: 'transparent', border: 'none', borderRadius: 8,
                    color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer',
                    textAlign: 'left', width: '100%'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: '1.1rem' }}>📄</span>
                  Upload Document
                </button>
                <button
                  onClick={() => { fileInputRef.current.click(); setShowMenu(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                    background: 'transparent', border: 'none', borderRadius: 8,
                    color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer',
                    textAlign: 'left', width: '100%'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: '1.1rem' }}>🖼️</span>
                  Attach Image
                </button>
              </div>
            )}
          </div>

          {(window.SpeechRecognition || window.webkitSpeechRecognition) && (
            <button
              onClick={toggleListening}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isListening ? 'var(--accent)' : 'transparent',
                border: 'none', color: isListening ? '#fff' : 'var(--text-muted)', cursor: 'pointer',
                marginBottom: 2, transition: 'all var(--transition)',
                animation: isListening ? 'pulse-red 1.5s infinite' : 'none'
              }}
              title={isListening ? "Stop listening" : "Start voice command"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </button>
          )}

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {attachment && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', background: 'var(--bg-card)',
                border: '1px solid var(--border)', borderRadius: 8,
                marginBottom: 10, width: 'max-content', maxWidth: '100%',
                animation: 'fadeUp 0.2s ease'
              }}>
                {attachment.type === 'image' ? (
                  <img src={attachment.preview} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.2rem' }}>📄</span>
                )}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>
                  {attachment.name}
                </span>
                <button
                  onClick={() => setAttachment(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask anything from here..."
              rows={1}
              disabled={loading || isUploading}
              style={{
                background: 'none', border: 'none', outline: 'none',
                color: 'var(--text-primary)', fontSize: '1rem', lineHeight: 1.5,
                resize: 'none', fontFamily: 'var(--font-main)', minHeight: 28,
                maxHeight: 200, overflowY: 'auto', width: '100%',
                padding: 0, margin: 0,
              }}
            />
          </div>
          <button
            onClick={submit}
            disabled={(!value.trim() && !attachment) || loading || isUploading}
            style={{
              width: 38, height: 38, borderRadius: 10,
              background: (value.trim() || attachment) && !(loading || isUploading) ? 'var(--accent)' : 'var(--bg-hover)',
              color: (value.trim() || attachment) && !(loading || isUploading) ? '#fff' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all var(--transition)',
              cursor: (value.trim() || attachment) && !(loading || isUploading) ? 'pointer' : 'default',
              boxShadow: (value.trim() || attachment) && !(loading || isUploading) ? '0 2px 10px var(--glow)' : 'none',
            }}
          >
            {loading || isUploading ? (
              <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 8 }}>
        ASK.ai may produce inaccurate information. Verify important facts.
      </p>
    </div>
  );
}
