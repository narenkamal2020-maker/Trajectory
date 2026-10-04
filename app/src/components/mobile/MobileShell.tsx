import React from 'react';
import { Compass, Code2, Mic, Target, Rocket, MoreHorizontal, Bell, User, Layers } from 'lucide-react';

interface MobileShellProps {
  children: React.ReactNode;
  activeTab: 'orbit' | 'practice' | 'mocks' | 'skills' | 'career' | 'more';
  onTabChange?: (tab: 'orbit' | 'practice' | 'mocks' | 'skills' | 'career' | 'more') => void;
  systemVersion?: string;
}

export const MobileShell: React.FC<MobileShellProps> = ({
  children,
  activeTab = 'orbit',
  onTabChange,
  systemVersion = 'SYS V4.9'
}) => {
  return (
    <div className="w-full max-w-[430px] min-h-screen mx-auto bg-[#060812] text-white flex flex-col font-sans relative overflow-x-hidden border-x border-white/5 shadow-2xl">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-[#060812]/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full border border-amber-400/40 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <span className="font-bold tracking-widest text-sm text-white">TRAJECTORY</span>
          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-amber-400/90 font-mono ml-1">
            {systemVersion}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" aria-label="Layers" className="text-white/60 hover:text-white transition-colors cursor-pointer">
            <Layers className="w-4 h-4" />
          </button>
          <button type="button" aria-label="Notifications" className="relative text-white/60 hover:text-white transition-colors cursor-pointer">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
          </button>
          <div className="w-7 h-7 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
        </div>
      </header>

      {/* Main Screen Body */}
      <main className="flex-1 pb-24 overflow-y-auto px-4 pt-3 space-y-4">
        {children}
      </main>

      {/* Fixed Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-[#0a0d18]/90 backdrop-blur-xl border-t border-white/10 px-3 py-2 flex items-center justify-around z-50">
        {[
          { id: 'orbit' as const, label: 'Orbit', icon: Compass },
          { id: 'practice' as const, label: 'Practice', icon: Code2 },
          { id: 'mocks' as const, label: 'Mocks', icon: Mic },
          { id: 'skills' as const, label: 'Skills', icon: Target },
          { id: 'career' as const, label: 'Career', icon: Rocket },
          { id: 'more' as const, label: 'More', icon: MoreHorizontal },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange?.(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 transition-all cursor-pointer ${
                isActive ? 'text-amber-400 scale-105' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
              {isActive && <div className="w-1 h-1 rounded-full bg-amber-400 mt-0.5" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
