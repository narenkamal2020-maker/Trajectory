import React, { useState, useEffect } from 'react';
import { Search, Terminal, Zap, Compass, Code2, Mic, Rocket, FileText, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // open command palette
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { id: 'dashboard', label: 'Command Center Dashboard', category: 'Navigation', icon: Compass, route: 'dashboard' },
    { id: 'practice', label: 'Practice Terminal (Alien Dictionary BFS)', category: 'Execution', icon: Code2, route: 'practice' },
    { id: 'interviews', label: 'ATLAS-7 Orbital AI Mock Interview', category: 'Adversarial Defense', icon: Mic, route: 'interviews' },
    { id: 'skills', label: 'Spatial Skill Constellation', category: 'Telemetry', icon: Zap, route: 'skills' },
    { id: 'career', label: 'Career Trajectory Flight Path', category: 'Ascent Vectors', icon: Rocket, route: 'career' },
    { id: 'resume', label: 'Resume Diagnostic Signal Extraction', category: 'Analysis', icon: FileText, route: 'resume' },
    { id: 'landing', label: 'Platform Overview & Landing', category: 'Explore', icon: Terminal, route: 'landing' },
    { id: 'mobile', label: 'Switch to Mobile Companion Suite', category: 'Platform', icon: Terminal, route: 'mobile' },
  ].filter(c => c.label.toLowerCase().includes(query.toLowerCase()) || c.category.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-[#11131d] border border-[#ffd371]/40 shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_25px_rgba(237,180,11,0.2)] overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 bg-[#191b26]/90">
          <Search className="w-4 h-4 text-[#ffd371] mr-3 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Omni Command Palette / Telemetry Query... (Type a command)"
            className="w-full bg-transparent border-none text-white text-sm font-mono placeholder:text-white/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {commands.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-white/40">
              NO TELEMETRY COMMANDS MATCHING QUERY
            </div>
          ) : (
            commands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={() => {
                    onNavigate(cmd.route);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#1d1f2a] hover:border hover:border-[#ffd371]/30 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#ffd371]/10 flex items-center justify-center text-[#ffd371] group-hover:scale-110 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-[#ffd371] transition-colors">
                        {cmd.label}
                      </div>
                      <div className="text-[10px] font-mono text-[#d3c5ac]">
                        {cmd.category}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-white/40 group-hover:text-[#ffd371]">
                    ENTER ↵
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2 bg-[#0b0e18] border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/40">
          <span>NAVIGATE WITH ARROWS</span>
          <span>ESC TO CLOSE</span>
        </div>
      </div>
    </div>
  );
};
