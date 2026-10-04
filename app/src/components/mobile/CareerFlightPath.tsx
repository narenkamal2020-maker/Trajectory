import React from 'react';
import { MobileShell } from './MobileShell';
import { Rocket, Sliders, Lock, Play, Calendar, FileText } from 'lucide-react';

interface CareerFlightPathScreenProps {
  onTabChange?: (tab: 'orbit' | 'practice' | 'mocks' | 'skills' | 'career' | 'more') => void;
}

export const CareerFlightPathScreen: React.FC<CareerFlightPathScreenProps> = ({ onTabChange }) => {
  return (
    <MobileShell activeTab="career" onTabChange={onTabChange}>
      {/* Header Calibration Bar */}
      <div className="flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-white/80">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>ASCENT VECTOR // STRIPE-L6</span>
        </div>
        <button type="button" className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/80 transition-colors cursor-pointer">
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
            
            <button
              type="button"
              onClick={() => onTabChange?.('practice')}
              className="mt-3 w-full py-2 px-3 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-lg flex items-center justify-between transition-all cursor-pointer"
            >
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
          { icon: Play, title: 'Complete 4 Kafka Partitioned Log Drills', desc: 'Focus on compaction semantics and disk flush overheads.', boost: '+4.5% Readiness' },
          { icon: Calendar, title: 'Schedule 45-min Behavioral & Arch Defense', desc: 'Mock session defending multi-region isolation tradeoffs.', boost: '+8.0% Readiness' },
          { icon: FileText, title: 'Calibrate Resume Bullet Points with Scanner', desc: 'Incorporate P99 latency percentiles to match Google L6 profile.', boost: '+2.5% Readiness' },
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
