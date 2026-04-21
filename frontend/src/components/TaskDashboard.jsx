import { useState, useEffect } from 'react';
import api from '../utils/api';
import { format } from 'date-fns';

export default function TaskDashboard({ onClose }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/tasks');
      setTasks(data || []);
      setLoading(false);
    } catch (err) {
      console.error('[TASK DASHBOARD ERROR]', err);
      setError('Failed to load your tasks. Please try again.');
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error('[TOGGLE TASK ERROR]', err);
      alert('Failed to update task status.');
    }
  };

  const deleteTask = async (taskId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (err) {
      console.error('[DELETE TASK ERROR]', err);
      alert('Failed to delete task.');
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsAdding(true);
    try {
      const payload = {
        title: newTitle,
        priority: newPriority,
        dueDate: newDueDate ? new Date(newDueDate).toISOString() : null,
        status: 'pending'
      };

      const { data } = await api.post('/tasks', payload);
      setTasks([data, ...tasks]);
      setNewTitle('');
      setNewPriority('medium');
      setNewDueDate('');
    } catch (err) {
      console.error('[ADD TASK ERROR]', err);
      alert('Failed to add task.');
    } finally {
      setIsAdding(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return t.status === 'pending';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#ff4d4f';
      case 'high': return '#ff7a45';
      case 'medium': return '#ffc53d';
      case 'low': return '#73d13d';
      default: return 'var(--accent)';
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: 'clamp(8px, 2vw, 20px)'
    }}>
      <div style={{
        width: '95%', maxWidth: '850px', height: 'clamp(80vh, 90vh, 90vh)',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'clamp(14px, 3vw, 24px)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        {/* Header */}
        <div className="dash-header" style={{
          padding: 'clamp(12px, 3vw, 24px) clamp(14px, 3vw, 32px)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(to right, var(--bg-hover), transparent)',
          flexWrap: 'wrap', gap: '16px'
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 'clamp(1rem, 3.5vw, 1.5rem)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, 12px)' }}>
              <span style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.8rem)' }}>📝</span> My Tasks
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 'clamp(0.72rem, 2vw, 0.85rem)', color: 'var(--text-muted)' }}>Keep track of your to-dos</p>
          </div>
          
          <div style={{ display: 'flex', background: 'var(--bg-hover)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
             {['all', 'pending', 'completed'].map(f => (
               <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                    background: filter === f ? 'var(--bg-card)' : 'transparent',
                    color: filter === f ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                    textTransform: 'capitalize'
                  }}
               >{f}</button>
             ))}
          </div>

          <button onClick={onClose} style={{
            marginLeft: '24px', background: 'transparent', border: 'none',
            color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem'
          }}>✕</button>
        </div>

        {/* Quick Add Bar */}
        <div className="quick-add-bar" style={{
          padding: 'clamp(10px, 2vw, 16px) clamp(12px, 3vw, 24px)', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)', display: 'flex', gap: 'clamp(8px, 2vw, 12px)', alignItems: 'center'
        }}>
          <form onSubmit={addTask} className="quick-add-form" style={{ display: 'flex', flex: 1, gap: 'clamp(6px, 1.5vw, 12px)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                type="text"
                placeholder="What needs to be done?"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '12px',
                  background: 'var(--bg-input)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>
            
            <select
              value={newPriority}
              onChange={e => setNewPriority(e.target.value)}
              style={{
                padding: '10px 12px', borderRadius: '12px', background: 'var(--bg-input)',
                border: '1px solid var(--border)', color: 'var(--text-secondary)',
                fontSize: '0.85rem', cursor: 'pointer', outline: 'none'
              }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <input 
              type="date"
              value={newDueDate}
              onChange={e => setNewDueDate(e.target.value)}
              style={{
                padding: '9px 12px', borderRadius: '12px', background: 'var(--bg-input)',
                border: '1px solid var(--border)', color: 'var(--text-secondary)',
                fontSize: '0.85rem', outline: 'none', cursor: 'pointer'
              }}
            />

            <button 
              type="submit"
              disabled={isAdding || !newTitle.trim()}
              style={{
                padding: '10px 24px', borderRadius: '12px', background: 'var(--accent)',
                color: 'white', fontWeight: 600, fontSize: '0.9rem',
                border: 'none', cursor: isAdding ? 'wait' : 'pointer',
                opacity: (isAdding || !newTitle.trim()) ? 0.6 : 1,
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              {isAdding ? '...' : '＋ Add'}
            </button>
          </form>
        </div>

        {/* Content */}
        <div className="dash-content" style={{ flex: 1, overflowY: 'auto', padding: 'clamp(12px, 3vw, 24px)' }}>
          {loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
               <div className="dash-spinner"></div>
               <span style={{ color: 'var(--text-muted)' }}>Fetching your tasks...</span>
            </div>
          ) : error ? (
             <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' }}>
                <div style={{ maxWidth: '400px' }}>
                   <span style={{ fontSize: '3rem', display: 'block', marginBottom: '20px' }}>⚠️</span>
                   <h3 style={{ color: 'var(--text-primary)' }}>{error}</h3>
                   <button 
                      onClick={fetchTasks}
                      style={{ 
                        marginTop: '20px', padding: '10px 24px', borderRadius: '12px', 
                        background: 'var(--accent)', color: 'white', border: 'none', fontWeight: 600 
                      }}
                   >Retry</button>
                </div>
             </div>
          ) : filteredTasks.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
               <span style={{ fontSize: '4rem', opacity: 0.3 }}>✨</span>
               <h3 style={{ color: 'var(--text-muted)' }}>{filter === 'all' ? 'No tasks yet!' : `No ${filter} tasks.`}</h3>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredTasks.map(task => (
                <div key={task._id} className="task-item" style={{
                  padding: '16px 20px', background: 'var(--bg-input)',
                  border: '1px solid var(--border)', borderRadius: '16px',
                  display: 'flex', alignItems: 'center', gap: '16px',
                  transition: 'all 0.2s', opacity: task.status === 'completed' ? 0.7 : 1
                }}>
                  {/* Status Checkbox */}
                  <button 
                    onClick={() => toggleTaskStatus(task._id, task.status)}
                    style={{
                      width: '24px', height: '24px', borderRadius: '6px',
                      border: `2px solid ${task.status === 'completed' ? 'var(--accent)' : 'var(--border)'}`,
                      background: task.status === 'completed' ? 'var(--accent)' : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0, transition: 'all 0.2s'
                    }}
                  >
                    {task.status === 'completed' && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ 
                      fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px',
                      textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {task.title}
                    </div>
                    {task.description && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.description}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    {task.dueDate && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        📅 {format(new Date(task.dueDate), 'MMM d')}
                      </div>
                    )}

                    <div style={{ 
                      fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px', 
                      background: `rgba(${getPriorityColor(task.priority)}, 0.1)`, 
                      color: getPriorityColor(task.priority),
                      fontWeight: 700, border: `1px solid ${getPriorityColor(task.priority)}22`,
                      textTransform: 'uppercase'
                    }}>
                      {task.priority}
                    </div>
                    
                    <button 
                       onClick={() => deleteTask(task._id, task.title)}
                       title="Delete task"
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

        @media (max-width: 768px) {
          .quick-add-form {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .quick-add-form button {
            width: 100%;
            justify-content: center;
          }
          .task-item {
            flex-wrap: wrap;
            gap: 12px !important;
            padding: 16px !important;
          }
          .task-item > div:last-child {
            width: 100%;
            justify-content: space-between;
            border-top: 1px solid var(--border);
            padding-top: 12px;
            margin-top: 4px;
          }
          .dash-header {
            flex-direction: column;
            align-items: flex-start !important;
            padding: 20px 24px !important;
          }
          .dash-header > button:last-child {
             position: absolute;
             top: 20px;
             right: 20px;
             margin-left: 0 !important;
          }
          .dash-content {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
