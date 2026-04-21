import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function TermsOfService() {
  const { theme } = useTheme();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      color: 'var(--text-primary)',
      padding: 'clamp(20px, 5vw, 40px) clamp(12px, 3vw, 20px)',
      fontFamily: 'var(--font-main)',
      overflowX: 'hidden'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'var(--bg-card)',
        padding: 'clamp(20px, 6vw, 40px)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 700, margin: 0 }}>Terms of Service</h1>
          <button onClick={() => window.location.href = '/'} style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 'clamp(0.85rem, 3vw, 1rem)' }}>Back to Home</button>
        </div>

        <div className="md-content" style={{ lineHeight: '1.8' }}>
          <p><strong>Effective Date: April 21, 2026</strong></p>
          
          <h2>1. Agreement to Terms</h2>
          <p>By accessing or using ASK.ai, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use the service.</p>

          <h2>2. Description of Service</h2>
          <p>ASK.ai is an intelligent AI assistant that integrates with your digital workspace (Google Calendar, Gmail, Drive) to help you manage tasks, meetings, and information more efficiently.</p>

          <h2>3. User Accounts</h2>
          <p>You are responsible for safeguarding your account access and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.</p>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to use the service for any illegal or unauthorized purpose. You must not use the service to harass, abuse, or harm another person.</p>

          <h2>5. Intellectual Property</h2>
          <p>The service and its original content, features, and functionality are and will remain the exclusive property of ASK.ai and its licensors.</p>

          <h2>6. Termination</h2>
          <p>We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation a breach of the Terms.</p>

          <h2>7. Limitation of Liability</h2>
          <p>In no event shall ASK.ai, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>

          <h2>8. Governing Law</h2>
          <p>These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which ASK.ai operates, without regard to its conflict of law provisions.</p>

          <h2>9. Changes to Terms</h2>
          <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any significant changes.</p>
        </div>
      </div>
    </div>
  );
}
