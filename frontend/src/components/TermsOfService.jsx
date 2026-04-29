import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function TermsOfService() {
  const { theme } = useTheme();

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
          <h1 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', fontWeight: 700, margin: 0 }}>Terms of Service</h1>
          <button onClick={() => window.location.href = '/'} style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 'clamp(0.72rem, 2.5vw, 0.82rem)', background: 'none', border: 'none', cursor: 'pointer' }}>Back to Home</button>
        </div>

        <div className="md-content" style={{ lineHeight: '1.55', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: 12 }}><strong style={{ color: 'var(--text-primary)', fontSize: '0.8rem' }}>Effective Date: April 21, 2026</strong></p>

          <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '14px 0 5px', color: 'var(--text-primary)' }}>1. Agreement to Terms</h2>
          <p style={{ margin: '0 0 10px' }}>By accessing or using HELPDESK, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the service.</p>

          <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '14px 0 5px', color: 'var(--text-primary)' }}>2. Description of Service</h2>
          <p style={{ margin: '0 0 10px' }}>HELPDESK is an intelligent AI assistant that integrates with your digital workspace (Google Calendar, Gmail, Drive) to help you manage tasks, meetings, and information more efficiently.</p>

          <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '14px 0 5px', color: 'var(--text-primary)' }}>3. User Accounts</h2>
          <p style={{ margin: '0 0 10px' }}>You are responsible for safeguarding your account access and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.</p>

          <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '14px 0 5px', color: 'var(--text-primary)' }}>4. Acceptable Use</h2>
          <p style={{ margin: '0 0 10px' }}>You agree not to use the service for any illegal or unauthorized purpose. You must not use the service to harass, abuse, or harm another person.</p>

          <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '14px 0 5px', color: 'var(--text-primary)' }}>5. Intellectual Property</h2>
          <p style={{ margin: '0 0 10px' }}>The service and its original content, features, and functionality are and will remain the exclusive property of HELPDESK and its licensors.</p>

          <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '14px 0 5px', color: 'var(--text-primary)' }}>6. Termination</h2>
          <p style={{ margin: '0 0 10px' }}>We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation a breach of the Terms.</p>

          <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '14px 0 5px', color: 'var(--text-primary)' }}>7. Limitation of Liability</h2>
          <p style={{ margin: '0 0 10px' }}>In no event shall HELPDESK, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>

          <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '14px 0 5px', color: 'var(--text-primary)' }}>8. Governing Law</h2>
          <p style={{ margin: '0 0 10px' }}>These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which HELPDESK operates, without regard to its conflict of law provisions.</p>

          <h2 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '14px 0 5px', color: 'var(--text-primary)' }}>9. Changes to Terms</h2>
          <p style={{ margin: '0 0 10px' }}>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any significant changes.</p>
        </div>
      </div>
    </div>
  );
}
