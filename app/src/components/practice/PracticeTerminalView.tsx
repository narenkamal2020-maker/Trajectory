import React, { useState } from 'react';
import { Play, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { api, type SubmitResult } from '../../services/api';

export const PracticeTerminalView: React.FC = () => {
  const [activeLang, setActiveLang] = useState<'py' | 'cpp' | 'go'>('py');
  const [isExecuting, setIsExecuting] = useState(false);
  const [code, setCode] = useState(
`# Alien Dictionary Dependency Engine — Topological BFS Resolution
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
        return topologicalSortKahn(adj, in_degree)`
  );

  const [testResult, setTestResult] = useState<SubmitResult | null>({
    passed: false,
    passedTests: 2,
    totalTests: 3,
    executionTimeMs: 14,
    memoryUsedMb: 2.8,
    feedback: 'Accuracy dropped on cyclic graph traversal benchmark. In yesterday’s benchmark, stateful obstacle compression yielded TLE on cyclic edge stress.',
    results: [
      { caseId: 'Case 01: Standard DAG', status: 'PASS', timeMs: 4 },
      { caseId: 'Case 02: Multi-Root Forest', status: 'PASS', timeMs: 6 },
      { caseId: 'Case 03: Cyclic Edge Stress', status: 'FAIL', timeMs: 2400, error: 'TLE > 2.4s' },
    ],
  });

  const handleRunTests = async () => {
    setIsExecuting(true);
    try {
      const res = await api.submitCode('TRJ-904', code, activeLang);
      setTestResult(res);
    } catch {
      // handled
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs text-[#ffd371] tracking-widest uppercase font-bold">
            PRECISION EXECUTION HARNESS
          </span>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold text-white mt-1">
            Practice Terminal
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs bg-[#ffd371]/10 text-[#ffd371] px-3 py-1.5 rounded-lg border border-[#ffd371]/30">
            MISSION TRJ-904 // RECON
          </span>
        </div>
      </div>

      {/* Main Terminal Editor Card */}
      <div className="rounded-2xl bg-[#0e111a] border border-[#ffd371]/30 shadow-2xl overflow-hidden">
        {/* Editor Header */}
        <div className="px-5 py-3.5 bg-[#131724] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="font-mono text-xs text-white/80 font-bold ml-2">
              Alien Dictionary Dependency Engine
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#090c14] p-1 rounded-lg border border-white/10">
              {(['py', 'cpp', 'go'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveLang(lang)}
                  className={`px-3 py-1 text-xs font-mono rounded cursor-pointer transition-all ${
                    activeLang === lang
                      ? 'bg-[#ffd371]/20 text-[#ffd371] border border-[#ffd371]/40 font-bold'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            <span className="font-mono text-[10px] bg-[#ffd371]/10 text-[#ffd371] px-2.5 py-1 rounded border border-[#ffd371]/30">
              GRAPH BFS
            </span>
            <span className="font-mono text-[10px] bg-white/10 text-white/70 px-2.5 py-1 rounded">
              TOPOLOGICAL SORT
            </span>
          </div>
        </div>

        {/* AI Diagnostic Alert */}
        <div className="px-5 py-2.5 bg-[#ffd371]/5 border-b border-[#ffd371]/20 flex items-center gap-2.5 text-xs font-mono text-[#ffd371]">
          <Zap className="w-4 h-4 text-[#ffd371] flex-shrink-0" />
          <span>▲ AI DIAGNOSTIC: Accuracy dropped 14% on cyclic graph traversal in yesterday’s benchmark.</span>
        </div>

        {/* Editor Code Input Area */}
        <div className="p-5 bg-[#080a12] font-mono text-xs text-[#e1e1f1] border-b border-white/10">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={14}
            className="w-full bg-transparent border-none text-[#e1e1f1] font-mono text-xs focus:outline-none leading-relaxed resize-none"
            spellCheck={false}
          />
        </div>

        {/* Test Harness Telemetry & Execution Controls */}
        <div className="p-5 bg-[#101320] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex-1 w-full space-y-2.5">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[#d3c5ac]">TEST RUNNER TELEMETRY</span>
              <span className={`font-bold ${testResult?.passed ? 'text-emerald-400' : 'text-[#ffb4ab]'}`}>
                {testResult?.passedTests} / {testResult?.totalTests} TEST CASES EXECUTED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
              {testResult?.results.map((r, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl bg-white/5 border flex items-center justify-between ${
                    r.status === 'PASS' ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/40 text-[#ffb4ab]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {r.status === 'PASS' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span className="truncate">{r.caseId}</span>
                  </div>
                  <span className="font-bold ml-2">{r.timeMs}ms</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={handleRunTests}
              disabled={isExecuting}
              className="w-full md:w-auto py-3 px-6 bg-[#ffd371] hover:bg-[#edb40b] text-[#3f2e00] font-mono font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,211,113,0.4)] transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isExecuting ? 'EXECUTING SIMULATION...' : 'Run Test Cases'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
