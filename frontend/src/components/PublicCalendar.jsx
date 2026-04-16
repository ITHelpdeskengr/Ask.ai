import { useState, useEffect } from 'react';
import api from '../utils/api';
import { format } from 'date-fns';

export default function PublicCalendar({ token }) {
  const [events, setEvents] = useState([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublicCalendar = async () => {
      try {
        const { data } = await api.get(`/calendar/public/${token}`);
        setEvents(data.events);
        setUserName(data.userName);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to view calendar.');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicCalendar();
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-main)' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(230,57,70,0.2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)', textAlign: 'center', padding: 20 }}>
        <h1 style={{ fontSize: '2rem', marginBottom: 10 }}>Link Invalid or Expired</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-primary)', fontFamily: 'var(--font-main)' }}>
      {/* Header */}
      <header style={{ background: 'var(--header-bg)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--border)', padding: '24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, var(--accent) 0%, #ff6b6b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(230,57,70,0.3)' }}>
             <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
              </svg>
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{userName}'s Calendar</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Upcoming Availability</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16, opacity: 0.5 }}>
              <circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <h2>No upcoming events!</h2>
            <p>Seems like their calendar is completely clear.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {events.map((event, i) => (
              <div key={i} style={{ 
                background: 'var(--bg-card)', 
                border: '1px solid var(--border)', 
                borderRadius: 16, 
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{event.title}</h3>
                  <span style={{ 
                    background: 'rgba(230,57,70,0.1)', color: 'var(--accent)', 
                    padding: '4px 12px', borderRadius: 99, fontSize: '0.8rem', fontWeight: 600 
                  }}>
                    {format(new Date(event.startTime), 'MMM d, h:mm a')} — {format(new Date(event.endTime), 'h:mm a')}
                  </span>
                </div>
                
                {event.description && (
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: 1.5 }}>
                    {event.description}
                  </p>
                )}

                {event.location && (
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <span>📍</span> {event.location}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
