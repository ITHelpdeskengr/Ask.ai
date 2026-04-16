import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useChat } from './ChatContext';
import { useTheme } from './ThemeContext';
import api from '../utils/api';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const { googleToken, requestGoogleAccess, logout } = useAuth();
  const { sessions, activeId, newSession, addDirectMessage, deleteSession, sendMessage } = useChat();
  const { toggle } = useTheme();

  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showCalendarDashboard, setShowCalendarDashboard] = useState(false);
  const [showTaskDashboard, setShowTaskDashboard] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showEmailDashboard, setShowEmailDashboard] = useState(false);
  
  const [isFetchingGmail, setIsFetchingGmail] = useState(false);
  const [isFetchingCalendar, setIsFetchingCalendar] = useState(false);
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          const wasCommand = handleVoiceCommand(finalTranscript);
          if (!wasCommand) {
             const message = finalTranscript.trim();
             if (message) {
               sendMessage(message);
             }
          }
        }
      };

      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const handleVoiceCommand = (text) => {
    const lower = text.toLowerCase().trim();
    
    // Core App Commands
    if (['new chat', 'new conversation', 'start over', 'fresh chat'].includes(lower)) {
      newSession();
      return true;
    }

    if (lower === 'stop listening' || lower === 'stop recording') {
      toggleListening();
      return true;
    }

    // Modal/Feature Commands
    if (['open calendar', 'view calendar', 'show my calendar', 'open my calendar', 'show schedule', 'view schedule'].includes(lower)) {
      openCalendar();
      return true;
    }

    if (['check emails', 'show emails', 'open emails', 'check my emails', 'show my emails', 'inbox', 'open inbox'].includes(lower)) {
      setShowEmailDashboard(true);
      return true;
    }

    if (['create meeting', 'schedule meeting', 'new meeting', 'add meeting'].includes(lower)) {
      setShowMeetingModal(true);
      return true;
    }

    if (['add task', 'create task', 'new task', 'add to do', 'add todo', 'view tasks', 'show tasks', 'open tasks', 'my tasks', 'show my tasks'].includes(lower)) {
      setShowTaskDashboard(true);
      return true;
    }

    // Theme and Session Commands
    if (['toggle theme', 'switch theme', 'change theme', 'dark mode', 'light mode', 'change color'].includes(lower)) {
      toggleTheme();
      return true;
    }

    if (['logout', 'sign out', 'log me out', 'exit'].includes(lower)) {
      logoutUser();
      return true;
    }

    if (['delete chat', 'delete conversation', 'clear history', 'delete history'].includes(lower)) {
      deleteCurrentSession();
      return true;
    }

    return false;
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (err) {
          console.error('Failed to start speech recognition', err);
        }
      } else {
        alert('Speech recognition is not supported in this browser.');
      }
    }
  };

  const getTargetSessionId = () => {
    if (sessions.find(s => s.id === activeId)?.messages.length > 0) {
      return newSession();
    }
    return activeId;
  };

  const openCalendar = () => {
    if (!googleToken) {
      requestGoogleAccess();
      return;
    }
    setShowCalendarDashboard(true);
  };

  const openEmails = async () => {
    if (!googleToken) {
      requestGoogleAccess();
      return;
    }
    setShowEmailDashboard(true);
  };
  const toggleTheme = () => toggle();
  
  const logoutUser = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      logout();
    }
  };

  const deleteCurrentSession = () => {
    if (activeId && window.confirm("Are you sure you want to delete this conversation?")) {
      deleteSession(activeId);
    }
  };

  const value = {
    showMeetingModal, setShowMeetingModal,
    showCalendarDashboard, setShowCalendarDashboard,
    showTaskDashboard, setShowTaskDashboard,
    showAdminDashboard, setShowAdminDashboard,
    showEmailDashboard, setShowEmailDashboard,
    isFetchingGmail,
    isFetchingCalendar,
    openCalendar,
    openEmails,
    getTargetSessionId,
    toggleTheme,
    logoutUser,
    deleteCurrentSession,
    isListening,
    toggleListening
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
