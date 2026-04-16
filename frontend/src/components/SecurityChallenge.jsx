import { useState, useEffect } from 'react';

export default function SecurityChallenge({ email, tempToken, onVerify, onCancel }) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    document.getElementById('code-0')?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) document.getElementById(`code-${index + 1}`).focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`).focus();
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const finalCode = code.join('');
    if (finalCode.length < 6) return;

    setLoading(true);
    setError(null);
    try {
      await onVerify(tempToken, finalCode);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code.every(digit => digit !== '')) handleSubmit();
  }, [code]);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.6)', 
      backdropFilter: 'blur(10px)',
      zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        maxWidth: 420, width: '100%', textAlign: 'center',
        background: 'var(--bg-card)', padding: '40px 30px',
        borderRadius: 24, border: '1px solid var(--border)',
        boxShadow: '0 30px 100px rgba(0,0,0,0.4)',
        animation: 'modalSlide 0.4s ease-out'
      }}>
        <div style={{
          width: 50, height: 50, background: 'rgba(58, 134, 255, 0.1)',
          borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', margin: '0 auto 20px', color: 'var(--accent)',
          boxShadow: '0 0 20px rgba(58, 134, 255, 0.2)'
        }}>🛡️</div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 10px', color: 'var(--text-primary)' }}>Security Code</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: 30 }}>
          Enter the 6-digit code sent to <br/>
          <strong style={{ color: 'var(--accent)' }}>{email}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 25 }}>
            {code.map((digit, i) => (
              <input
                key={i} id={`code-${i}`}
                type="text" maxLength="1"
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                style={{
                  width: 42, height: 52, borderRadius: 12,
                  border: '2px solid var(--border)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontSize: '1.3rem', fontWeight: 700,
                  textAlign: 'center', outline: 'none',
                  transition: 'all 0.2s ease',
                  borderColor: digit ? 'var(--accent)' : 'var(--border)'
                }}
              />
            ))}
          </div>

          {error && (
            <div style={{ color: '#ff4d4f', fontSize: '0.8rem', marginBottom: 15, padding: '8px', background: 'rgba(255,77,79,0.1)', borderRadius: 8 }}>
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading || code.some(d => !d)}
            style={{
              width: '100%', padding: '12px', borderRadius: 12,
              background: 'var(--accent)', color: '#fff',
              fontSize: '0.95rem', fontWeight: 700, border: 'none',
              cursor: 'pointer', transition: 'all 0.2s ease',
              opacity: (loading || code.some(d => !d)) ? 0.6 : 1,
              boxShadow: '0 4px 15px var(--glow)'
            }}
          >
            {loading ? 'Verifying...' : 'Unlock Account'}
          </button>
        </form>

        <div style={{ marginTop: 25, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <button 
            onClick={() => setResendCooldown(60)}
            disabled={resendCooldown > 0}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', opacity: resendCooldown > 0 ? 0.5 : 1 }}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
          </button>
        </div>

        <button 
          onClick={onCancel}
          style={{ marginTop: 20, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Go Back
        </button>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlide { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}
