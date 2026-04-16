import { useState } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import FilesPanel from './FilesPanel';

export default function Layout({ isAdmin, onSwitchToAdmin }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filesPanelOpen, setFilesPanelOpen] = useState(false);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg-base)',
    }}>
      <Sidebar 
        open={sidebarOpen} 
        onToggle={() => setSidebarOpen(o => !o)} 
        onOpenFilesPanel={() => setFilesPanelOpen(true)}
        isAdmin={isAdmin}
        onSwitchToAdmin={onSwitchToAdmin}
      />
      <ChatArea
        sidebarOpen={sidebarOpen}
        onMenuClick={() => setSidebarOpen(o => !o)}
        filesPanelOpen={filesPanelOpen}
        onToggleFilesPanel={() => setFilesPanelOpen(o => !o)}
      />
      {filesPanelOpen && (
        <FilesPanel open={filesPanelOpen} onClose={() => setFilesPanelOpen(false)} />
      )}
    </div>
  );
}
