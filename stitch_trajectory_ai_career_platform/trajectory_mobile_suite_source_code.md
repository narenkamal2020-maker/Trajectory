# TRAJECTORY — Mobile Application Code Export

Below is the complete production frontend code for the core mobile suite of **TRAJECTORY**, including:
1. **Telemetry Dashboard** (`Trajectory - Telemetry Dashboard`)
2. **Career Flight Path** (`Trajectory - Career Flight Path`)
3. **Practice Terminal** (`Trajectory - Practice Terminal`)

Built with **React + TypeScript + Tailwind CSS**, custom SVG visualizations, and glassmorphic telemetry tokens.

---

## 1. Design Tokens & Global CSS (`tokens.css`)

```css
:root {
  --color-bg-base: #060812;
  --color-surface: #11131d;
  --color-surface-dim: #0b0e18;
  --color-surface-container: #191b26;
  --color-surface-card: rgba(25, 27, 38, 0.7);
  --color-gold: #edb40b;
  --color-gold-light: #ffd371;
  --color-gold-glow: rgba(237, 180, 11, 0.15);
  --color-gold-border: rgba(237, 180, 11, 0.35);
  --color-text-primary: #ffffff;
  --color-text-secondary: rgba(255, 255, 255, 0.7);
  --color-text-muted: rgba(255, 255, 255, 0.45);
  --color-emerald: #10b981;
  --color-rose: #f43f5e;
}

.liquid-glass-card {
  background: rgba(25, 27, 38, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 1px rgba(255, 255, 255, 0.1);
}

.liquid-glass-gold {
  background: rgba(237, 180, 11, 0.06);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(237, 180, 11, 0.3);
  box-shadow: 0 0 24px rgba(237, 180, 11, 0.12), inset 0 1px 1px rgba(255, 211, 113, 0.2);
}
```

---

## 2. Navigation Shell (`MobileShell.tsx`)

```tsx
import React from 'react';
import { Compass, Code2, Mic, Target, Rocket, MoreHorizontal, Bell, User, Layers } from 'lucide-react';

interface MobileShellProps {
  children: React.ReactNode;
  activeTab: 'orbit' | 'practice' | 'mocks' | 'skills' | 'career' | 'more';
  onTabChange?: (tab: string) => void;
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
          <button className="text-white/60 hover:text-white transition-colors">
            <Layers className="w-4 h-4" />
          </button>
          <button className="relative text-white/60 hover:text-white transition-colors">
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
          { id: 'orbit', label: 'Orbit', icon: Compass },
          { id: 'practice', label: 'Practice', icon: Code2 },
          { id: 'mocks', label: 'Mocks', icon: Mic },
          { id: 'skills', label: 'Skills', icon: Target },
          { id: 'career', label: 'Career', icon: Rocket },
          { id: 'more', label: 'More', icon: MoreHorizontal },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 transition-all ${
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
```

---

## 3. Screen 1: Telemetry Dashboard (`TelemetryDashboard.tsx`)

```tsx
import React from 'react';
import { MobileShell } from './MobileShell';
import { Zap, Play, CheckCircle2, CircleDot, Lock, ArrowUpRight, Flame, Code, Users } from 'lucide-react';

export const TelemetryDashboardScreen: React.FC = () => {
  return (
    <MobileShell activeTab="orbit">
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

        <button className="w-full mt-3 py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-black font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]">
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
```

---

## 4. Screen 2: Career Flight Path (`CareerFlightPath.tsx`)

