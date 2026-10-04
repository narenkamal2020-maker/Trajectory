import React, { useState } from 'react';
import { MobileShell } from './MobileShell';
import { Play, Sparkles, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

interface PracticeTerminalScreenProps {
  onTabChange?: (tab: 'orbit' | 'practice' | 'mocks' | 'skills' | 'career' | 'more') => void;
}

export const PracticeTerminalScreen: React.FC<PracticeTerminalScreenProps> = ({ onTabChange }) => {
  const [activeLang, setActiveLang] = useState<'py' | 'cpp' | 'go'>('py');
  const [isRunning, setIsRunning] = useState(false);
  const [passCount, setPassCount] = useState<number>(2);

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

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setPassCount(3);
    }, 600);
  };

  return (
    <MobileShell activeTab="practice" onTabChange={onTabChange}>
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
                type="button"
                onClick={() => setActiveLang(lang)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded cursor-pointer ${
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
            <span className={`font-mono text-[11px] ${passCount === 3 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {passCount === 3 ? 'PASS // 3/3 PASSED' : 'FAIL // 2/3 PASSED'}
            </span>
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
            <div className={`p-1.5 rounded-lg bg-white/5 border flex flex-col items-center ${passCount === 3 ? 'border-emerald-500/20' : 'border-rose-500/30'}`}>
              <div className={`flex items-center gap-1 text-[10px] ${passCount === 3 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {passCount === 3 ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} CASE 03
              </div>
              <span className={`text-xs mt-0.5 ${passCount === 3 ? 'text-white/80' : 'text-rose-300'}`}>
                {passCount === 3 ? '9ms' : 'TLE > 2.4s'}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleRunTests}
              disabled={isRunning}
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunning ? 'RUNNING...' : 'RUN TEST CASES'}</span>
            </button>
            <button
              type="button"
              className="py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md cursor-pointer"
            >
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
            { tag: 'HARD // SYS-DESIGN', title: 'LRU Cache with TTL Eviction Engine', meta: '99.2% Memory Efficiency • Solved 3d ago' },
            { tag: 'MEDIUM // DISTRIBUTED', title: 'Distributed Consensus Round-Robin', meta: '72% Fleet Accuracy • Recommended for L6' },
            { tag: 'MEDIUM // ALGO-DP', title: 'Dynamic Programming: Stock Profit with Fee', meta: 'FAANG Frequent • Unattempted' },
          ].map((item, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-400/30 transition-colors cursor-pointer">
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
