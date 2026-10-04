import React, { useState, useEffect } from 'react';
import { api, type SkillNode, type SubmitResult } from '../../services/api';
import {
  Rocket,
  Play,
  CheckCircle2,
  XCircle,
  Sliders,
  Zap,
  ArrowRight,
  ShieldAlert,
  Mic,
  Smartphone,
  Laptop,
  Globe
} from 'lucide-react';

interface WebSuiteProps {
  onSwitchToMobile?: () => void;
}

export const WebSuite: React.FC<WebSuiteProps> = ({ onSwitchToMobile }) => {
  // Constellation State
  const [skills, setSkills] = useState<SkillNode[]>([]);
  const [activeNode, setActiveNode] = useState<SkillNode | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [hoveredNode, setHoveredNode] = useState<SkillNode | null>(null);

  // Technical Sandbox State
  const [activeLang, setActiveLang] = useState<'py' | 'cpp' | 'go'>('py');
  const [isExecuting, setIsExecuting] = useState(false);
  const [testResult, setTestResult] = useState<SubmitResult | null>({
    passed: false,
    passedTests: 2,
    totalTests: 3,
    executionTimeMs: 14,
    memoryUsedMb: 2.8,
    feedback: 'Accuracy dropped on cyclic graph traversal benchmark.',
    results: [
      { caseId: 'Case 01: Standard DAG', status: 'PASS', timeMs: 4 },
      { caseId: 'Case 02: Multi-Root Forest', status: 'PASS', timeMs: 6 },
      { caseId: 'Case 03: Cyclic Edge Stress', status: 'FAIL', timeMs: 2400, error: 'TLE > 2.4s' },
    ],
  });

  // ATLAS-7 AI Examiner Voice State
  const [audioStreamLevel, setAudioStreamLevel] = useState<number[]>([
    24, 45, 78, 92, 64, 40, 85, 96, 55, 32, 70, 88, 42, 60, 95, 30, 68, 84, 50, 20
  ]);

  // Load Initial Skill Telemetry
  useEffect(() => {
    async function loadData() {
      const data = await api.getSkillConstellation();
      setSkills(data);
      if (data.length > 1) {
        setActiveNode(data[1]); // Default to LSM-Trees (DOM-02) as in screen.png
      }
    }
    loadData();
  }, []);

  // Animate audio waveform dynamically
  useEffect(() => {
    const interval = setInterval(() => {
      setAudioStreamLevel((prev) =>
        prev.map(() => Math.floor(Math.random() * 80) + 15)
      );
    }, 180);
    return () => clearInterval(interval);
  }, []);

  const handleRunTests = async () => {
    setIsExecuting(true);
    try {
      const res = await api.submitCode('TRJ-904', 'alienOrder()', activeLang);
      setTestResult(res);
    } catch {
      // simulated
    } finally {
      setIsExecuting(false);
    }
  };

  const displayedNode = hoveredNode || activeNode;

  return (
    <div className="w-full min-h-screen bg-[#0b0e18] text-[#e1e1f1] font-body selection:bg-[#ffd371] selection:text-[#3f2e00] flex flex-col items-center">
      {/* 1. TOP APP HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 px-4 sm:px-8 pt-2">
        <div className="h-16 sm:h-20 max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 bg-[#191b26]/80 backdrop-blur-2xl rounded-full border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5),0_0_24px_rgba(237,180,11,0.06)]">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <a href="#hero" className="flex items-center gap-2 group">
              <div className="w-3 h-3 rounded-full bg-[#ffd371] shadow-[0_0_12px_rgba(255,211,113,0.8)] animate-pulse" />
              <span className="font-headline font-bold text-base sm:text-lg tracking-widest text-[#e1e1f1] group-hover:text-[#ffd371] transition-colors">
                TRAJECTORY
              </span>
            </a>
            <span className="hidden xl:inline-block font-mono text-[11px] px-2 py-0.5 rounded bg-[#1d1f2a] text-[#d3c5ac] border border-white/5">
              ORBIT // 4.9
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#d3c5ac]">
            <a href="#hero" className="text-[#ffd371] font-semibold transition-colors">Product</a>
            <a href="#constellation" className="hover:text-white transition-colors">Skills</a>
            <a href="#sandbox" className="hover:text-white transition-colors">Practice</a>
            <a href="#atlas" className="hover:text-white transition-colors">Interviews</a>
            <a href="#timeline" className="hover:text-white transition-colors">Career</a>
            <a href="#resume" className="hover:text-white transition-colors">Signal Ingress</a>
          </nav>

          {/* Action CTAs & View Switcher */}
          <div className="flex items-center gap-3">
            {onSwitchToMobile && (
              <button
                type="button"
                onClick={onSwitchToMobile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-[#ffd371] border border-[#ffd371]/30 transition-all cursor-pointer shadow-sm"
                title="Open Mobile Companion Suite"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">MOBILE VIEW</span>
              </button>
            )}

            <a
              href="#sandbox"
              className="font-mono text-xs bg-[#ffd371] hover:bg-[#edb40b] text-[#3f2e00] font-bold px-4 py-2 rounded shadow-[0_0_16px_rgba(237,180,11,0.35)] hover:shadow-[0_0_24px_rgba(237,180,11,0.6)] transition-all cursor-pointer"
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* MAIN BODY CONTAINER */}
      <main className="w-full pt-20 max-w-7xl mx-auto px-4 sm:px-8 space-y-24">
        {/* 2. HERO SECTION */}
        <section id="hero" className="relative w-full min-h-[820px] flex flex-col justify-between items-center text-center pt-16 pb-12 overflow-hidden">
          {/* Decorative Glow Vectors & Orbit Arch */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0b0e18] via-[#0b0e18]/60 to-transparent z-0" />
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] lg:w-[1100px] h-[550px] bg-[#ffd371]/10 rounded-full blur-[140px] pointer-events-none" />

          {/* SVG Orbit Arch */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0" fill="none" preserveAspectRatio="none" viewBox="0 0 1440 900">
            <path
              d="M-100 880C260 840 520 700 820 420C1100 160 1340 60 1560 -40"
              stroke="url(#trajectory_glow_gradient)"
              strokeDasharray="8 6"
              strokeWidth="2.5"
            />
            <path
              d="M-60 890C300 850 560 710 850 440C1130 180 1370 80 1600 -20"
              opacity="0.8"
              stroke="#ffd371"
              strokeWidth="1.2"
            />
            <defs>
              <linearGradient id="trajectory_glow_gradient" x1="0" x2="1560" y1="880" y2="-40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ffd371" stopOpacity="0.9" />
                <stop offset="0.6" stopColor="#ffb871" stopOpacity="0.4" />
                <stop offset="1" stopColor="#ffb871" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* Top Badge Announcement */}
          <div className="relative z-10 flex flex-col items-center pt-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#272935]/70 backdrop-blur-2xl shadow-[0_0_24px_rgba(255,211,113,0.15)] border border-[#ffd371]/20">
              <span className="w-2 h-2 rounded-full bg-[#ffd371] shadow-[0_0_10px_#ffd371] animate-pulse" />
              <span className="font-mono text-xs text-[#d3c5ac] tracking-widest uppercase">
                TRAJECTORY CORE PROTOCOL // Q3 FLIGHT ENGAGEMENTS
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#ffd371]" />
            </div>
          </div>

          {/* Main Hero Center Headline */}
          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center justify-center my-auto px-4">
            <div className="font-mono text-xs text-[#ffb871] tracking-widest uppercase mb-3 flex items-center gap-2">
              <span>ORBITAL CAREER ACCELERATION</span>
              <span className="text-white/20">/</span>
              <span className="text-[#d3c5ac]">L4 → STAFF L6</span>
            </div>

            <h1 className="font-headline text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6 max-w-3xl leading-[1.1]">
              Build the trajectory of your{' '}
              <span className="bg-gradient-to-r from-[#ffd371] via-[#ffb871] to-[#ffdf9d] bg-clip-text text-transparent italic">
                technical career.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#d3c5ac] max-w-2xl text-center mb-8 leading-relaxed font-light">
              The AI-native career intelligence engine that diagnoses engineering competencies, generates hyper-targeted technical drills, and guides your flight path from L4 to Staff Architect.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
              <a
                href="#constellation"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-mono text-xs bg-[#ffd371] text-[#3f2e00] font-bold px-6 py-3.5 rounded shadow-[0_0_24px_rgba(237,180,11,0.45)] hover:shadow-[0_0_36px_rgba(237,180,11,0.7)] hover:bg-[#edb40b] transition-all active:scale-[0.98]"
              >
                <span>Launch Your Trajectory</span>
                <Rocket className="w-4 h-4" />
              </a>
              <a
                href="#sandbox"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-mono text-xs bg-[#272935]/80 backdrop-blur-xl text-white hover:text-[#ffd371] px-6 py-3.5 rounded transition-all hover:bg-[#323440] border border-white/10 shadow-lg active:scale-[0.98]"
              >
                <Play className="w-4 h-4 text-[#ffb871]" />
                <span>Explore Flight Path</span>
              </a>
            </div>
          </div>

          {/* Live Telemetry Status Strip */}
          <div className="relative z-10 w-full max-w-4xl mx-auto mt-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-[#191b26]/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(255,211,113,0.06)]">
              <div className="flex items-center justify-center sm:justify-start gap-3 px-4 py-2.5 bg-[#1d1f2a]/70 rounded-xl border border-white/5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffb871] shadow-[0_0_8px_#ffb871]" />
                <span className="font-mono text-sm font-bold text-white">72%</span>
                <span className="font-mono text-xs text-[#d3c5ac]">Readiness Benchmark</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-3 px-4 py-2.5 bg-[#1d1f2a]/70 rounded-xl border border-white/5">
                <Zap className="w-4 h-4 text-[#ffd371]" />
                <span className="font-mono text-sm font-bold text-white">12-Day</span>
                <span className="font-mono text-xs text-[#d3c5ac]">Trajectory Velocity</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-3 px-4 py-2.5 bg-[#1d1f2a]/70 rounded-xl border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-[#ffd371]" />
                <span className="font-mono text-sm font-bold text-white">Staff L6</span>
                <span className="font-mono text-xs text-[#d3c5ac]">Architecture Verified</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. FLIGHT PATH DELTA: Where You Are vs. Where You Need To Be */}
        <section className="relative w-full py-8">
          <div className="max-w-6xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="font-mono text-xs text-[#ffd371] tracking-widest uppercase">FLIGHT PATH DELTA</span>
                <h2 className="font-headline text-2xl sm:text-3xl font-bold text-white mt-1">
                  Where You Are vs. Where You Need To Be
                </h2>
              </div>
              <p className="text-sm text-[#d3c5ac] max-w-md font-light">
                Traditional prep tests memorization. High-stakes staff-level loops evaluate deterministic judgment under unpredictable failure modes.
              </p>
            </div>

            {/* Contrasting Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Traditional Drift */}
              <div className="relative rounded-2xl p-6 bg-[#191b26]/70 backdrop-blur-xl border border-[#ffb4ab]/20 shadow-xl flex flex-col justify-between overflow-hidden">
                <div className="absolute top-4 right-4 opacity-30">
                  <XCircle className="w-8 h-8 text-[#ffb4ab]" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#ffb4ab] bg-[#93000a]/40 px-2.5 py-1 rounded border border-[#ffb4ab]/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]" />
                    TRADITIONAL DRIFT // STAGNANT
                  </div>
                  <h3 className="font-headline text-xl font-bold text-white mt-4">The Opaque LeetCode Abyss</h3>
                  <p className="text-sm text-[#d3c5ac] mt-2 leading-relaxed">
                    Aimless grinding across 400+ disconnected problems. Generic mock interviewers with vague feedback like “improve communication” leaving systemic design architecture gaps unaddressed.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center font-mono text-xs text-[#d3c5ac]">
                    <span>Velocity Metric</span>
                    <span className="text-[#ffb4ab]">0.14 rad/mo (Drift)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#323440] overflow-hidden">
                    <div className="bg-[#ffb4ab] h-full w-[20%]" />
                  </div>
                </div>
              </div>

              {/* Trajectory Vector */}
              <div className="relative rounded-2xl p-6 bg-gradient-to-br from-[#1d1f2a] to-[#11131d] backdrop-blur-xl border border-[#ffd371]/40 shadow-2xl flex flex-col justify-between overflow-hidden">
                <div className="absolute top-4 right-4 opacity-40">
                  <Rocket className="w-8 h-8 text-[#ffd371]" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#ffd371] bg-[#ffd371]/10 px-2.5 py-1 rounded border border-[#ffd371]/30 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffd371] animate-pulse" />
                    TRAJECTORY VECTOR // OPTIMAL ASCENT
                  </div>
                  <h3 className="font-headline text-xl font-bold text-white mt-4">Deterministic Competency Navigation</h3>
                  <p className="text-sm text-[#d3c5ac] mt-2 leading-relaxed">
                    Dynamic Bayesian skill-graph telemetry. Laser-focused drills calibrated to your exact architectural blindspots, verified by adversarial AI defense rounds mirroring Tier-1 principal panels.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center font-mono text-xs text-[#d3c5ac]">
                    <span>Ascent Growth Velocity</span>
                    <span className="text-[#ffd371] font-bold">1.82 rad/mo (Accelerating)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#323440] overflow-hidden">
                    <div className="bg-[#ffd371] h-full w-[82%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. SPATIAL SKILL CONSTELLATION */}
        <section id="constellation" className="relative w-full py-8">
          <div className="max-w-6xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-mono text-xs text-[#ffd371] tracking-widest uppercase">TOPOLOGY MAP // LIVE SYNC</span>
                <h2 className="font-headline text-2xl sm:text-3xl font-bold text-white mt-1">
                  Spatial Skill Constellation
                </h2>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 bg-[#191b26] p-1 rounded-xl border border-white/10 text-xs font-mono">
                {[
                  { id: 'all', label: 'All 6 Nodes' },
                  { id: 'distributed', label: 'Distributed Storage' },
                  { id: 'core', label: 'Sys-Protocols' },
                  { id: 'algorithmic', label: 'Network Throughput' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFilterCategory(cat.id)}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      filterCategory === cat.id
                        ? 'bg-[#ffd371] text-[#3f2e00] font-bold shadow-[0_0_10px_rgba(255,211,113,0.3)]'
                        : 'text-[#d3c5ac] hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Constellation Dashboard Container */}
            <div className="rounded-2xl bg-[#11131d] border border-white/10 p-5 shadow-2xl relative">
              {/* Header Telemetry Bar */}
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-white/10 text-xs font-mono text-[#d3c5ac] gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ffd371] animate-pulse" />
                  <span className="text-white font-bold">SYS-CONSTELLATION // L6_DISTRIBUTED_KERNEL</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>6 NODES MAPPED</span>
                  <span className="text-[#ffd371]">3 RE-VECTOR REQ</span>
                  <span>BAYESIAN CONFIDENCE: 94.2%</span>
                </div>
              </div>

              {/* Grid of 6 Constellation Nodes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                {skills
                  .filter((s) => filterCategory === 'all' || s.category === filterCategory)
                  .map((node) => {
                    const isSelected = displayedNode?.id === node.id;
                    const isDelta = node.status === 'delta';
                    const isLocked = node.status === 'locked';

                    return (
                      <div
                        key={node.id}
                        onClick={() => setActiveNode(node)}
                        onMouseEnter={() => setHoveredNode(node)}
                        onMouseLeave={() => setHoveredNode(null)}
                        className={`p-4 rounded-xl cursor-pointer transition-all duration-300 relative border ${
                          isSelected
                            ? 'bg-[#1d1f2a] border-[#ffd371] shadow-[0_0_24px_rgba(237,180,11,0.25)] scale-[1.02]'
                            : isDelta
                            ? 'bg-[#191b26] border-[#ffb871]/40 hover:border-[#ffd371]/80'
                            : 'bg-[#191b26] border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-[#ffd371] font-bold">{node.code}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              isDelta
                                ? 'bg-[#da8001]/20 text-[#ffb871] border border-[#da8001]/40'
                                : isLocked
                                ? 'bg-white/10 text-[#d3c5ac]'
                                : 'bg-[#ffd371]/10 text-[#ffd371] border border-[#ffd371]/30'
                            }`}
                          >
                            {node.delta}
                          </span>
                        </div>

                        <h4 className="font-headline font-bold text-sm text-white mt-2">{node.name}</h4>
                        <p className="text-xs text-[#d3c5ac] mt-1 line-clamp-2">{node.summary}</p>

                        <div className="mt-3 pt-2 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-[#d3c5ac]">
                          <span>PREREQ: {node.prerequisite}</span>
                          <span className="text-white font-semibold">{node.drillTime}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Bottom Interactive Inspector Bar */}
              {displayedNode && (
                <div className="mt-5 p-4 rounded-xl bg-[#1d1f2a] border border-[#ffd371]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-inner">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#ffd371]/10 border border-[#ffd371]/30 flex items-center justify-center text-[#ffd371] flex-shrink-0">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="text-white font-bold">
                          ACTIVE FOCUS: {displayedNode.code} // {displayedNode.name.toUpperCase()}
                        </span>
                        <span className="text-[#ffd371] bg-[#ffd371]/10 px-2 py-0.2 rounded text-[10px]">
                          {displayedNode.delta}
                        </span>
                      </div>
                      <p className="text-xs text-[#d3c5ac] mt-0.5">{displayedNode.summary}</p>
                    </div>
                  </div>

                  <a
                    href="#sandbox"
                    className="font-mono text-xs uppercase px-4 py-2 rounded bg-[#ffd371] text-[#3f2e00] font-bold hover:bg-[#edb40b] transition-all shadow-[0_0_14px_rgba(255,211,113,0.35)] active:scale-[0.98] inline-flex items-center gap-1.5 flex-shrink-0"
                  >
                    <span>Queue Drill Vector →</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 5. HYPER-TARGETED TECHNICAL SANDBOX */}
        <section id="sandbox" className="relative w-full py-8">
          <div className="max-w-6xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="font-mono text-xs text-[#ffd371] tracking-widest uppercase">PRECISION EXECUTION</span>
                <h2 className="font-headline text-2xl sm:text-3xl font-bold text-white mt-1">
                  Hyper-Targeted Technical Sandbox
                </h2>
              </div>
              <p className="text-sm text-[#d3c5ac] max-w-md font-light">
                Zero random puzzles. The engine synthesizes custom algorithmic challenges directly mapped to your cognitive telemetry gaps.
              </p>
            </div>

            {/* Main Terminal Editor Card */}
            <div className="rounded-2xl bg-[#0e111a] border border-[#ffd371]/30 shadow-2xl overflow-hidden">
              {/* Window Controls & Lang Tabs */}
              <div className="px-4 py-3 bg-[#131724] border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="font-mono text-xs text-white/60 ml-2">
                    vector-session_947.py — 78 FPS
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#090c14] p-1 rounded-lg border border-white/5 mr-2">
                    {(['py', 'cpp', 'go'] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setActiveLang(lang)}
                        className={`px-2.5 py-0.5 text-[10px] font-mono rounded cursor-pointer transition-all ${
                          activeLang === lang
                            ? 'bg-[#ffd371]/20 text-[#ffd371] border border-[#ffd371]/40 font-bold'
                            : 'text-white/40 hover:text-white/70'
                        }`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <span className="font-mono text-[10px] bg-[#ffd371]/10 text-[#ffd371] px-2 py-0.5 rounded border border-[#ffd371]/30">
                    MISSION // TOPOLOGICAL SORT
                  </span>
                  <span className="font-mono text-[10px] bg-white/10 text-white/70 px-2 py-0.5 rounded">
                    MEMORY EFFICIENCY 98.4%
                  </span>
                </div>
              </div>

              {/* Diagnostic Alert Callout */}
              <div className="px-4 py-2 bg-[#ffd371]/5 border-b border-[#ffd371]/20 flex items-center gap-2 text-xs font-mono text-[#ffd371]">
                <Zap className="w-4 h-4 text-[#ffd371]" />
                <span>Flagged because your last 3 graph attempts failed on cyclic dependency resolution under race condition.</span>
              </div>

              {/* Editor Code Pane */}
              <div className="p-5 bg-[#080a12] font-mono text-xs text-white/90 overflow-x-auto leading-relaxed border-b border-white/10">
                <pre className="text-[#e1e1f1]">
{`# Alien Dictionary Dependency Engine — Topological BFS Resolution
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
        return topologicalSortKahn(adj, in_degree)`}
                </pre>
              </div>

              {/* Test Harness Telemetry & Run Controls */}
              <div className="p-5 bg-[#101320] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1 w-full space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[#d3c5ac]">TEST HARNESS TELEMETRY</span>
                    <span className={testResult?.passed ? 'text-emerald-400' : 'text-[#ffb4ab]'}>
                      {testResult?.passedTests} / {testResult?.totalTests} EXECUTED
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                    {testResult?.results.map((r, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-lg bg-white/5 border flex items-center justify-between ${
                          r.status === 'PASS' ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/40 text-[#ffb4ab]'
                        }`}
                      >
                        <span className="truncate">{r.caseId}</span>
                        <span className="font-bold ml-2">{r.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex-shrink-0 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={handleRunTests}
                    disabled={isExecuting}
                    className="w-full md:w-auto py-3 px-6 bg-[#ffd371] hover:bg-[#edb40b] text-[#3f2e00] font-mono font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,211,113,0.4)] transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{isExecuting ? 'EXECUTING SIMULATION...' : 'Launch Terminal Drill'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. ATLAS-7 ORBITAL AI EXAMINER */}
        <section id="atlas" className="relative w-full py-8">
          <div className="max-w-6xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="font-mono text-xs text-[#ffd371] tracking-widest uppercase">ADVERSARIAL SYSTEM DESIGN</span>
                <h2 className="font-headline text-2xl sm:text-3xl font-bold text-white mt-1">
                  ATLAS-7 Orbital AI Examiner
                </h2>
              </div>
              <p className="text-sm text-[#d3c5ac] max-w-md font-light">
                Not another chatbot. An adversarial AI calibrated on 10,000+ real Staff & Principal interview transcripts probing your distributed trade-offs in real time.
              </p>
            </div>

            {/* Examiner Interactive Terminal Container */}
            <div className="rounded-2xl bg-[#11131d] border border-white/10 p-6 shadow-2xl space-y-6">
              {/* Header Status */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs font-mono">
                <div className="flex items-center gap-2 text-white">
                  <div className="w-7 h-7 rounded-lg bg-[#ffd371]/10 border border-[#ffd371]/30 flex items-center justify-center text-[#ffd371]">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold">ATLAS-7 Examiner Instance</span>
                    <span className="text-[#d3c5ac] ml-2 font-normal">L6 Principal Evaluator • Raft Quorum Specialization</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[#ffd371]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ACTIVE ROUND // 24:18</span>
                </div>
              </div>

              {/* Examiner Question Box */}
              <div className="p-4 rounded-xl bg-[#191b26] border border-white/5">
                <div className="flex justify-between items-center text-xs font-mono text-[#d3c5ac] mb-2">
                  <span className="text-[#ffd371]">INTERVIEWER VECTOR // PROBE 03</span>
                  <span>00:54 AGO</span>
                </div>
                <p className="text-sm text-white font-medium leading-relaxed">
                  “You just proposed writing to a secondary replica pool before the leader receives Raft quorum commit. How does your topology prevent stale client reads during a network split-brain where a partitioned leader accepts mutations?”
                </p>
              </div>

              {/* Candidate Voice Stream Waveform */}
              <div className="p-4 rounded-xl bg-[#1d1f2a] border border-[#ffd371]/30 space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <div className="flex items-center gap-2 text-[#ffd371]">
                    <Mic className="w-4 h-4" />
                    <span>CANDIDATE SPEECH STREAM — 92.4% CONFIDENCE</span>
                  </div>
                  <span className="text-[#d3c5ac]">128 WPM PACING</span>
                </div>

                {/* Animated Audio Waveform */}
                <div className="flex items-center gap-1.5 h-10 px-2 bg-[#0b0e18] rounded-lg overflow-hidden">
                  {audioStreamLevel.map((height, idx) => (
                    <div
                      key={idx}
                      className="flex-1 bg-gradient-to-t from-[#ffd371] to-[#ffb871] rounded-full transition-all duration-150"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>

                <p className="text-xs text-[#d3c5ac] font-mono italic">
                  “We enforce monotonic Read Lease timestamps, before responding to the client, the leader verifies with a heartbeat quorum that its lease has not expired, preventing dirty reads...”
                </p>
              </div>

              {/* Telemetry Gauge Scores */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-[#191b26] rounded-xl border border-white/5 space-y-1">
                  <div className="flex justify-between text-xs font-mono text-[#d3c5ac]">
                    <span>Distributed Depth</span>
                    <span className="text-[#ffd371] font-bold">92%</span>
                  </div>
                  <div className="w-full bg-[#323440] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#ffd371] h-full w-[92%]" />
                  </div>
                </div>

                <div className="p-3 bg-[#191b26] rounded-xl border border-white/5 space-y-1">
                  <div className="flex justify-between text-xs font-mono text-[#d3c5ac]">
                    <span>Adversarial Defense Stability</span>
                    <span className="text-[#ffd371] font-bold">88%</span>
                  </div>
                  <div className="w-full bg-[#323440] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#ffd371] h-full w-[88%]" />
                  </div>
                </div>

                <div className="p-3 bg-[#191b26] rounded-xl border border-white/5 space-y-1">
                  <div className="flex justify-between text-xs font-mono text-[#d3c5ac]">
                    <span>Articulation & Pacing</span>
                    <span className="text-emerald-400 font-bold">94%</span>
                  </div>
                  <div className="w-full bg-[#323440] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[94%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. FLIGHT PATH WAYPOINT TIMELINE */}
        <section id="timeline" className="relative w-full py-8">
          <div className="max-w-6xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="font-mono text-xs text-[#ffd371] tracking-widest uppercase">PRECISION ASCENT</span>
                <h2 className="font-headline text-2xl sm:text-3xl font-bold text-white mt-1">
                  Flight Path Waypoint Timeline
                </h2>
              </div>
              <div className="font-mono text-xs bg-[#ffd371]/10 text-[#ffd371] px-3 py-1.5 rounded-lg border border-[#ffd371]/30">
                Staff Distributed Systems Architect (Google / Stripe L6) • 82% MATCH
              </div>
            </div>

            {/* 5-Step Horizontal Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4">
              {[
                { step: '01', title: 'L4 Core Baseline', desc: 'Data structures, standard DML/DDL, concurrency primitives & clean code rigor.', status: '100% CLEAR', verified: true },
                { step: '02', title: 'Distributed Consensus', desc: 'Multi-Raft quorums, lease reads, split-brain recovery & monotonic read models.', status: '88% IN-FLIGHT', inFlight: true },
                { step: '03', title: 'High-Throughput Queues', desc: 'Zero-copy IPC, write-ahead ring buffers, partition rebalancing & backpressure.', status: 'QUEUED', queued: true },
                { step: '04', title: 'Adversarial Defense', desc: '45-minute live oral loop with ATLAS-7 testing fault isolation & root analysis.', status: 'GATE 04', locked: true },
                { step: '05', title: 'Staff L6 Locked', desc: 'Verified portfolio, production failure case transcripts & offer readiness.', status: 'TARGET ORBIT', locked: true },
              ].map((wp, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    wp.inFlight
                      ? 'bg-[#1d1f2a] border-[#ffd371] shadow-[0_0_20px_rgba(237,180,11,0.2)]'
                      : wp.verified
                      ? 'bg-[#191b26] border-emerald-500/30'
                      : 'bg-[#191b26] border-white/5 opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center font-mono text-xs">
                      <span className="text-[#ffd371] font-bold">WP-{wp.step}</span>
                      <span className="text-[10px] text-[#d3c5ac]">{wp.status}</span>
                    </div>
                    <h4 className="font-headline font-bold text-sm text-white mt-2">{wp.title}</h4>
                    <p className="text-xs text-[#d3c5ac] mt-1 line-clamp-3 leading-relaxed">{wp.desc}</p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-white/5 font-mono text-[10px] text-[#ffd371]">
                    {wp.verified ? '✓ 100% CLEAR' : wp.inFlight ? '▲ ENGAGE' : '• LOCKED'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. RESUME SIGNAL INGRESS */}
        <section id="resume" className="relative w-full py-8">
          <div className="max-w-6xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="font-mono text-xs text-[#ffd371] tracking-widest uppercase">RESUME TELEMETRY INGRESS</span>
                <h2 className="font-headline text-2xl sm:text-3xl font-bold text-white mt-1">
                  Diagnostic Signal Extraction
                </h2>
              </div>
              <p className="text-sm text-[#d3c5ac] max-w-md font-light">
                See exactly how Staff hiring committees decode your past impact statements compared to baseline formulations.
              </p>
            </div>

            {/* Ingress Comparison Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Baseline Bullet */}
              <div className="p-6 rounded-2xl bg-[#191b26] border border-[#ffb4ab]/30 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[#d3c5ac]">EXTRACTED RESUME BULLET</span>
                    <span className="text-[#ffb4ab] bg-[#93000a]/40 px-2 py-0.5 rounded">NAIVE SCOPE</span>
                  </div>
                  <p className="text-sm text-white/90 italic mt-3 bg-[#0b0e18] p-3 rounded-lg border border-white/5">
                    “Re-architected backend microservices to improve database read latency and added Redis cache layer to speed up API responses.”
                  </p>

                  <div className="mt-4 space-y-1 text-xs text-[#d3c5ac]">
                    <span className="text-[#ffb4ab] font-bold font-mono">DEFICIENCIES DETECTED:</span>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-white/70">
                      <li>No quantified throughput benchmarks/P99 latency values</li>
                      <li>Lacks cache invalidation strategy & thundering herd mitigation</li>
                      <li>Fails to demonstrate cross-functional leadership</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 text-xs font-mono text-[#d3c5ac]">
                  Calibrated Level: Mid-Senior (L4/L5 Edge)
                </div>
              </div>

              {/* Staff L6 Calibrated */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1d1f2a] to-[#11131d] border border-[#ffd371] shadow-[0_0_24px_rgba(237,180,11,0.2)] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[#ffd371] font-bold">STAFF L6 CALIBRATED VECTOR</span>
                    <span className="text-[#ffd371] bg-[#ffd371]/10 px-2 py-0.5 rounded border border-[#ffd371]/30">
                      +8.5% READINESS GAIN
                    </span>
                  </div>
                  <p className="text-sm text-white italic mt-3 bg-[#0b0e18] p-3 rounded-lg border border-[#ffd371]/20">
                    “Spearheaded cross-org re-architecture of tiered storage engine, deploying distributed Redis Cluster with probabilistic early-expiration; drove p99 API latency from 420ms to 35ms under 140k QPS peak.”
                  </p>

                  <div className="mt-4 space-y-1 text-xs text-[#d3c5ac]">
                    <span className="text-[#ffd371] font-bold font-mono">STAFF SIGNALS ACTIVATED:</span>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-white/90">
                      <li>Multi-tier system boundary ownership</li>
                      <li>Quantified sub-metric (140k QPS, p99 delta)</li>
                      <li>Advanced cache stampede prevention pattern</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 text-xs font-mono text-[#ffd371]">
                  Calibrated Level: Staff Architect (L6 Confirmed)
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. MULTI-PLATFORM ECOSYSTEM */}
        <section className="relative w-full py-8 text-center">
          <div className="max-w-6xl mx-auto flex flex-col items-center gap-6">
            <span className="font-mono text-xs text-[#ffd371] tracking-widest uppercase">CONTINUOUS VELOCITY</span>
            <h2 className="font-headline text-2xl sm:text-3xl font-bold text-white">
              Multi-Platform Ecosystem
            </h2>
            <p className="text-sm text-[#d3c5ac] max-w-xl font-light">
              Train wherever your mind operates best. Instant telemetry synchronization across all workstations and mobile devices.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-4 text-left">
              <div className="p-6 rounded-2xl bg-[#191b26] border border-white/10 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffd371]/10 border border-[#ffd371]/30 flex items-center justify-center text-[#ffd371]">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="font-headline font-bold text-base text-white">Web Architecture Canvas</h3>
                <p className="text-xs text-[#d3c5ac] leading-relaxed">
                  Complete spatial canvas with whiteboard node editors, distributed topology validation, and full-screen telemetry reports.
                </p>
                <div className="font-mono text-[10px] text-[#ffd371]">CHROME • BRAVE • SAFARI 17+</div>
              </div>

              <div className="p-6 rounded-2xl bg-[#191b26] border border-white/10 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffd371]/10 border border-[#ffd371]/30 flex items-center justify-center text-[#ffd371]">
                  <Laptop className="w-5 h-5" />
                </div>
                <h3 className="font-headline font-bold text-base text-white">Desktop Core App</h3>
                <p className="text-xs text-[#d3c5ac] leading-relaxed">
                  High-velocity execution environment with microsecond benchmarking, zero-latency keybindings, and offline mock sandbox.
                </p>
                <div className="font-mono text-[10px] text-[#ffd371]">MACOS (APPLE SILICON) • LINUX</div>
              </div>

              <div
                onClick={onSwitchToMobile}
                className="p-6 rounded-2xl bg-[#191b26] border border-[#ffd371]/30 hover:border-[#ffd371] transition-all space-y-3 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#ffd371]/10 border border-[#ffd371]/30 flex items-center justify-center text-[#ffd371] group-hover:scale-110 transition-transform">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="font-headline font-bold text-base text-white group-hover:text-[#ffd371] transition-colors">
                  Mobile Audio Stream
                </h3>
                <p className="text-xs text-[#d3c5ac] leading-relaxed">
                  Daily micro-drills, audio-only adversarial design reviews while walking, and active interview telemetry alerts.
                </p>
                <div className="font-mono text-[10px] text-[#ffd371]">IOS • ANDROID COMPANION →</div>
              </div>
            </div>
          </div>
        </section>

        {/* 10. PRE-FOOTER CTA */}
        <section className="relative w-full py-12 text-center">
          <div className="max-w-4xl mx-auto rounded-3xl p-8 sm:p-12 bg-gradient-to-b from-[#1d1f2a] to-[#0b0e18] border border-[#ffd371]/40 shadow-2xl flex flex-col items-center gap-4">
            <span className="font-mono text-xs text-[#ffd371] tracking-widest uppercase">FLIGHT CHANNELS OPEN</span>
            <h2 className="font-headline text-3xl sm:text-4xl font-bold text-white max-w-xl">
              Your next move starts here.
            </h2>
            <p className="text-sm text-[#d3c5ac] max-w-lg font-light">
              Understand your skills. Practice adversarial reactions. Accelerate into your target engineering orbit with mathematical certainty.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
              <a
                href="#hero"
                className="px-8 py-3.5 rounded bg-[#ffd371] text-[#3f2e00] font-mono text-xs font-bold hover:bg-[#edb40b] transition-all shadow-[0_0_24px_rgba(255,211,113,0.4)]"
              >
                Start Your Trajectory Now →
              </a>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 text-[11px] font-mono text-[#d3c5ac] mt-2">
              <span>NO CREDIT CARD REQUIRED</span>
              <span>•</span>
              <span>INSTANT TELEMETRY REPORT</span>
              <span>•</span>
              <span>SOC-2 TYPE II CERTIFIED</span>
            </div>
          </div>
        </section>
      </main>

      {/* 11. FOOTER */}
      <footer className="w-full border-t border-white/10 mt-16 py-12 px-4 sm:px-8 bg-[#070913] text-xs font-mono text-[#d3c5ac]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffd371]" />
              <span className="font-headline font-bold text-sm text-white">TRAJECTORY</span>
            </div>
            <p className="max-w-xs text-[11px] text-[#9c8f79] leading-relaxed">
              Aerodynamic telemetry and precision career flight control for senior technical specialists, principal engineers, and engineering leadership.
            </p>
            <div className="text-[10px] text-[#ffd371] pt-1">
              ● TELEMETRY ACTIVE: ALL SYSTEMS NOMINAL
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div className="space-y-2">
              <span className="text-white font-bold text-xs uppercase">Platform Pillars</span>
              <ul className="space-y-1 text-[11px] text-[#d3c5ac]">
                <li><a href="#constellation" className="hover:text-white">System Architecture</a></li>
                <li><a href="#sandbox" className="hover:text-white">Algorithmic Telemetry</a></li>
                <li><a href="#atlas" className="hover:text-white">Distributed Consensus</a></li>
                <li><a href="#timeline" className="hover:text-white">Executive Synthesis</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-white font-bold text-xs uppercase">Resources</span>
              <ul className="space-y-1 text-[11px] text-[#d3c5ac]">
                <li><a href="#timeline" className="hover:text-white">Trajectory Flight Path</a></li>
                <li><a href="#sandbox" className="hover:text-white">Mock Terminal</a></li>
                <li><a href="#constellation" className="hover:text-white">Velocity Analytics</a></li>
                <li><a href="#resume" className="hover:text-white">Release Manifest</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-white font-bold text-xs uppercase">Security & Speed</span>
              <ul className="space-y-1 text-[11px] text-[#d3c5ac]">
                <li><span className="hover:text-white">Telemetry Privacy</span></li>
                <li><span className="hover:text-white">Terms of Flight</span></li>
                <li><span className="hover:text-white">Node Status: P99.99</span></li>
                <li><span className="hover:text-white">Cryptographic Audit</span></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center pt-8 mt-8 border-t border-white/5 text-[10px]">
          <span>© 2026 TRAJECTORY AEROSPACE CORE SYSTEMS. ALL TRAJECTORIES RESERVED.</span>
          <div className="flex gap-4 mt-2 sm:mt-0">
            <a href="#" className="hover:text-white">TERMS</a>
            <a href="#" className="hover:text-white">PRIVACY</a>
            <a href="#" className="hover:text-white">OPERATIONAL METRICS</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
