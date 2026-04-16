export default function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', padding: '0 4px', animation: 'fadeUp 0.3s ease both' }}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--accent) 0%, #c1121f 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: '0.85rem',
      }}>
        🤖
      </div>
      <div style={{
        background: 'var(--msg-ai-bg)',
        border: '1px solid var(--border)',
        borderRadius: '18px 18px 18px 4px',
        padding: '14px 18px',
        display: 'flex', gap: 5, alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--accent)',
            display: 'inline-block',
            animation: 'pulse 1.2s ease infinite',
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  );
}
