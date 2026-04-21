import { useState, useEffect } from 'react';
import api from '../utils/api';
import { format, isSameDay, isToday, isTomorrow, addDays, startOfWeek, endOfWeek } from 'date-fns';

export default function CalendarDashboard({ onClose }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('week'); // 'today', 'week'

  useEffect(() => {
    fetchEvents();
  }, [activeTab]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get(`/calendar/events?range=${activeTab}`);
      setEvents(data.events || []);
      setLoading(false);
    } catch (err) {
      console.error('[CALENDAR DASHBOARD ERROR]', err);
      setError('Failed to load your calendar. Please ensure Google Calendar access is granted.');
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    
    try {
      await api.delete(`/calendar/events/${id}`);
      // Refresh events
      fetchEvents();
    } catch (err) {
      console.error('[DELETE EVENT ERROR]', err);
      alert('Failed to delete the event. Please try again.');
    }
  };

  const groupEventsByDate = () => {
    const groups = {};
    events.forEach(event => {
      const dateKey = format(new Date(event.startTime), 'yyyy-MM-dd');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(event);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const groupedEvents = groupEventsByDate();

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: 'clamp(8px, 2vw, 20px)'
    }}>
      <div style={{
        width: '100%', maxWidth: '900px', height: 'clamp(80vh, 90vh, 90vh)',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'clamp(14px, 3vw, 24px)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        {/* Header */}
        <div style={{
          padding: 'clamp(12px, 3vw, 24px) clamp(14px, 3vw, 32px)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(to right, var(--bg-hover), transparent)',
          flexWrap: 'wrap', gap: 'clamp(8px, 2vw, 12px)'
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 'clamp(1rem, 3.5vw, 1.5rem)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, 12px)' }}>
              <span style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.8rem)' }}>📅</span> My Schedule
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 'clamp(0.72rem, 2vw, 0.85rem)', color: 'var(--text-muted)' }}>Connected to Google Calendar</p>
          </div>
          
          <div style={{ display: 'flex', background: 'var(--bg-hover)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
             <button 
                onClick={() => setActiveTab('today')}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: 'none',
                  background: activeTab === 'today' ? 'var(--bg-card)' : 'transparent',
                  color: activeTab === 'today' ? 'var(--accent)' : 'var(--text-muted)',
                  fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}
             >Today</button>
             <button 
                onClick={() => setActiveTab('week')}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: 'none',
                  background: activeTab === 'week' ? 'var(--bg-card)' : 'transparent',
                  color: activeTab === 'week' ? 'var(--accent)' : 'var(--text-muted)',
                  fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}
             >Next 7 Days</button>
          </div>

          <button onClick={onClose} style={{
            marginLeft: '24px', background: 'transparent', border: 'none',
            color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem'
          }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(12px, 3vw, 32px)' }}>
          {loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
               <div className="dash-spinner"></div>
               <span style={{ color: 'var(--text-muted)' }}>Fetching your calendar...</span>
            </div>
          ) : error ? (
             <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' }}>
                <div style={{ maxWidth: '400px' }}>
                   <span style={{ fontSize: '3rem', display: 'block', marginBottom: '20px' }}>⚠️</span>
                   <h3 style={{ color: 'var(--text-primary)' }}>{error}</h3>
                   <button 
                      onClick={fetchEvents}
                      style={{ 
                        marginTop: '20px', padding: '10px 24px', borderRadius: '12px', 
                        background: 'var(--accent)', color: 'white', border: 'none', fontWeight: 600 
                      }}
                   >Retry Sync</button>
                </div>
             </div>
          ) : events.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
               <span style={{ fontSize: '4rem', opacity: 0.3 }}>🏖️</span>
               <h3 style={{ color: 'var(--text-muted)' }}>Your schedule is completely clear!</h3>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {groupedEvents.map(([date, dayEvents]) => {
                const dateObj = new Date(date);
                let dayLabel = format(dateObj, 'EEEE, MMMM do');
                if (isToday(dateObj)) dayLabel = 'Today';
                else if (isTomorrow(dateObj)) dayLabel = 'Tomorrow';

                return (
                  <div key={date}>
                    <div style={{ 
                      fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent)', 
                      marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px',
                      textTransform: 'uppercase', letterSpacing: '0.08em'
                    }}>
                      {dayLabel}
                      <div style={{ flex: 1, height: '1px', background: 'var(--border)', opacity: 0.5 }}></div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {dayEvents.map(event => (
                        <div key={event.id} style={{
                          padding: 'clamp(10px, 2vw, 16px) clamp(12px, 2vw, 20px)', background: 'var(--bg-input)',
                          border: '1px solid var(--border)', borderRadius: 'clamp(10px, 2vw, 16px)',
                          display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2vw, 20px)',
                          transition: 'all 0.2s hover', cursor: 'default',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{
                            minWidth: '85px', textAlign: 'center',
                            borderRight: '1px solid var(--border)', paddingRight: '20px'
                          }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {format(new Date(event.startTime), 'h:mm a')}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {format(new Date(event.startTime), 'EEE')}
                            </div>
                          </div>
                          
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {event.title}
                              {event.htmlLink && (
                                <a 
                                  href={event.htmlLink} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  title="View in Google Calendar"
                                  style={{ 
                                    color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    padding: '2px', borderRadius: '4px', transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                                  </svg>
                                </a>
                              )}
                            </div>
                            {event.location && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                📍 {event.location}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {event.isGoogleEvent && (
                               <div style={{ 
                                 fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px', 
                                 background: 'rgba(66, 133, 244, 0.1)', color: '#4285f4', 
                                 fontWeight: 600, border: '1px solid rgba(66, 133, 244, 0.2)' 
                               }}>
                                 Google
                               </div>
                            )}
                            
                            <button 
                               onClick={() => handleDeleteEvent(event.id || event._id, event.title)}
                               title="Delete meeting"
                               style={{
                                 background: 'transparent', border: 'none', 
                                 color: 'var(--text-muted)', cursor: 'pointer',
                                 padding: '8px', borderRadius: '8px',
                                 transition: 'all 0.2s', display: 'flex', alignItems: 'center'
                               }}
                               onMouseEnter={e => { e.currentTarget.style.color = '#ff4d4f'; e.currentTarget.style.background = 'rgba(255, 77, 79, 0.1)'; }}
                               onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                            >
                               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                 <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                               </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
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
          width: 40px; height: 40px;
          border: 4px solid rgba(255,255,255,0.1);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: dspin 1s linear infinite;
        }
        @keyframes dspin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
