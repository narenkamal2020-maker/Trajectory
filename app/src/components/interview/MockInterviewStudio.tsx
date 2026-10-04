import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  ShieldAlert,
  Send,
  RotateCcw,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export const MockInterviewStudio: React.FC = () => {
  const [isRecording, setIsRecording] = useState(true);
  const [transcript, setTranscript] = useState(
    'We enforce monotonic Read Lease timestamps. Before responding to the client, the leader verifies with a heartbeat quorum that its lease has not expired, preventing dirty reads during split-brain partitions...'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [waveformLevels, setWaveformLevels] = useState<number[]>([
    20, 45, 70, 95, 60, 40, 85, 100, 50, 30, 75, 90, 40, 65, 80, 35, 70, 85, 45, 25
  ]);

  // Dynamic audio waveform simulation
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setWaveformLevels((prev) =>
        prev.map(() => Math.floor(Math.random() * 85) + 15)
      );
    }, 150);
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSubmitResponse = async () => {
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      setFeedback(
        '✓ DEFENSE VERIFIED: Monotonic Read Lease pattern recognized. ATLAS-7 evaluated your quorum boundary handling as Top 5% Staff tier. Gained +6.5% Trajectory match.'
      );
    } catch {
      // handled
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* 1. Simulation Telemetry Protocol Banner */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-[#11131d] border border-white/10 p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-white/10 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#ffd371] px-2 py-0.5 rounded bg-[#272935] font-bold border border-[#ffd371]/20">
              SIM PROTOCOL // SIM-802
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#272935] font-mono text-xs text-[#d3c5ac]">
              <span className="w-2 h-2 rounded-full bg-[#ffd371] animate-ping" />
              LIVE TRANSMISSION
            </span>
          </div>
          <div className="font-mono text-xs text-[#ffb871] font-bold flex items-center gap-1">
            <span>WAYPOINT 02/04 // ORBIT-L6 LOCKED</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline text-2xl sm:text-3xl font-bold text-white">
              L6 Systems Architecture Defense
            </h1>
            <p className="text-xs text-[#d3c5ac] mt-1">
              Target: Principal / Staff Distributed Architect (Google / Stripe Benchmark)
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#191b26] px-4 py-2.5 rounded-xl border border-white/10">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-white/50">ELAPSED CLOCK</span>
              <span className="font-mono text-sm text-[#ffd371] font-bold">24:18 REMAINING</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. AI Examiner Card & Live Audio Waveform Ingress */}
      <div className="rounded-2xl bg-[#11131d] border border-[#ffd371]/30 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ffd371]/10 border border-[#ffd371]/30 flex items-center justify-center text-[#ffd371]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="font-mono text-xs font-bold text-[#ffd371]">
                ORBITAL EXAMINER // ATLAS-7
              </div>
              <div className="font-mono text-[10px] text-[#d3c5ac]">
                MODE: ADVERSARIAL PROBING (48 kHz Live Voiceprint)
              </div>
            </div>
          </div>

          <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
            AUDIO SYNTHESIZER ACTIVE
          </span>
        </div>

        {/* Live Audio Waveform */}
        <div className="h-10 px-3 bg-[#0b0e18] rounded-xl flex items-center justify-between gap-1 border border-white/5">
          {waveformLevels.map((lvl, idx) => (
            <div
              key={idx}
              className="flex-1 bg-gradient-to-t from-[#ffd371] to-[#ffb871] rounded-full transition-all duration-150"
              style={{ height: `${lvl}%` }}
            />
          ))}
        </div>

        {/* Probed Challenge Narrative */}
        <div className="p-5 rounded-xl bg-[#191b26] border border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[#ffd371] font-bold">
            <span>CHALLENGE VECTOR // CONCURRENT REPLICATION</span>
          </div>
          <p className="font-headline text-base text-white leading-relaxed font-semibold">
            “Your partitioned log relies on Raft for metadata orchestration. How does your consensus layer handle sustained asymmetric network partitions where the leader receives client heartbeats but cannot commit quorum entries to the majority storage ring?”
          </p>
        </div>
      </div>

      {/* 3. Real-time Candidate Audio Ingress & Transcribe HUD */}
      <div className="rounded-2xl bg-[#11131d] border border-white/10 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsRecording(!isRecording)}
              className={`p-3 rounded-full transition-all cursor-pointer shadow-md ${
                isRecording
                  ? 'bg-[#ffd371] text-[#3f2e00] shadow-[0_0_20px_rgba(255,211,113,0.5)] animate-pulse'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isRecording ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <div>
              <div className="font-mono text-xs font-bold text-white">
                {isRecording ? 'STREAMING VOCAL INGRESS...' : 'MIC MUTED'}
              </div>
              <div className="font-mono text-[10px] text-[#d3c5ac]">128 WPM PACING</div>
            </div>
          </div>

          <span className="font-mono text-xs text-[#ffd371]">CONFIDENCE: 92.4%</span>
        </div>

        {/* Transcribe Text Input */}
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={4}
          className="w-full bg-[#080a12] border border-white/10 rounded-xl p-4 font-mono text-xs text-[#e1e1f1] focus:outline-none focus:border-[#ffd371] transition-colors leading-relaxed"
          placeholder="Speak into microphone or edit defense transcript..."
        />

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTranscript('')}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-white/70 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-white/70 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Request Clarification</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSubmitResponse}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-[#ffd371] hover:bg-[#edb40b] text-[#3f2e00] font-mono text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(255,211,113,0.35)] transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 fill-current" />
            <span>{isSubmitting ? 'ANALYZING DEFENSE...' : 'Submit Defense Vector'}</span>
          </button>
        </div>

        {/* Evaluation Feedback */}
        {feedback && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-400 flex items-start gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* 4. Real-time Telemetry Rubric Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#191b26] border border-white/5 space-y-1.5">
          <div className="flex justify-between text-xs font-mono text-[#d3c5ac]">
            <span>Distributed Depth</span>
            <span className="text-[#ffd371] font-bold">92%</span>
          </div>
          <div className="w-full bg-[#323440] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#ffd371] h-full w-[92%]" />
          </div>
          <div className="text-[10px] font-mono text-white/50 pt-1">Monotonic Leases verified</div>
        </div>

        <div className="p-4 rounded-xl bg-[#191b26] border border-white/5 space-y-1.5">
          <div className="flex justify-between text-xs font-mono text-[#d3c5ac]">
            <span>Adversarial Defense Stability</span>
            <span className="text-[#ffd371] font-bold">88%</span>
          </div>
          <div className="w-full bg-[#323440] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#ffd371] h-full w-[88%]" />
          </div>
          <div className="text-[10px] font-mono text-white/50 pt-1">Zero panic under partition probe</div>
        </div>

        <div className="p-4 rounded-xl bg-[#191b26] border border-white/5 space-y-1.5">
          <div className="flex justify-between text-xs font-mono text-[#d3c5ac]">
            <span>Articulation & Pacing</span>
            <span className="text-emerald-400 font-bold">94%</span>
          </div>
          <div className="w-full bg-[#323440] h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full w-[94%]" />
          </div>
          <div className="text-[10px] font-mono text-white/50 pt-1">Optimal 128 WPM cadence</div>
        </div>
      </div>
    </div>
  );
};
