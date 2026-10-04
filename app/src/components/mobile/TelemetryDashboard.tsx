import React from 'react';
import { MobileShell } from './MobileShell';
import { Zap, Play, CheckCircle2, CircleDot, Lock, Flame, Code, Users } from 'lucide-react';

interface TelemetryDashboardScreenProps {
  onTabChange?: (tab: 'orbit' | 'practice' | 'mocks' | 'skills' | 'career' | 'more') => void;
}

export const TelemetryDashboardScreen: React.FC<TelemetryDashboardScreenProps> = ({ onTabChange }) => {
  return (
    <MobileShell activeTab="orbit" onTabChange={onTabChange}>
      {/* Header Vector Status */}
      <div className="flex items-center justify-between text-[11px] font-mono text-white/50 tracking-wider">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
          <span className="text-white/80">VECTOR // ASCENT PHASE 03</span>
        </div>
        <span>ETA: 38 DAYS</span>
      </div>

      {/* Hero Orbit Trajectory Card */}
      <div className="relative rounded-2xl p-5 overflow-hidden bg-gradient-to-b from-[#161a29] to-[#0c0f1d] border border-amber-400/20 shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-amber-400/80 uppercase">Target Orbit</span>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">Staff Engineer</h1>
            <p className="text-xs text-white/60">Tier-1 Distributed Systems</p>
          </div>

          {/* Readiness Circular Ring */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/10"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-amber-400"
                strokeDasharray="72, 100"
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-sm font-bold text-white">72%</span>
              <span className="text-[7px] text-white/50 tracking-tighter uppercase">Readiness</span>
            </div>
          </div>
        </div>

        {/* Parabolic Trajectory Path */}
        <div className="mt-4 pt-3 border-t border-white/10 relative">
          <div className="text-[9px] font-mono text-white/40 mb-1 flex justify-between">
            <span>TRAJECTORY SIMULATION</span>
            <span className="text-amber-400">APOGEE: L5/E6 VERIFIED</span>
          </div>
          <svg className="w-full h-14 overflow-visible" viewBox="0 0 320 60">
            <path
              d="M 10 50 Q 160 5 310 45"
              fill="none"
              stroke="url(#trajectory-glow)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="160" cy="27" r="4.5" fill="#edb40b" className="animate-pulse" />
            <circle cx="160" cy="27" r="8" fill="none" stroke="#edb40b" strokeOpacity="0.4" />
            <defs>
              <linearGradient id="trajectory-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#edb40b" stopOpacity="1" />
                <stop offset="100%" stopColor="#ffd371" stopOpacity="0.4" />
              </linearGradient>
            </defs>
          </svg>
          <div className="flex justify-between text-[9px] font-mono text-white/40 mt-1">
            <span>L4 CORE ENG</span>
            <span className="text-amber-300">CURRENT VECTOR</span>
            <span>STAFF ASCENT</span>
          </div>
        </div>

        {/* Quick Micro Badges */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10 text-center font-mono">
          <div className="bg-white/5 rounded-lg py-1.5 px-1">
            <div className="text-[10px] text-white/50 flex items-center justify-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" /> STREAK
            </div>
            <div className="text-xs font-bold text-white mt-0.5">12 Days</div>
          </div>
          <div className="bg-white/5 rounded-lg py-1.5 px-1">
            <div className="text-[10px] text-white/50 flex items-center justify-center gap-1">
              <Code className="w-3 h-3 text-cyan-400" /> SOLVED
            </div>
            <div className="text-xs font-bold text-white mt-0.5">247 Problems</div>
          </div>
          <div className="bg-white/5 rounded-lg py-1.5 px-1">
            <div className="text-[10px] text-white/50 flex items-center justify-center gap-1">
              <Users className="w-3 h-3 text-emerald-400" /> PEER
            </div>
            <div className="text-xs font-bold text-white mt-0.5">Top 8%</div>
          </div>
        </div>
      </div>

      {/* Priority Target Drill */}
      <div className="rounded-2xl p-4 bg-[#141824] border border-amber-400/30 shadow-lg relative">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
            PRIORITY TARGET // LVL: MEDIUM
          </span>
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
        </div>

        <h3 className="text-base font-bold text-white mt-2">Graph BFS/DFS - Shortest Path in Weighted Grid</h3>
        <p className="text-xs text-white/60 mt-1 leading-relaxed">
          Dijkstra variant with stateful obstacle compression & dynamic routing.
        </p>

        <div className="mt-3 p-2.5 rounded-xl bg-amber-400/5 border border-amber-400/20 text-[11px] text-amber-200/90 flex items-start gap-2">
          <span className="text-amber-400 font-bold">▲ AI DIAGNOSTIC:</span>
          <span>Accuracy dropped 14% on cyclic graph traversal in yesterday's benchmark.</span>
        </div>

        <button
          type="button"
          onClick={() => onTabChange?.('practice')}
          className="w-full mt-3 py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-black font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-black" />
          <span>LAUNCH TERMINAL PRACTICE</span>
        </button>
      </div>

      {/* Telemetry Metric Quads */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-[#121522] border border-white/5">
          <div className="text-[10px] font-mono text-white/50">TECH SKILLS</div>
          <div className="text-xl font-bold text-white mt-1">78%</div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">↗ +4.2% W/W</div>
          <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-amber-400 h-full w-[78%]" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#121522] border border-white/5">
          <div className="text-[10px] font-mono text-white/50">MOCK SCORE</div>
          <div className="text-xl font-bold text-white mt-1">64%</div>
          <div className="text-[10px] text-amber-300 font-mono mt-0.5">READY FOR MOCK 3</div>
          <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-amber-400 h-full w-[64%]" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#121522] border border-white/5">
          <div className="text-[10px] font-mono text-white/50">CODE VELOCITY</div>
          <div className="text-xl font-bold text-white mt-1">18m</div>
          <div className="text-[10px] text-white/50 font-mono mt-0.5">OPTIMAL &lt; 20m</div>
          <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-400 h-full w-[90%]" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#121522] border border-white/5">
          <div className="text-[10px] font-mono text-white/50">SYS DESIGN</div>
          <div className="text-xl font-bold text-white mt-1">61%</div>
          <div className="text-[10px] text-amber-400 font-mono mt-0.5">CACHE TIER REVIEW</div>
          <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-amber-400 h-full w-[61%]" />
          </div>
        </div>
      </div>

      {/* Ascent Waypoint Milestones */}
      <div className="p-4 rounded-2xl bg-[#121522] border border-white/5 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold tracking-wide text-white">Ascent Milestones</span>
          <span className="font-mono text-amber-400 text-[11px]">3 / 5 CLEAR</span>
        </div>

        <div className="space-y-2.5">
          {[
            { title: 'Foundations & Algorithmic Logic', status: '100% Cleared • 120 Questions', icon: CheckCircle2, color: 'text-amber-400' },
            { title: 'Graph Traversal & Dynamic Prog', status: '88% Cleared • 84 Questions', icon: CheckCircle2, color: 'text-amber-400' },
            { title: 'Distributed Caching Architectures', status: 'In Progress • Partitioning, Redis Clust', icon: CircleDot, color: 'text-amber-400', active: true },
            { title: 'Full-System Design Intensive', status: 'Unlocks at 75% Readiness', icon: Lock, color: 'text-white/30' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`p-2.5 rounded-xl flex items-center gap-3 ${
                  item.active ? 'bg-amber-400/10 border border-amber-400/30' : 'bg-white/[0.02]'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${item.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{item.title}</div>
                  <div className="text-[10px] text-white/50 font-mono truncate">{item.status}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MobileShell>
  );
};
