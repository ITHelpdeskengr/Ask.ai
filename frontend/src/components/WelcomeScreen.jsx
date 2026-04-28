import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';



export default function WelcomeScreen() {
  const { sendMessage } = useChat();
  const { user } = useAuth();

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: 'clamp(16px, 5vw, 40px) clamp(12px, 3vw, 24px)',
      maxWidth: 840,
      margin: '0 auto',
      width: '100%',
      position: 'relative',
    }}>

      {/* Greeting */}
      <div style={{ animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both', marginBottom: 12 }}>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          color: 'var(--text-primary)',
        }}>
          <br />
          How can I help you today?
        </h1>
      </div>

      <p style={{
        fontSize: 'clamp(1rem, 2vw, 1.2rem)',
        color: 'var(--text-secondary)',
        marginBottom: 48,
        lineHeight: 1.6,
        maxWidth: 600,
        animation: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        animationDelay: '0.1s',
      }}>

      </p>


    </div>
  );
}


