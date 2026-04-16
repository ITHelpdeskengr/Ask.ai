import { useUI } from '../context/UIContext';
import { useRef, useState, useEffect } from 'react';

export default function VoiceFloatingButton() {
  const { isListening, toggleListening } = useUI();

  const btnRef = useRef(null);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const [pos, setPos] = useState({ bottom: 100, right: 30 });
  const hasDragged = useRef(false);

  // Convert bottom/right to top/left for easier drag math
  const [xy, setXY] = useState(null); // null = use bottom/right defaults

  useEffect(() => {
    // Once mounted, convert to fixed top/left coords
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setXY({ x: rect.left, y: rect.top });
  }, []);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    dragging.current = true;
    hasDragged.current = false;
    const el = btnRef.current;
    const rect = el.getBoundingClientRect();
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!dragging.current) return;
    hasDragged.current = true;
    const newX = e.clientX - offset.current.x;
    const newY = e.clientY - offset.current.y;
    // Clamp within viewport
    const maxX = window.innerWidth - 56;
    const maxY = window.innerHeight - 56;
    setXY({ x: Math.max(0, Math.min(newX, maxX)), y: Math.max(0, Math.min(newY, maxY)) });
  };

  const onPointerUp = (e) => {
    if (!dragging.current) return;
    dragging.current = false;
    // If barely moved, treat as click
    if (!hasDragged.current) toggleListening();
  };

  if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) return null;

  const posStyle = xy
    ? { top: xy.y, left: xy.x, bottom: 'auto', right: 'auto' }
    : { bottom: pos.bottom, right: pos.right };

  return (
    <button
      ref={btnRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: 'fixed',
        ...posStyle,
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: isListening
          ? 'linear-gradient(135deg, #e63946, #ff4d6d)'
          : 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        border: isListening ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: dragging.current ? 'grabbing' : 'grab',
        zIndex: 1000,
        boxShadow: isListening
          ? '0 0 20px rgba(230, 57, 70, 0.5)'
          : '0 8px 32px rgba(0, 0, 0, 0.2)',
        transition: dragging.current ? 'none' : 'box-shadow 0.3s, background 0.3s',
        animation: isListening ? 'pulse-red 1.5s infinite' : 'none',
        userSelect: 'none',
        touchAction: 'none',
      }}
      title={isListening ? 'Listening...' : 'Voice Command (drag to move)'}
      onMouseEnter={e => {
        if (!isListening && !dragging.current) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
        }
      }}
      onMouseLeave={e => {
        if (!isListening) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
      </svg>
    </button>
  );
}
