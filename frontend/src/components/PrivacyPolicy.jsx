import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function PrivacyPolicy() {
  const { toggle, theme } = useTheme();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      color: 'var(--text-primary)',
      padding: '40px 20px',
      fontFamily: 'var(--font-main)'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'var(--bg-card)',
        padding: '40px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Privacy Policy</h1>
          <button onClick={() => window.location.href = '/'} style={{ color: 'var(--accent)', fontWeight: 600 }}>Back to Home</button>
        </div>

        <div className="md-content" style={{ lineHeight: '1.8' }}>
          <p><strong>Last Updated: April 21, 2026</strong></p>
          
          <h2>1. Introduction</h2>
          <p>Welcome to ASK.ai. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights.</p>

          <h2>2. Data We Collect</h2>
          <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
          <ul>
            <li><strong>Identity Data</strong>: First name, last name, username or similar identifier.</li>
            <li><strong>Contact Data</strong>: Email address.</li>
            <li><strong>Technical Data</strong>: IP address, login data, browser type and version, time zone setting and location.</li>
            <li><strong>Usage Data</strong>: Information about how you use our website and services.</li>
          </ul>

          <h2>3. How We Use Your Data</h2>
          <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
          <ul>
            <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
            <li>Where it is necessary for our legitimate interests and your interests and fundamental rights do not override those interests.</li>
            <li>Where we need to comply with a legal obligation.</li>
          </ul>

          <h2>4. Google OAuth</h2>
          <p>ASK.ai uses Google OAuth to allow you to sign in securely. We only request access to the scopes necessary to provide our services, such as reading your calendar or emails if you explicitly enable those integrations. We do not sell your personal data to third parties.</p>

          <h2>5. Your Rights</h2>
          <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, or restriction of processing.</p>

          <h2>6. Contact Us</h2>
          <p>If you have any questions about this privacy policy or our privacy practices, please contact us at support@ask.ai.</p>
        </div>
      </div>
    </div>
  );
}