```tsx
import React from 'react';
import { MobileShell } from './MobileShell';
import { Rocket, Sliders, CheckCircle2, CircleDot, Lock, ArrowRight, Play, Calendar, FileText } from 'lucide-react';

export const CareerFlightPathScreen: React.FC = () => {
  return (
    <MobileShell activeTab="career">
      {/* Header Calibration Bar */}
      <div className="flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-white/80">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>ASCENT VECTOR // STRIPE-L6</span>
        </div>
        <button className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/80 transition-colors">
          <Sliders className="w-3 h-3" />
          <span>CALIBRATE</span>
        </button>
      </div>

      {/* Target Destination Profile */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-[#181c2d] to-[#0c0f1c] border border-amber-400/25 relative overflow-hidden shadow-xl">
        <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">PROJECTED ASCENT DESTINATION</span>
        <h1 className="text-2xl font-bold text-white mt-1">Sr. Distributed Systems Architect</h1>
        <div className="flex justify-between items-center text-xs text-white/60 mt-0.5">
          <span>Stripe / Google L6 Benchmark</span>
          <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-white/80">TIER 1 CLUSTER</span>
        </div>

        {/* Readiness Meter */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-white/40">ASCENSION READINESS</div>
            <div className="text-2xl font-bold text-white">82% <span className="text-xs font-normal text-amber-300">MATCH</span></div>
            <div className="text-[10px] text-amber-400/80 mt-0.5 font-mono">Δ 18% qualification deficit to target</div>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-amber-400/20 border-t-amber-400 flex items-center justify-center">
            <Rocket className="w-6 h-6 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Guided Waypoint Flight Path Timeline */}
      <div className="p-4 rounded-2xl bg-[#121522] border border-white/5 space-y-4">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-white">Ascension Flight Path</span>
          <span className="font-mono text-white/50 text-[10px]">5 WAYPOINTS</span>
        </div>

        {/* Stepper Vertical Tree */}
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-amber-400 before:via-amber-400/40 before:to-white/10">
          {/* Waypoint 1: Cleared */}
          <div className="relative">
            <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#121522] border-2 border-amber-400 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>
            <div className="text-[10px] font-mono text-amber-400">WP-01 // COMPLETE • 78% PROFICIENCY</div>
            <h4 className="text-sm font-semibold text-white">L4 Core Engineering Baseline</h4>
            <p className="text-xs text-white/50 mt-0.5">System design fundamentals, CI/CD orchestration, synchronous microservices.</p>
          </div>

          {/* Waypoint 2: Active Gap */}
          <div className="relative p-3 rounded-xl bg-amber-400/10 border border-amber-400/40 shadow-inner">
            <div className="absolute -left-6 top-3 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center animate-pulse">
              <div className="w-2 h-2 rounded-full bg-black" />
            </div>
            <div className="text-[10px] font-mono text-amber-400 font-bold">ACTIVE TRAJECTORY // CRITICAL GAP (3 TASKS)</div>
            <h4 className="text-sm font-bold text-white mt-0.5">Distributed Consensus & Raft Protocol</h4>
            <p className="text-xs text-white/70 mt-1">Master split-brain quorum handling, leader election edge-cases, and distributed log replication dynamics.</p>
            
            <button className="mt-3 w-full py-2 px-3 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-lg flex items-center justify-between transition-all">
              <span>ENGAGE DRILL →</span>
              <span className="font-mono text-[10px]">+6% Target Match</span>
            </button>
          </div>

          {/* Waypoint 3: Queued */}
          <div className="relative opacity-60">
            <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#121522] border border-white/30 flex items-center justify-center">
              <Lock className="w-2.5 h-2.5 text-white/40" />
            </div>
            <div className="text-[10px] font-mono text-white/50">WP-03 // RECOMMENDED VECTOR • LOCKED</div>
            <h4 className="text-sm font-medium text-white">High-Throughput Partitioned Message Queues</h4>
            <p className="text-xs text-white/40 mt-0.5">Zero-copy socket delivery, consumer rebalance storm mitigations.</p>
          </div>
        </div>
      </div>

      {/* Skill Gap Breakdown */}
      <div className="p-4 rounded-2xl bg-[#121522] border border-white/5 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-white">Skill Gap Breakdown</span>
          <div className="flex gap-2 font-mono text-[9px]">
            <span className="text-white/40">■ REQ</span>
            <span className="text-amber-400">■ CURRENT</span>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { skill: 'Distributed Storage & LSM-Trees', current: 55, req: 85, delta: '-30%' },
            { skill: 'Concurrency & Dynamic Sharding', current: 70, req: 90, delta: '-20%' },
            { skill: 'Core Algorithms & Complex Graphs', current: 88, req: 80, delta: 'EXCEEDS' },
            { skill: 'Observability & Chaos Engineering', current: 62, req: 75, delta: '-13%' },
          ].map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-white/80">{item.skill}</span>
                <span className="font-mono text-amber-300 text-[11px]">{item.current}% / {item.req}% ({item.delta})</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden relative">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: `${item.current}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tactical AI Action Plan */}
      <div className="p-4 rounded-2xl bg-[#121522] border border-white/5 space-y-2.5">
        <span className="text-xs font-bold text-white">Tactical AI Action Plan</span>
        {[
          { icon: Play, title: 'Complete 4 Kafka Partitioned Log Drills', desc: 'Focus on compaction semantics and disk flush overheads.', eta: '1.5 hrs', boost: '+4.5% Readiness' },
          { icon: Calendar, title: 'Schedule 45-min Behavioral & Arch Defense', desc: 'Mock session defending multi-region isolation tradeoffs.', eta: 'Fri', boost: '+8.0% Readiness' },
          { icon: FileText, title: 'Calibrate Resume Bullet Points with Scanner', desc: 'Incorporate P99 latency percentiles to match Google L6 profile.', eta: 'Sync', boost: '+2.5% Readiness' },
        ].map((action, idx) => {
          const Icon = action.icon;
          return (
            <div key={idx} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{action.title}</div>
                  <div className="text-[10px] text-white/50">{action.desc}</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-amber-400 whitespace-nowrap">{action.boost}</span>
            </div>
          );
        })}
      </div>
    </MobileShell>
  );
};
```

---

## 5. Screen 3: Practice Terminal (`PracticeTerminal.tsx`)

```tsx
import React, { useState } from 'react';
import { MobileShell } from './MobileShell';
import { Play, Sparkles, CheckCircle2, XCircle, Clock, Cpu, ChevronRight } from 'lucide-react';

