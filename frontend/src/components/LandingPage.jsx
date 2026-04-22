import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function LandingPage() {
  const { theme, toggle } = useTheme();

  return (
    <>
      <style>{`
        .lp-root {
          min-height: 100vh;
          background: var(--bg-base);
          color: var(--text-primary);
          font-family: var(--font-main);
          transition: all var(--transition);
          overflow-x: hidden;
        }

        /* ── Navbar ── */
        .lp-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 8%;
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(12px);
          background: rgba(var(--bg-base-rgb, 15, 17, 23), 0.7);
          border-bottom: 1px solid var(--border);
        }
        .lp-nav-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .lp-nav-logo {
          width: 30px; height: 30px;
          background: linear-gradient(135deg, var(--accent) 0%, #ff6b6b 100%);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(230,57,70,0.3);
          flex-shrink: 0;
        }
        .lp-nav-title {
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .lp-nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .lp-theme-btn {
          color: var(--text-secondary);
          font-size: 1.1rem;
          padding: 4px;
        }
        .lp-signin-btn {
          padding: 9px 20px;
          border-radius: 10px;
          background: var(--accent);
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          box-shadow: 0 4px 14px rgba(230,57,70,0.2);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .lp-signin-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(230,57,70,0.35);
        }

        /* ── Hero ── */
        .lp-hero {
          padding: 80px 8% 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
        }
        .lp-glow {
          position: absolute;
          width: 500px; height: 500px;
          background: var(--glow);
          border-radius: 50%;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          filter: blur(120px);
          opacity: 0.4;
          z-index: -1;
          pointer-events: none;
        }
        .lp-hero h1 {
          font-size: clamp(2.2rem, 7vw, 4rem);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -1.5px;
          margin-bottom: 20px;
          max-width: 800px;
        }
        .lp-hero h1 span {
          color: var(--accent);
        }
        .lp-hero-desc {
          font-size: 1.1rem;
          color: var(--text-secondary);
          max-width: 580px;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .lp-hero-btns {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .lp-btn-primary {
          padding: 14px 32px;
          border-radius: 14px;
          background: var(--accent);
          color: white;
          font-size: 1rem;
          font-weight: 700;
          box-shadow: 0 8px 32px rgba(230,57,70,0.3);
          transition: all 0.3s;
        }
        .lp-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(230,57,70,0.4);
        }
        .lp-btn-secondary {
          padding: 14px 32px;
          border-radius: 14px;
          background: var(--bg-card);
          color: var(--text-primary);
          font-size: 1rem;
          font-weight: 600;
          border: 1px solid var(--border);
          transition: all 0.3s;
        }
        .lp-btn-secondary:hover {
          transform: translateY(-2px);
          background: var(--bg-hover);
        }

        /* ── Features ── */
        .lp-features {
          padding: 60px 8%;
          background: rgba(var(--bg-surface-rgb, 23, 27, 37), 0.3);
        }
        .lp-features-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .lp-features-header h2 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 12px;
        }
        .lp-features-header p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }
        .lp-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 24px;
        }
        .lp-feature-card {
          padding: 32px;
          border-radius: 20px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          transition: transform 0.3s;
          cursor: default;
        }
        .lp-feature-card:hover {
          transform: translateY(-6px);
        }
        .lp-feature-icon {
          font-size: 2rem;
          margin-bottom: 16px;
        }
        .lp-feature-card h3 {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .lp-feature-card p {
          color: var(--text-secondary);
          line-height: 1.6;
          font-size: 0.92rem;
        }

        /* ── Footer ── */
        .lp-footer {
          padding: 48px 8%;
          border-top: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .lp-footer-links {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .lp-footer-links a {
          color: var(--text-secondary);
          font-size: 0.85rem;
        }
        .lp-footer-copy {
          color: var(--text-muted);
          font-size: 0.8rem;
        }

        /* ══════════════════════════════════════
           TABLET (≤ 768px)
           ══════════════════════════════════════ */
        @media (max-width: 768px) {
          .lp-nav {
            padding: 16px 5%;
          }
          .lp-hero {
            padding: 56px 5% 44px;
          }
          .lp-hero h1 {
            font-size: clamp(1.6rem, 8vw, 2.8rem);
            letter-spacing: -1px;
            margin-bottom: 14px;
          }
          .lp-hero-desc {
            font-size: 0.95rem;
            margin-bottom: 24px;
          }
          .lp-btn-primary,
          .lp-btn-secondary {
            padding: 12px 24px;
            font-size: 0.9rem;
            border-radius: 12px;
          }
          .lp-features {
            padding: 44px 5%;
          }
          .lp-features-header h2 {
            font-size: 1.6rem;
          }
          .lp-features-grid {
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
          }
          .lp-feature-card {
            padding: 24px;
            border-radius: 16px;
          }
          .lp-feature-icon {
            font-size: 1.7rem;
            margin-bottom: 12px;
          }
          .lp-feature-card h3 {
            font-size: 1.1rem;
          }
          .lp-feature-card p {
            font-size: 0.85rem;
          }
          .lp-footer {
            padding: 36px 5%;
          }
          .lp-glow {
            width: 300px; height: 300px;
          }
        }

        /* ══════════════════════════════════════
           SMALL MOBILE (≤ 480px)
           ══════════════════════════════════════ */
        @media (max-width: 480px) {
          .lp-nav {
            padding: 12px 4%;
            gap: 8px;
          }
          .lp-nav-logo {
            width: clamp(22px, 6vw, 26px); height: clamp(22px, 6vw, 26px);
            border-radius: 7px;
          }
          .lp-nav-logo svg {
            width: 14px; height: 14px;
          }
          .lp-nav-title {
            font-size: 1rem;
          }
          .lp-nav-actions {
            gap: 10px;
          }
          .lp-theme-btn {
            font-size: 0.95rem;
          }
          .lp-signin-btn {
            padding: 7px 14px;
            font-size: 0.8rem;
            border-radius: 8px;
          }

          .lp-hero {
            padding: 40px 4% 32px;
          }
          .lp-hero h1 {
            font-size: clamp(1.4rem, 7vw, 1.8rem);
            letter-spacing: -0.6px;
            margin-bottom: 10px;
          }
          .lp-hero-desc {
            font-size: 0.85rem;
            line-height: 1.5;
            margin-bottom: 20px;
          }
          .lp-hero-btns {
            flex-direction: column;
            width: 100%;
            gap: 10px;
          }
          .lp-btn-primary,
          .lp-btn-secondary {
            width: 100%;
            padding: 12px 20px;
            font-size: 0.88rem;
            border-radius: 10px;
            text-align: center;
          }

          .lp-features {
            padding: 32px 4%;
          }
          .lp-features-header {
            margin-bottom: 28px;
          }
          .lp-features-header h2 {
            font-size: 1.35rem;
            margin-bottom: 8px;
          }
          .lp-features-header p {
            font-size: 0.82rem;
          }
          .lp-features-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .lp-feature-card {
            padding: 20px;
            border-radius: 14px;
          }
          .lp-feature-icon {
            font-size: 1.5rem;
            margin-bottom: 10px;
          }
          .lp-feature-card h3 {
            font-size: 1rem;
            margin-bottom: 6px;
          }
          .lp-feature-card p {
            font-size: 0.8rem;
            line-height: 1.5;
          }

          .lp-footer {
            padding: 28px 4%;
            gap: 14px;
          }
          .lp-footer-links {
            gap: 16px;
          }
          .lp-footer-links a {
            font-size: 0.78rem;
          }
          .lp-footer-copy {
            font-size: 0.72rem;
          }
          .lp-glow {
            width: 200px; height: 200px;
            filter: blur(80px);
          }
        }

        /* ══════════════════════════════════════
           VERY SMALL (≤ 360px — small Android)
           ══════════════════════════════════════ */
        @media (max-width: 360px) {
          .lp-hero h1 {
            font-size: 1.35rem;
          }
          .lp-hero-desc {
            font-size: 0.8rem;
          }
          .lp-btn-primary,
          .lp-btn-secondary {
            padding: 10px 16px;
            font-size: 0.82rem;
          }
          .lp-feature-card {
            padding: 16px;
          }
          .lp-feature-card h3 {
            font-size: 0.92rem;
          }
          .lp-feature-card p {
            font-size: 0.76rem;
          }
        }
      `}</style>

      <div className="lp-root">
        {/* Navbar */}
        <nav className="lp-nav">
          <div className="lp-nav-brand">
            <div className="lp-nav-logo">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
            </div>
            <span className="lp-nav-title">ASK.ai</span>
          </div>

          <div className="lp-nav-actions">
            <button className="lp-theme-btn" onClick={toggle}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              className="lp-signin-btn"
              onClick={() => window.location.href = '/login'}
            >
              Sign In
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="lp-hero">
          <div className="lp-glow" />
          <h1>
            Experience the <span>Next-Gen</span> Artificial Intelligence
          </h1>
          <p className="lp-hero-desc">
            Streamline your workspace with the most powerful AI assistant. Integrated with Gmail, Calendar, and Drive to help you focus on what matters.
          </p>
          <div className="lp-hero-btns">
            <button
              className="lp-btn-primary"
              onClick={() => window.location.href = '/login'}
            >
              Get Started Free
            </button>
          </div>
        </section>

        {/* Features Grid */}
        <section className="lp-features">
          <div className="lp-features-header">
            <h2>Workflow Redefined</h2>
            <p>Everything you need to boost your productivity in one place.</p>
          </div>

          <div className="lp-features-grid">
            {[
              { title: 'Smart Inbox', desc: 'AI-powered email summaries and priority management for your Gmail.', icon: '📩' },
              { title: 'Dynamic Calendar', desc: 'Auto-schedule meetings and stay on top of your events effortlessly.', icon: '🗓️' },
              { title: 'Drive Integration', desc: 'Search and analyze your documents instantly with semantic AI search.', icon: '📂' },
              { title: 'Task Mastery', desc: 'Break down complex goals into actionable daily tasks automatically.', icon: '⚡' }
            ].map((f, i) => (
              <div key={i} className="lp-feature-card">
                <div className="lp-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="lp-footer">
          <div className="lp-footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="#">Contact</a>
          </div>
          <p className="lp-footer-copy">© 2026 ASK.ai. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}
