import { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import FilesPanel from './FilesPanel';

const MOBILE_BREAKPOINT = 768;

export default function Layout({ isAdmin, onSwitchToAdmin }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BREAKPOINT);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > MOBILE_BREAKPOINT);
  const [filesPanelOpen, setFilesPanelOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg-base)',
      position: 'relative',
    }}>
      <Sidebar 
        open={sidebarOpen} 
        onToggle={() => setSidebarOpen(o => !o)} 
        onClose={closeSidebar}
        onOpenFilesPanel={() => setFilesPanelOpen(true)}
        isAdmin={isAdmin}
        onSwitchToAdmin={onSwitchToAdmin}
        isMobile={isMobile}
      />
      <ChatArea
        sidebarOpen={sidebarOpen}
        onMenuClick={() => setSidebarOpen(o => !o)}
        filesPanelOpen={filesPanelOpen}
        onToggleFilesPanel={() => setFilesPanelOpen(o => !o)}
        isMobile={isMobile}
      />
      {filesPanelOpen && (
        <FilesPanel open={filesPanelOpen} onClose={() => setFilesPanelOpen(false)} />
      )}
    </div>
  );
}
