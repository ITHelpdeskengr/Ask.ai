import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function LandingPage() {
  const { theme, toggle } = useTheme();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-main)',
      transition: 'all var(--transition)',
      overflowX: 'hidden'
    }}>
      {/* Navbar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 8%',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(12px)',
        background: 'rgba(var(--bg-base-rgb), 0.7)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, var(--accent) 0%, #ff6b6b 100%)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(230,57,70,0.3)'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>ASK.ai</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button onClick={toggle} style={{ color: 'var(--text-secondary)' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button 
            onClick={() => window.location.href = '/login'}
            style={{
              padding: '10px 24px',
              borderRadius: '12px',
              background: 'var(--accent)',
              color: 'white',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(230,57,70,0.2)'
            }}
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: '120px 8% 80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Glow Background */}
        <div style={{
          position: 'absolute',
          width: '600px', height: '600px',
          background: 'var(--glow)',
          borderRadius: '50%',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          filter: 'blur(120px)',
          opacity: 0.4,
          zIndex: -1
        }} />

        <h1 style={{
          fontSize: 'clamp(3rem, 8vw, 4.5rem)',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-2px',
          marginBottom: '24px',
          maxWidth: '900px'
        }}>
          Experience the <span style={{ color: 'var(--accent)' }}>Next-Gen</span> Artificial Intelligence
        </h1>
        <p style={{
          fontSize: '1.25rem',
          color: 'var(--text-secondary)',
          maxWidth: '650px',
          lineHeight: 1.6,
          marginBottom: '40px'
        }}>
          Streamline your workspace with the most powerful AI assistant. Integrated with Gmail, Calendar, and Drive to help you focus on what matters.
        </p>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => window.location.href = '/login'}
            style={{
              padding: '16px 40px',
              borderRadius: '16px',
              background: 'var(--accent)',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: 700,
              boxShadow: '0 8px 32px rgba(230,57,70,0.3)',
              transition: 'all 0.3s'
            }}
          >
            Get Started Free
          </button>
          <button 
            style={{
              padding: '16px 40px',
              borderRadius: '16px',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '1.1rem',
              fontWeight: 600,
              border: '1px solid var(--border)',
              transition: 'all 0.3s'
            }}
          >
            Watch Demo
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '80px 8%', background: 'rgba(var(--bg-surface-rgb), 0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '16px' }}>Workflow Redefined</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Everything you need to boost your productivity in one place.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px'
        }}>
          {[
            { title: 'Smart Inbox', desc: 'AI-powered email summaries and priority management for your Gmail.', icon: '📩' },
            { title: 'Dynamic Calendar', desc: 'Auto-schedule meetings and stay on top of your events effortlessly.', icon: '🗓️' },
            { title: 'Drive Integration', desc: 'Search and analyze your documents instantly with semantic AI search.', icon: '📂' },
            { title: 'Task Mastery', desc: 'Break down complex goals into actionable daily tasks automatically.', icon: '⚡' }
          ].map((f, i) => (
            <div key={i} style={{
              padding: '40px',
              borderRadius: '24px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              transition: 'transform 0.3s',
              cursor: 'default'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '20px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '60px 8%',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        <div style={{ display: 'flex', gap: '32px' }}>
          <a href="/privacy" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Privacy Policy</a>
          <a href="/terms" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Terms of Service</a>
          <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Contact</a>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          © 2026 ASK.ai. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
