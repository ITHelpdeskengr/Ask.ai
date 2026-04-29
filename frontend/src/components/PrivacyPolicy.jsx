import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function PrivacyPolicy() {
  const { toggle, theme } = useTheme();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      color: 'var(--text-primary)',
      padding: 'clamp(12px, 3vw, 24px) clamp(10px, 2vw, 16px)',
      fontFamily: 'var(--font-main)',
      overflowX: 'hidden'
    }}>
      <div style={{
        maxWidth: '640px',
        margin: '0 auto',
        background: 'var(--bg-card)',
        padding: 'clamp(14px, 4vw, 24px)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h1 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 700, margin: 0 }}>Privacy Policy</h1>
          <button onClick={() => window.location.href = '/'} style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 'clamp(0.72rem, 2.5vw, 0.82rem)', background: 'none', border: 'none', cursor: 'pointer' }}>Back to Home</button>
        </div>

        <div className="md-content" style={{ lineHeight: '1.55', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: 12 }}><strong style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>Last Updated: April 21, 2026</strong></p>

          <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '14px 0 5px', color: 'var(--text-primary)' }}>1. Introduction</h2>
          <p style={{ margin: '0 0 10px' }}>Welcome to HELPDESK. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights.</p>

          <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '14px 0 5px', color: 'var(--text-primary)' }}>2. Data We Collect</h2>
          <p style={{ margin: '0 0 6px' }}>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
          <ul style={{ margin: '0 0 10px', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <li><strong style={{ color: 'var(--text-primary)' }}>Identity Data</strong>: First name, last name, username or similar identifier.</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Contact Data</strong>: Email address.</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Technical Data</strong>: IP address, login data, browser type and version, time zone setting and location.</li>
            <li><strong style={{ color: 'var(--text-primary)' }}>Usage Data</strong>: Information about how you use our website and services.</li>
          </ul>

          <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '14px 0 5px', color: 'var(--text-primary)' }}>3. How We Use Your Data</h2>
          <p style={{ margin: '0 0 6px' }}>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
          <ul style={{ margin: '0 0 10px', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
            <li>Where it is necessary for our legitimate interests and your interests and fundamental rights do not override those interests.</li>
            <li>Where we need to comply with a legal obligation.</li>
          </ul>

          <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '14px 0 5px', color: 'var(--text-primary)' }}>4. Google OAuth</h2>
          <p style={{ margin: '0 0 10px' }}>HELPDESK uses Google OAuth to allow you to sign in securely. We only request access to the scopes necessary to provide our services, such as reading your calendar or emails if you explicitly enable those integrations. We do not sell your personal data to third parties.</p>

          <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '14px 0 5px', color: 'var(--text-primary)' }}>5. Your Rights</h2>
          <p style={{ margin: '0 0 10px' }}>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, or restriction of processing.</p>

          <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '14px 0 5px', color: 'var(--text-primary)' }}>6. Contact Us</h2>
          <p style={{ margin: '0 0 10px' }}>If you have any questions about this privacy policy or our privacy practices, please contact us at support@ask.ai.</p>
        </div>
      </div>
    </div>
  );
}
