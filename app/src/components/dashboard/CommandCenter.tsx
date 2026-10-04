import React from 'react';
import {
  Rocket,
  PlusCircle,
  Video,
  ChevronRight,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import type { DashboardOverview } from '../../services/api';

interface CommandCenterProps {
  overview?: DashboardOverview;
  onNavigate: (route: string) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ overview, onNavigate }) => {
  const readiness = overview?.readinessPercentage || 78.4;
  const velocityDays = overview?.trajectoryVelocityDays || 12;

  return (
    <div className="w-full space-y-6 pb-12">
      {/* 1. Sub-Header Command Bar */}
      <div className="w-full flex flex-col xl:flex-row xl:items-center justify-between gap-4 py-3 bg-[#191b26]/70 backdrop-blur-xl rounded-2xl px-5 border border-white/10 shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#ffd371]/10 text-[#ffd371] font-mono text-xs font-bold border border-[#ffd371]/30">
            <span className="w-2 h-2 rounded-full bg-[#ffd371] animate-pulse" />
            ORBITAL // L6 FLIGHT PROFILE
          </span>
          <span className="text-white/30 font-mono text-xs">/</span>
          <span className="font-mono text-xs text-[#d3c5ac] tracking-wide">
            WORKSPACE // COMMAND CENTER
          </span>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#272935] text-xs font-mono text-[#ffb871]">
            <Rocket className="w-3.5 h-3.5" />
            <span>Ascent Path: Hypersonic Tier</span>
          </div>
        </div>

        {/* Live Telemetry Strip */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#d3c5ac]">
          <div className="flex items-center gap-1.5">
            <span className="text-white/50">DRIFT:</span>
            <span className="text-[#ffd371] font-bold">0.14 rad/mo</span>
            <span className="text-[10px] text-[#ffd371]/70">(Optimized)</span>
          </div>
          <div className="h-3 w-px bg-white/10 hidden md:block" />
          <div className="flex items-center gap-1.5">
            <span className="text-white/50">READINESS:</span>
            <span className="text-white font-bold">{readiness}%</span>
            <span className="text-emerald-400 font-bold">+4.2% wk</span>
          </div>
          <div className="h-3 w-px bg-white/10 hidden md:block" />
          <div className="flex items-center gap-1.5">
            <span className="text-white/50">VELOCITY:</span>
            <span className="text-white">{velocityDays} Drills / 48h</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('practice')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#272935] hover:bg-[#323440] text-white text-xs font-mono transition-all cursor-pointer border border-white/10"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#ffd371]" />
            <span>New Drill</span>
            <kbd className="bg-black/40 px-1 rounded text-[10px] text-white/50">⌘N</kbd>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('interviews')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#ffd371] hover:bg-[#edb40b] text-[#3f2e00] font-mono text-xs font-bold shadow-[0_0_16px_rgba(237,180,11,0.35)] transition-all cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 fill-current" />
            <span>Launch Mock</span>
            <kbd className="bg-[#3f2e00]/20 px-1 rounded text-[10px] text-[#3f2e00]">⇧⌘M</kbd>
          </button>
        </div>
      </div>

      {/* 2. Cinematic Orbital Apex Banner */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-r from-[#191b26] via-[#1d1f2a] to-[#0c0e17] border border-[#ffd371]/30 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#ffd371] tracking-widest uppercase font-bold">
              Trajectory Guidance Engine
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-[#ffd371]/20 text-[#ffd371] rounded font-mono border border-[#ffd371]/30 font-bold">
              MACH 4.2 FLIGHT
            </span>
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Staff Architect L6 Orbital Ascent
          </h1>
          <p className="text-xs sm:text-sm text-[#d3c5ac] leading-relaxed">
            Targeting Tier-1 Distributed Infrastructure & Storage Kernels. 3 of 5 orbital apogee waypoints confirmed. 87% telemetry accuracy required for mock validation.
          </p>
        </div>

        {/* Micro Telemetry Arc Graphic */}
        <div className="flex items-center gap-6 bg-[#0b0e18]/80 backdrop-blur-md p-4 rounded-xl border border-white/10">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-white/50 uppercase">APOGEE REACH</span>
            <span className="font-headline text-lg text-[#ffd371] font-bold">14,200 km</span>
            <span className="font-mono text-[10px] text-[#ffb871]">Target: 16,000 km</span>
          </div>

          <svg className="w-28 h-12 overflow-visible" viewBox="0 0 120 50">
            <defs>
              <linearGradient id="apexArcGlow" x1="0%" x2="100%" y1="100%" y2="0%">
                <stop offset="0%" stopColor="#ffb871" stopOpacity="0.3" />
                <stop offset="60%" stopColor="#edb40b" stopOpacity="1" />
                <stop offset="100%" stopColor="#ffd371" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path d="M 5,45 Q 60,-15 115,20" fill="none" stroke="rgba(255,255,255,0.1)" strokeDasharray="3,3" strokeWidth="2" />
            <path d="M 5,45 Q 50,-5 90,12" fill="none" stroke="url(#apexArcGlow)" strokeLinecap="round" strokeWidth="3" />
            <circle cx="90" cy="12" r="4" fill="#ffd371" className="animate-ping" opacity="0.75" />
            <circle cx="90" cy="12" r="3.5" fill="#ffd371" />
            <circle cx="115" cy="20" r="3" fill="#323440" stroke="#ffd371" strokeWidth="1.5" />
          </svg>

          <div className="flex flex-col text-right">
            <span className="font-mono text-[10px] text-white/50 uppercase">WINDOW</span>
            <span className="font-headline text-lg text-white font-bold">T-14 D</span>
            <span className="font-mono text-[10px] text-emerald-400">On Schedule</span>
          </div>
        </div>
      </div>

      {/* 3. Top Row Metrics Quads */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Readiness */}
        <div className="p-5 rounded-2xl bg-[#191b26]/90 backdrop-blur-md border border-white/10 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#ffd371]/40 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] text-[#d3c5ac] tracking-wider uppercase">TRJ-METRIC // 01</span>
              <span className="font-mono text-[10px] text-[#ffd371] bg-[#ffd371]/10 px-1.5 py-0.5 rounded border border-[#ffd371]/30">STAFF L6</span>
            </div>
            <div className="font-headline text-base font-bold text-white">Overall Readiness</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline text-3xl font-bold text-[#ffd371]">{readiness}%</span>
              <span className="font-mono text-xs text-emerald-400 font-bold">▲ +4.2%</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-[#d3c5ac]">
              <span>Waypoints Cleared</span>
              <span className="text-white font-bold">3 of 5 Met</span>
            </div>
            <div className="w-full bg-[#323440] rounded-full h-1.5 flex gap-1">
              <div className="bg-[#ffd371] h-full flex-1 rounded-full" />
              <div className="bg-[#ffd371] h-full flex-1 rounded-full" />
              <div className="bg-[#ffd371] h-full flex-1 rounded-full" />
              <div className="bg-[#323440] h-full flex-1 rounded-full opacity-40" />
              <div className="bg-[#323440] h-full flex-1 rounded-full opacity-40" />
            </div>
          </div>
        </div>

        {/* Card 2: Active Waypoint */}
        <div className="p-5 rounded-2xl bg-[#191b26]/90 backdrop-blur-md border border-[#ffd371]/30 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#ffd371] transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] text-[#ffd371] tracking-wider uppercase font-bold">ACTIVE VORTEX // 03</span>
              <span className="font-mono text-[10px] text-[#ffb871] bg-[#da8001]/20 px-1.5 py-0.5 rounded">ETA 4D</span>
            </div>
            <div className="font-headline text-base font-bold text-white truncate">LSM Compaction & Queues</div>
            <p className="text-xs text-[#d3c5ac] mt-1 line-clamp-2">
              High-Throughput Partitioned Queues, Write Buffering, and Leveled Compaction Tiering.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('practice')}
            className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-[#ffd371] hover:text-white transition-colors cursor-pointer"
          >
            <span>Launch Target Drill</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Code Velocity */}
        <div className="p-5 rounded-2xl bg-[#191b26]/90 backdrop-blur-md border border-white/10 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#ffd371]/40 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] text-[#d3c5ac] tracking-wider uppercase">VELOCITY HARNESS</span>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">TOP 8%</span>
            </div>
            <div className="font-headline text-base font-bold text-white">18m Solve Latency</div>
            <p className="text-xs text-[#d3c5ac] mt-1">
              247 problems verified. Algorithmic complexity benchmarks met under timed constraints.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex justify-between text-xs font-mono text-[#d3c5ac]">
            <span>Optimal: &lt; 20m</span>
            <span className="text-emerald-400 font-bold">Passing</span>
          </div>
        </div>

        {/* Card 4: AI Examiner Mock Score */}
        <div className="p-5 rounded-2xl bg-[#191b26]/90 backdrop-blur-md border border-white/10 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-[#ffd371]/40 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] text-[#d3c5ac] tracking-wider uppercase">ADVERSARIAL AI</span>
              <span className="font-mono text-[10px] text-[#ffd371] bg-[#ffd371]/10 px-1.5 py-0.5 rounded">ATLAS-7</span>
            </div>
            <div className="font-headline text-base font-bold text-white">Mock Score: 84%</div>
            <p className="text-xs text-[#d3c5ac] mt-1">
              Demonstrated resilient defense on Raft split-brain partition recovery.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('interviews')}
            className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-[#ffd371] hover:text-white transition-colors cursor-pointer"
          >
            <span>Review Transcripts</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Main Tactical Flight Modules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Active Tactical Tasks & Mock Transcripts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tactical Tasks Container */}
          <div className="p-6 rounded-2xl bg-[#11131d] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ffd371]" />
                <h3 className="font-headline font-bold text-base text-white">
                  Tactical AI Action Plan & Drills
                </h3>
              </div>
              <span className="font-mono text-xs text-[#ffd371]">3 ACTIVE MISSIONS</span>
            </div>

            <div className="space-y-3">
              {[
                {
                  title: 'Distributed Consensus & Raft Quorum Handling',
                  desc: 'Master split-brain isolation, leader election timeouts & monotonic read leases.',
                  tag: 'HARD // DISTRIBUTED',
                  delta: '+6.0% Target Match',
                  route: 'practice',
                },
                {
                  title: 'LSM-Tree Compaction & Write Buffering',
                  desc: 'Evaluate write amplification overheads and Bloom filter false-positive curves.',
                  tag: 'MEDIUM // STORAGE',
                  delta: '+4.5% Target Match',
                  route: 'practice',
                },
                {
                  title: '45-Minute Principal System Architecture Mock Defense',
                  desc: 'Defend multi-region data replication trade-offs against ATLAS-7 examiner.',
                  tag: 'PRINCIPAL // ORAL',
                  delta: '+8.0% Target Match',
                  route: 'interviews',
                },
              ].map((task, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigate(task.route)}
                  className="p-4 rounded-xl bg-[#191b26] border border-white/5 hover:border-[#ffd371]/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] text-[#ffd371]">{task.tag}</span>
                    <h4 className="font-headline font-bold text-sm text-white group-hover:text-[#ffd371] transition-colors">
                      {task.title}
                    </h4>
                    <p className="text-xs text-[#d3c5ac]">{task.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-xs text-[#ffd371] font-bold">{task.delta}</span>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-[#ffd371] text-[#3f2e00] font-mono text-xs font-bold shadow-md hover:bg-[#edb40b] transition-all"
                    >
                      ENGAGE →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Applications Tracker & Skill Constellation Micro-HUD */}
        <div className="space-y-6">
          {/* Applications Pipeline Micro-HUD */}
          <div className="p-6 rounded-2xl bg-[#11131d] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-headline font-bold text-base text-white">Target Pipeline</h3>
              <span className="font-mono text-xs text-[#ffd371]">4 TIERS</span>
            </div>

            <div className="space-y-3">
              {[
                { company: 'Stripe', role: 'Staff Distributed Systems', stage: 'INTERVIEW', color: 'text-amber-400' },
                { company: 'Google', role: 'L6 Systems Architect', stage: 'OA CLEARED', color: 'text-emerald-400' },
                { company: 'Datadog', role: 'Principal Storage Lead', stage: 'APPLIED', color: 'text-blue-400' },
                { company: 'Vercel', role: 'Platform Infrastructure Lead', stage: 'OFFER STAGE', color: 'text-purple-400' },
              ].map((app, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#191b26] border border-white/5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">{app.company}</div>
                    <div className="text-[11px] text-[#d3c5ac]">{app.role}</div>
                  </div>
                  <span className={`font-mono text-[10px] font-bold ${app.color} bg-white/5 px-2 py-0.5 rounded border border-white/10`}>
                    {app.stage}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Constellation Jump Card */}
          <div
            onClick={() => onNavigate('skills')}
            className="p-6 rounded-2xl bg-gradient-to-br from-[#1d1f2a] to-[#11131d] border border-[#ffd371]/30 hover:border-[#ffd371] shadow-xl space-y-3 cursor-pointer group transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#ffd371] font-bold">SPATIAL CONSTELLATION</span>
              <ArrowUpRight className="w-4 h-4 text-[#ffd371] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <h4 className="font-headline font-bold text-sm text-white">
              Explore 6 Active Cognitive Nodes
            </h4>
            <p className="text-xs text-[#d3c5ac]">
              Interactive Bayesian competency tree showing Raft, LSM Compaction, and Concurrency Sharding couplings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
