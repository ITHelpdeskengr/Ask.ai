import { useState } from 'react';
import api from '../utils/api';

export default function CreateMeetingModal({ isOpen, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        title,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        description
      };
      
      await api.post('/calendar/events', payload);
      onSuccess(title, startTime);
      onClose();
      
      // Reset form
      setTitle('');
      setStartTime('');
      setEndTime('');
      setDescription('');
    } catch (err) {
      console.error('Failed to create meeting:', err);
      alert('Failed to schedule the meeting. Please ensure all dates are valid.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--bg-card)', 
        border: '1px solid var(--border)',
        borderRadius: 'clamp(12px, 3vw, 16px)',
        padding: 'clamp(16px, 4vw, 24px)',
        width: 'calc(100% - 32px)',
        maxWidth: 480,
        boxShadow: 'var(--shadow-lg)',
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto'
      }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '1.25rem', color: 'var(--text-primary)' }}>Schedule a Meeting</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Meeting Title <span style={{color:'var(--accent)'}}>*</span></label>
            <input 
              required
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Weekly Sync"
              style={{
                width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--bg-main)', color: 'var(--text-primary)',
                fontFamily: 'inherit', fontSize: '0.95rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
               <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Start Time <span style={{color:'var(--accent)'}}>*</span></label>
               <input 
                  required
                  type="datetime-local" 
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  style={{
                    width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border)',
                    background: 'var(--bg-main)', color: 'var(--text-primary)',
                    fontFamily: 'inherit', fontSize: '0.9rem'
                  }}
                />
            </div>
            <div style={{ flex: '1 1 200px' }}>
               <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>End Time <span style={{color:'var(--accent)'}}>*</span></label>
               <input 
                  required
                  type="datetime-local" 
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  style={{
                    width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border)',
                    background: 'var(--bg-main)', color: 'var(--text-primary)',
                    fontFamily: 'inherit', fontSize: '0.9rem'
                  }}
                />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Description (Optional)</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Add any details or an agenda..."
              style={{
                width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--bg-main)', color: 'var(--text-primary)',
                fontFamily: 'inherit', fontSize: '0.95rem', resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
             <button 
                type="button" 
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  padding: '10px 16px', borderRadius: 8, border: 'none',
                  background: 'transparent', color: 'var(--text-secondary)',
                  cursor: 'pointer', fontWeight: 500,
                  flex: '1 1 auto', textAlign: 'center', minWidth: 100
                }}
             >
                Cancel
             </button>
             <button 
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: 'var(--accent)', color: 'white',
                  cursor: isSubmitting ? 'wait' : 'pointer', fontWeight: 600,
                  opacity: isSubmitting ? 0.7 : 1,
                  flex: '1 1 140px', textAlign: 'center'
                }}
             >
                {isSubmitting ? 'Scheduling...' : 'Save Meeting'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
