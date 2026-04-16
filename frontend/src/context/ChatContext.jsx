import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [sessions, setSessions] = useState([
    { id: uuidv4(), title: 'New Conversation', messages: [], createdAt: new Date(), status: 'idle' }
  ]);
  const [activeId, setActiveId] = useState(() => sessions[0].id);
  const { googleToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const sessionsRef = useRef(sessions);
  const activeIdRef = useRef(activeId);
  const pollingRefs = useRef(new Set()); // Keep track of polling sessionIds

  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  const activeSession = sessions.find(s => s.id === activeId) || sessions[0];

  const startPolling = useCallback((sessionId) => {
    if (pollingRefs.current.has(sessionId)) return;
    pollingRefs.current.add(sessionId);

    // Initial check before setting interval
    const fetchHistory = async () => {
      try {
        const { data } = await api.get(`/chat/history/${sessionId}`);
        setSessions(prev => prev.map(s => {
          if (s.id !== sessionId) return s;
          return { ...s, messages: data.messages, title: data.title || s.title, status: data.status };
        }));

        if (data.status === 'idle') {
          return true; // Done
        }
      } catch (err) {
        return true; // Stop on error
      }
      return false;
    };

    fetchHistory(); // Do one immediate check

    const intervalId = setInterval(async () => {
      const isDone = await fetchHistory();
      if (isDone) {
        clearInterval(intervalId);
        pollingRefs.current.delete(sessionId);
        if (activeIdRef.current === sessionId) {
          setLoading(false);
        }
      }
    }, 2500);
  }, []);

  const sendMessage = useCallback(async (text, attachment = null, targetId = null) => {
    if ((!text?.trim() && !attachment) || loading) return;
    setLoading(true);

    const sessionIdToUse = targetId || activeIdRef.current;
    
    // Optimistic UI update
    const userMsg = { id: uuidv4(), role: 'user', content: text || '', attachment, timestamp: new Date() };
    setSessions(prev => {
      if (!prev.find(s => s.id === sessionIdToUse)) return prev;
      return prev.map(s =>
        s.id === sessionIdToUse
          ? { ...s, messages: [...s.messages, userMsg], title: s.messages.length === 0 ? (text || 'Sent an attachment').slice(0, 45) : s.title, status: 'processing' }
          : s
      );
    });

    try {
      const currentSess = sessionsRef.current.find(s => s.id === sessionIdToUse);
      const history = (currentSess?.messages || []).slice(-18).map(m => ({ role: m.role, content: m.content, attachment: m.attachment }));
      
      const { data } = await api.post('/chat/message', { 
        message: text || '', 
        attachment, 
        sessionId: sessionIdToUse, 
        history 
      }, {
        headers: { 'x-google-token': googleToken }
      });

      if (data.status === 'processing') {
        startPolling(sessionIdToUse);
      } else {
        // Fallback for non-background responses or error demo modes
        if (data.reply) {
          const aiMsg = { id: uuidv4(), role: 'assistant', content: data.reply, timestamp: new Date(), demo: data.demo };
          setSessions(prev => prev.map(s =>
            s.id === sessionIdToUse ? { ...s, messages: [...s.messages, aiMsg], status: 'idle' } : s
          ));
        }
        setLoading(false);
      }
    } catch (err) {
      const errMsg = { id: uuidv4(), role: 'assistant', content: '⚠️ Connection error. Please check that the backend server is running and your API key is configured.', timestamp: new Date(), isError: true };
      setSessions(prev => prev.map(s =>
        s.id === sessionIdToUse ? { ...s, messages: [...s.messages, errMsg], status: 'idle' } : s
      ));
      setLoading(false);
    }
  }, [loading, startPolling]);

  const addDirectMessage = useCallback((content, role = 'assistant', targetId = null) => {
    const sessionIdToUse = targetId || activeIdRef.current;
    const msg = { id: uuidv4(), role, content, timestamp: new Date() };

    setSessions(prev => prev.map(s => 
      s.id === sessionIdToUse 
        ? { ...s, messages: [...s.messages, msg], title: s.messages.length === 0 ? content.slice(0, 45) : s.title }
        : s
    ));
  }, []);

  const newSession = useCallback(() => {
    const s = { id: uuidv4(), title: 'New Conversation', messages: [], createdAt: new Date(), status: 'idle' };
    setSessions(prev => [s, ...prev]);
    setActiveId(s.id);
    return s.id;
  }, []);

  const deleteSession = useCallback((id) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      if (next.length === 0) {
        const fresh = { id: uuidv4(), title: 'New Conversation', messages: [], createdAt: new Date(), status: 'idle' };
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  }, [activeId]);

  const updateMessage = useCallback((sessionId, messageId, newContent) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      return {
        ...s,
        messages: s.messages.map(m =>
          m.id === messageId ? { ...m, content: newContent } : m
        )
      };
    }));
  }, []);

  return (
    <ChatContext.Provider value={{ sessions, activeSession, activeId, setActiveId, loading, sendMessage, addDirectMessage, newSession, deleteSession, updateMessage }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
