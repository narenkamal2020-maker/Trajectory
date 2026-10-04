import React from 'react';
import { Rocket, Sliders, Lock } from 'lucide-react';

interface CareerFlightPathViewProps {
  onNavigate?: (route: string) => void;
}

export const CareerFlightPathView: React.FC<CareerFlightPathViewProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs text-[#ffd371] tracking-widest uppercase font-bold">
            ASCENT VECTOR // STRIPE & GOOGLE L6
          </span>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold text-white mt-1">
            Career Flight Path
          </h1>
        </div>

        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#191b26] hover:bg-[#272935] text-white text-xs font-mono border border-white/10 transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-[#ffd371]" />
          <span>CALIBRATE TARGET</span>
        </button>
      </div>

      {/* Target Destination Profile Hero */}
      <div className="rounded-2xl p-6 bg-gradient-to-br from-[#181c2d] to-[#0c0f1c] border border-[#ffd371]/30 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="text-xs font-mono text-[#ffd371] uppercase tracking-widest font-bold">
            PROJECTED ASCENT DESTINATION
          </span>
          <h2 className="text-2xl sm:text-3xl font-headline font-bold text-white">
            Sr. Distributed Systems Architect
          </h2>
          <div className="flex items-center gap-3 text-xs text-[#d3c5ac]">
            <span>Stripe / Google L6 Benchmark</span>
            <span className="font-mono bg-white/10 px-2.5 py-0.5 rounded text-white border border-white/10 font-semibold">
              TIER 1 CLUSTER
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-[#11131d]/90 p-4 rounded-xl border border-white/10">
          <div>
            <div className="text-[10px] font-mono text-white/50 uppercase">ASCENSION READINESS</div>
            <div className="text-2xl font-bold text-white">
              82% <span className="text-xs font-mono text-[#ffd371]">MATCH</span>
            </div>
            <div className="text-[10px] text-[#ffd371] font-mono">Δ 18% qualification deficit to target</div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-[#ffd371]/20 border-t-[#ffd371] flex items-center justify-center text-[#ffd371]">
            <Rocket className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 5-Step Waypoint Tree & Skill Gap Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Ascension Flight Path Stepper */}
        <div className="p-6 rounded-2xl bg-[#11131d] border border-white/10 shadow-xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-white/10 text-xs">
            <span className="font-bold text-white text-sm">Ascension Flight Path</span>
            <span className="font-mono text-[#ffd371] text-xs">5 WAYPOINTS</span>
          </div>

          <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-[#ffd371] before:via-[#ffd371]/40 before:to-white/10">
            {/* Waypoint 1 */}
            <div className="relative">
              <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#11131d] border-2 border-[#ffd371] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ffd371]" />
              </div>
              <div className="text-[10px] font-mono text-[#ffd371]">WP-01 // COMPLETE • 78% PROFICIENCY</div>
              <h4 className="text-sm font-semibold text-white mt-0.5">L4 Core Engineering Baseline</h4>
              <p className="text-xs text-[#d3c5ac] mt-0.5 leading-relaxed">
                System design fundamentals, CI/CD orchestration, synchronous microservices.
              </p>
            </div>

            {/* Waypoint 2 */}
            <div className="relative p-3.5 rounded-xl bg-[#ffd371]/10 border border-[#ffd371]/40 shadow-inner">
              <div className="absolute -left-6 top-3 w-4 h-4 rounded-full bg-[#ffd371] flex items-center justify-center animate-pulse">
                <div className="w-2 h-2 rounded-full bg-black" />
              </div>
              <div className="text-[10px] font-mono text-[#ffd371] font-bold">
                ACTIVE TRAJECTORY // CRITICAL GAP (3 TASKS)
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5">Distributed Consensus & Raft Protocol</h4>
              <p className="text-xs text-white/80 mt-1 leading-relaxed">
                Master split-brain quorum handling, leader election edge-cases, and distributed log replication dynamics.
              </p>
              <button
                type="button"
                onClick={() => onNavigate?.('practice')}
                className="mt-3 w-full py-2 px-3 bg-[#ffd371] hover:bg-[#edb40b] text-[#3f2e00] text-xs font-bold rounded-lg flex items-center justify-between transition-all cursor-pointer"
              >
                <span>ENGAGE DRILL →</span>
                <span className="font-mono text-[10px]">+6% Target Match</span>
              </button>
            </div>

            {/* Waypoint 3 */}
            <div className="relative opacity-70">
              <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#11131d] border border-white/30 flex items-center justify-center">
                <Lock className="w-2.5 h-2.5 text-white/40" />
              </div>
              <div className="text-[10px] font-mono text-white/50">WP-03 // RECOMMENDED VECTOR • LOCKED</div>
              <h4 className="text-sm font-medium text-white">High-Throughput Partitioned Message Queues</h4>
              <p className="text-xs text-white/50 mt-0.5">
                Zero-copy socket delivery, consumer rebalance storm mitigations.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Skill Gap Breakdown */}
        <div className="p-6 rounded-2xl bg-[#11131d] border border-white/10 shadow-xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-white/10 text-xs">
            <span className="font-bold text-white text-sm">Skill Gap Breakdown</span>
            <div className="flex gap-3 font-mono text-[10px]">
              <span className="text-white/40">■ REQ</span>
              <span className="text-[#ffd371]">■ CURRENT</span>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {[
              { skill: 'Distributed Storage & LSM-Trees', current: 55, req: 85, delta: '-30%' },
              { skill: 'Concurrency & Dynamic Sharding', current: 70, req: 90, delta: '-20%' },
              { skill: 'Core Algorithms & Complex Graphs', current: 88, req: 80, delta: 'EXCEEDS' },
              { skill: 'Observability & Chaos Engineering', current: 62, req: 75, delta: '-13%' },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-white font-medium">{item.skill}</span>
                  <span className="font-mono text-[#ffd371] text-xs">
                    {item.current}% / {item.req}% ({item.delta})
                  </span>
                </div>
                <div className="w-full bg-[#323440] h-2 rounded-full overflow-hidden relative">
                  <div className="bg-[#ffd371] h-full rounded-full" style={{ width: `${item.current}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
