import React, { useEffect } from 'react';
import { useWorkspaceStore } from './store/workspaceStore';
import { Header } from './components/shell/Header';
import { Sidebar } from './components/shell/Sidebar';
import { PropertiesPanel } from './components/shell/PropertiesPanel';
import { StatusBar } from './components/shell/StatusBar';
import { CommandPalette } from './components/shell/CommandPalette';
import { HomeScreen } from './features/home/HomeScreen';
import { ViewerWorkspace } from './features/viewer/ViewerWorkspace';

import { MergeModal } from './features/organize/MergeModal';
import { ImageConvertModal } from './features/convert/ImageConvertModal';

export const App: React.FC = () => {
  const { document: activeDoc, theme, activeTool, setActiveTool } = useWorkspaceStore();

  // Sync theme with HTML root class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans">
      {/* Top Application Shell Header */}
      <Header />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeDoc ? (
          <>
            <Sidebar />
            <ViewerWorkspace />
            <PropertiesPanel />
          </>
        ) : (
          <>
            <HomeScreen />
            {/* Standalone modals from Home screen */}
            <MergeModal
              isOpen={activeTool === 'merge'}
              onClose={() => setActiveTool(null)}
            />
            <ImageConvertModal
              isOpen={activeTool === 'convert-images' || activeTool === 'img_to_pdf'}
              initialMode="img_to_pdf"
              onClose={() => setActiveTool(null)}
            />
          </>
        )}
      </div>

      {/* Bottom Status & Navigation Bar (Active when document is open) */}
      <StatusBar />

      {/* Global Quick Action Command Palette */}
      <CommandPalette />
    </div>
  );
};

export default App;
