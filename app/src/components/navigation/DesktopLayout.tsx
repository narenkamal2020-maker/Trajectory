import React, { useState } from 'react';
import {
  Compass,
  Code2,
  Mic,
  Zap,
  Rocket,
  BarChart3,
  FileText,
  Bell,
  User,
  Terminal,
  Globe,
  Smartphone
} from 'lucide-react';
import { CommandPalette } from './CommandPalette';

interface DesktopLayoutProps {
  children: React.ReactNode;
  activeRoute: string;
  onNavigate: (route: string) => void;
  onSwitchToMobile: () => void;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  children,
  activeRoute,
  onNavigate,
  onSwitchToMobile,
}) => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Compass, shortcut: '⌘1' },
    { id: 'practice', label: 'Practice Terminal', icon: Code2, shortcut: '⌘2' },
    { id: 'interviews', label: 'Interviews', icon: Mic, shortcut: '⌘3' },
    { id: 'skills', label: 'Skills Constellation', icon: Zap, shortcut: '⌘4' },
    { id: 'career', label: 'Career Trajectory', icon: Rocket, shortcut: '⌘5' },
    { id: 'analytics', label: 'Progress & Analytics', icon: BarChart3, shortcut: '⌘6' },
    { id: 'resume', label: 'Resume Diagnostic', icon: FileText, shortcut: '⌘7' },
    { id: 'landing', label: 'Platform Overview', icon: Globe, shortcut: '⌘8' },
  ];

  return (
    <div className="min-h-screen bg-[#0b0e18] text-[#e1e1f1] font-body flex flex-col selection:bg-[#ffd371] selection:text-[#3f2e00]">
      {/* 1. TOP HEADER APP BAR */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#0b0e18]/90 backdrop-blur-xl z-40 flex items-center justify-between px-6 border-b border-white/10 shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
        {/* Left Window Dots & Logo */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 pr-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 block opacity-80 hover:opacity-100 transition-opacity cursor-pointer" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 block opacity-80 hover:opacity-100 transition-opacity cursor-pointer" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 block opacity-80 hover:opacity-100 transition-opacity cursor-pointer" />
          </div>

          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffd371] shadow-[0_0_10px_#ffd371] animate-pulse" />
            <span className="font-headline text-base font-bold tracking-tight text-[#ffd371]">
              TRAJECTORY
            </span>
            <span className="font-mono text-[10px] text-[#d3c5ac] bg-[#272935] px-1.5 py-0.5 rounded border border-white/5">
              v4.9.2-desktop
            </span>
          </div>
        </div>

        {/* Center Omni Command Palette Bar */}
        <div className="flex-1 max-w-xl mx-8 hidden lg:flex items-center">
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-4 py-1.5 bg-[#191b26] hover:bg-[#1d1f2a] rounded-xl text-[#d3c5ac] hover:text-white transition-colors cursor-pointer border border-white/5"
          >
            <div className="flex items-center gap-2.5">
              <Terminal className="w-4 h-4 text-[#ffd371]" />
              <span className="font-mono text-xs">Omni Command Palette / Telemetry Query...</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="font-mono text-[10px] bg-[#272935] px-1.5 py-0.5 rounded text-white/60">⌘</kbd>
              <kbd className="font-mono text-[10px] bg-[#272935] px-1.5 py-0.5 rounded text-white/60">K</kbd>
            </div>
          </button>
        </div>

        {/* Right Status & Controls */}
        <div className="flex items-center gap-4">
          <div className="hidden xl:flex items-center gap-2 bg-[#191b26] px-3 py-1 rounded-xl border border-white/5">
            <span className="w-2 h-2 rounded-full bg-[#ffd371] animate-pulse" />
            <span className="font-mono text-[11px] text-[#ffb871] font-bold">
              LOCAL ENGINE: HYBRID (LLAMA-3-8B-Q4)
            </span>
          </div>

          <button
            type="button"
            onClick={onSwitchToMobile}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#ffd371]/10 hover:bg-[#ffd371]/20 text-[#ffd371] font-mono text-xs border border-[#ffd371]/30 transition-all cursor-pointer"
            title="Switch to Mobile Suite"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">MOBILE VIEW</span>
          </button>

          <button
            type="button"
            aria-label="Notifications"
            className="relative p-2 rounded-lg hover:bg-[#272935] text-[#d3c5ac] hover:text-white transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ffd371] ring-2 ring-[#0b0e18]" />
          </button>

          <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
            <div className="hidden sm:flex flex-col text-right font-mono">
              <span className="text-xs text-[#ffd371] font-bold">STAFF L6</span>
              <span className="text-[10px] text-[#d3c5ac]">Orbital Ops</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#ffd371] text-[#3f2e00] font-bold flex items-center justify-center text-xs shadow-[0_0_10px_rgba(255,211,113,0.4)]">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      {/* 2. LEFT SIDEBAR NAVIGATION */}
      <aside className="fixed left-0 top-14 bottom-0 w-64 bg-[#0b0e18]/95 backdrop-blur-xl z-30 flex flex-col justify-between p-3 border-r border-white/10 shadow-xl">
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="px-3 py-2 mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#d3c5ac] tracking-wider uppercase font-bold">
              Trajectory Navigation
            </span>
            <span className="font-mono text-[10px] text-[#ffd371] bg-[#ffd371]/10 px-1.5 py-0.5 rounded border border-[#ffd371]/30">
              ORBIT-04
            </span>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeRoute === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#ffd371] text-[#3f2e00] font-bold shadow-[0_0_16px_rgba(237,180,11,0.3)]'
                      : 'text-[#d3c5ac] hover:bg-[#191b26] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs">{item.label}</span>
                  </div>
                  <kbd className={`font-mono text-[10px] ${isActive ? 'text-[#3f2e00]/60' : 'opacity-50'}`}>
                    {item.shortcut}
                  </kbd>
                </button>
              );
            })}
          </nav>
        </div>

        {/* AI Engine Status Card at bottom of sidebar */}
        <div className="mt-3 p-3 rounded-xl bg-[#191b26]/90 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-[#ffb871] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffb871] animate-ping" />
              <span>AI ENGINE CORE</span>
            </div>
            <span className="text-[#ffd371]">42 tok/s</span>
          </div>

          <div className="text-[11px] font-mono text-white truncate">Trajectory-Coder-8B</div>

          <div className="w-full bg-[#323440] rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#ffd371] h-1.5 rounded-full w-[45%]" />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-[#d3c5ac]">
            <span>VRAM: 5.4 / 16 GB</span>
            <span className="text-[#ffd371]">Q4_K_M</span>
          </div>
        </div>
      </aside>

      {/* 3. MAIN CONTENT CONTAINER */}
      <div className="pl-64 pt-14 flex-1">
        <main className="p-6 max-w-7xl mx-auto min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </div>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
};