export const PracticeTerminalScreen: React.FC = () => {
  const [activeLang, setActiveLang] = useState<'py' | 'cpp' | 'go'>('py');

  const codeSnippet = `# Compute lexicographical order of alien lexicon
class DependencyEngine:
    def alienOrder(self, words: List[str]) -> str:
        adj = {c: set() for w in words for c in w}
        in_degree = {c: 0 for c in adj}
        
        # Kahn's BFS Algorithm for Cycle Extraction
        for first, second in zip(words, words[1:]):
            for c1, c2 in zip(first, second):
                if c1 != c2:
                    if c2 not in adj[c1]:
                        adj[c1].add(c2)
                        in_degree[c2] += 1
                    break
        return topologicalSortKahn(adj, in_degree)`;

  return (
    <MobileShell activeTab="practice">
      {/* Header Stream Status */}
      <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
        <div className="flex items-center gap-1.5 text-white/80">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>VECTOR PROTOCOL // ACTIVE ORBIT</span>
        </div>
        <span>EST. APOGEE: 88.4%</span>
      </div>

      {/* Main Terminal Editor Card */}
      <div className="rounded-2xl bg-[#0e111a] border border-amber-400/25 shadow-2xl overflow-hidden">
        {/* Editor Sub-Header */}
        <div className="px-4 py-3 bg-[#131724] border-b border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-amber-400">MISSION TRJ-904 // RECON</span>
            <h2 className="text-base font-bold text-white">Alien Dictionary Dependency Engine</h2>
          </div>
          <div className="flex gap-1.5">
            <span className="text-[10px] font-mono bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">GRAPH BFS</span>
            <span className="text-[10px] font-mono bg-white/10 text-white/70 px-2 py-0.5 rounded">TOPOLOGICAL SORT</span>
          </div>
        </div>

        {/* Language Tabs & Window Dots */}
        <div className="px-4 py-2 bg-[#090c14] border-b border-white/5 flex items-center justify-between">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
            <span className="text-[10px] font-mono text-white/40 ml-2">SOLUTION.PY</span>
          </div>
          <div className="flex gap-1">
            {(['py', 'cpp', 'go'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                  activeLang === lang ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'text-white/40'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Code Body */}
        <div className="p-4 bg-[#080a12] font-mono text-xs overflow-x-auto text-white/80 leading-relaxed">
          <pre>
            <code>{codeSnippet}</code>
          </pre>
        </div>

        {/* Test Runner Telemetry Drawer */}
        <div className="p-3.5 bg-[#101320] border-t border-white/10 space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-mono text-white/60">TEST RUNNER TELEMETRY</span>
            <span className="font-mono text-rose-400 text-[11px]">FAIL // 2/3 PASSED</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-1.5 rounded-lg bg-white/5 border border-emerald-500/20 flex flex-col items-center">
              <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> CASE 01
              </div>
              <span className="text-xs text-white/80 mt-0.5">4ms</span>
            </div>
            <div className="p-1.5 rounded-lg bg-white/5 border border-emerald-500/20 flex flex-col items-center">
              <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> CASE 02
              </div>
              <span className="text-xs text-white/80 mt-0.5">6ms</span>
            </div>
            <div className="p-1.5 rounded-lg bg-white/5 border border-rose-500/30 flex flex-col items-center">
              <div className="flex items-center gap-1 text-[10px] text-rose-400">
                <XCircle className="w-3 h-3" /> CASE 03
              </div>
              <span className="text-xs text-rose-300 mt-0.5">TLE &gt; 2.4s</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors">
              <Play className="w-3.5 h-3.5" />
              <span>RUN TEST CASES</span>
            </button>
            <button className="py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SUBMIT TO AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Flight Queue */}
      <div className="p-4 rounded-2xl bg-[#121522] border border-white/5 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-white">Target Flight Queue</span>
          <span className="font-mono text-amber-400 text-[10px] flex items-center gap-0.5">
            VIEW 48 MISSIONS <ChevronRight className="w-3 h-3" />
          </span>
        </div>

        <div className="space-y-2">
          {[
            { tag: 'HARD // SYS-DESIGN', title: 'LRU Cache with TTL Eviction Engine', meta: '99.2% Memory Efficiency • Solved 3d ago', solved: true },
            { tag: 'MEDIUM // DISTRIBUTED', title: 'Distributed Consensus Round-Robin', meta: '72% Fleet Accuracy • Recommended for L6', inFlight: true },
            { tag: 'MEDIUM // ALGO-DP', title: 'Dynamic Programming: Stock Profit with Fee', meta: 'FAANG Frequent • Unattempted' },
          ].map((item, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-400/30 transition-colors">
              <span className="text-[9px] font-mono text-amber-400/90">{item.tag}</span>
              <h4 className="text-xs font-semibold text-white mt-0.5">{item.title}</h4>
              <div className="text-[10px] text-white/50 font-mono mt-1">{item.meta}</div>
            </div>
          ))}
        </div>
      </div>
    </MobileShell>
  );
};
```
