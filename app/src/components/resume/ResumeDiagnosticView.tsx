import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { api } from '../../services/api';

export const ResumeDiagnosticView: React.FC = () => {
  const [resumeText, setResumeText] = useState(
    'Re-architected backend microservices to improve database read latency and added Redis cache layer to speed up API responses.'
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    score: number;
    calibratedGain: string;
    signal: string;
  } | null>({
    score: 88,
    calibratedGain: '+8.5% READINESS GAIN',
    signal: 'Extracted high-density P99 metrics and distributed consensus keywords.',
  });

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await api.analyzeResume(resumeText) as {
        score: number;
        calibratedGain: string;
        signal: string;
      };
      setAnalysisResult(res);
    } catch {
      // handled
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs text-[#ffd371] tracking-widest uppercase font-bold">
            RESUME TELEMETRY INGRESS // ATS DEEP SCAN
          </span>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold text-white mt-1">
            Diagnostic Signal Extraction
          </h1>
        </div>

        <span className="font-mono text-xs bg-[#ffd371]/10 text-[#ffd371] px-3 py-1.5 rounded-lg border border-[#ffd371]/30">
          CALIBRATED ATS SCORE: {analysisResult?.score || 88}/100
        </span>
      </div>

      {/* Input Text Box / Upload Area */}
      <div className="p-6 rounded-2xl bg-[#11131d] border border-white/10 shadow-2xl space-y-4">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-white font-bold">PASTE RESUME BULLET POINTS OR TEXT</span>
          <span className="text-[#d3c5ac]">LLM INGRESS // GPT-4o-MINI</span>
        </div>

        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          rows={3}
          className="w-full bg-[#080a12] border border-white/10 rounded-xl p-4 font-mono text-xs text-[#e1e1f1] focus:outline-none focus:border-[#ffd371] transition-colors"
          placeholder="Paste past role experience or impact statements..."
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-6 py-2.5 rounded-xl bg-[#ffd371] hover:bg-[#edb40b] text-[#3f2e00] font-mono text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>{isAnalyzing ? 'DECODING SIGNALS...' : 'Calibrate Against Staff L6 Band'}</span>
          </button>
        </div>
      </div>

      {/* Ingress Comparison Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Extracted Bullet */}
        <div className="p-6 rounded-2xl bg-[#191b26] border border-[#ffb4ab]/30 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[#d3c5ac]">EXTRACTED RESUME BULLET</span>
              <span className="text-[#ffb4ab] bg-[#93000a]/40 px-2 py-0.5 rounded font-bold">
                NAIVE SCOPE
              </span>
            </div>
            <p className="text-sm text-white italic mt-3 bg-[#0b0e18] p-3 rounded-lg border border-white/5">
              “{resumeText}”
            </p>

            <div className="mt-4 space-y-1 text-xs text-[#d3c5ac]">
              <span className="text-[#ffb4ab] font-bold font-mono">DEFICIENCIES DETECTED:</span>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-white/70">
                <li>No quantified throughput benchmarks or P99 latency percentiles</li>
                <li>Lacks cache invalidation strategy & thundering herd mitigations</li>
                <li>Fails to demonstrate cross-functional architecture leadership</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-xs font-mono text-[#d3c5ac]">
            Calibrated Level: Mid-Senior (L4/L5 Edge)
          </div>
        </div>

        {/* Staff L6 Calibrated Vector */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1d1f2a] to-[#11131d] border border-[#ffd371] shadow-[0_0_24px_rgba(237,180,11,0.2)] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[#ffd371] font-bold">STAFF L6 CALIBRATED VECTOR</span>
              <span className="text-[#ffd371] bg-[#ffd371]/10 px-2 py-0.5 rounded border border-[#ffd371]/30 font-bold">
                {analysisResult?.calibratedGain || '+8.5% READINESS GAIN'}
              </span>
            </div>
            <p className="text-sm text-white italic mt-3 bg-[#0b0e18] p-3 rounded-lg border border-[#ffd371]/20">
              “Spearheaded cross-org re-architecture of tiered storage engine, deploying distributed Redis Cluster with probabilistic early-expiration; drove p99 API latency from 420ms to 35ms under 140k QPS peak.”
            </p>

            <div className="mt-4 space-y-1 text-xs text-[#d3c5ac]">
              <span className="text-[#ffd371] font-bold font-mono">STAFF SIGNALS ACTIVATED:</span>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-white/90">
                <li>Multi-tier system boundary ownership & cross-org scope</li>
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
  );
};
