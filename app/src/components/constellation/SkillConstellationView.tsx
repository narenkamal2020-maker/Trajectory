import React, { useState, useEffect } from 'react';
import { api, type SkillNode } from '../../services/api';
import { Sliders, ArrowRight } from 'lucide-react';

interface SkillConstellationViewProps {
  onNavigate?: (route: string) => void;
}

export const SkillConstellationView: React.FC<SkillConstellationViewProps> = ({ onNavigate }) => {
  const [skills, setSkills] = useState<SkillNode[]>([]);
  const [activeNode, setActiveNode] = useState<SkillNode | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [hoveredNode, setHoveredNode] = useState<SkillNode | null>(null);

  useEffect(() => {
    async function load() {
      const data = await api.getSkillConstellation();
      setSkills(data);
      if (data.length > 1) setActiveNode(data[1]);
    }
    load();
  }, []);

  const displayedNode = hoveredNode || activeNode;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs text-[#ffd371] tracking-widest uppercase font-bold">
            TOPOLOGY MAP // LIVE BAYESIAN SYNC
          </span>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold text-white mt-1">
            Spatial Skill Constellation
          </h1>
        </div>

        {/* Category Filters */}
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
              onClick={() => setFilter(cat.id)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filter === cat.id
                  ? 'bg-[#ffd371] text-[#3f2e00] font-bold shadow-[0_0_10px_rgba(255,211,113,0.3)]'
                  : 'text-[#d3c5ac] hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Constellation Canvas Panel */}
      <div className="rounded-2xl bg-[#11131d] border border-white/10 p-6 shadow-2xl relative space-y-6">
        {/* Telemetry Status Strip */}
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

        {/* Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {skills
            .filter((s) => filter === 'all' || s.category === filter)
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
                  className={`p-5 rounded-2xl cursor-pointer transition-all duration-300 relative border flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#1d1f2a] border-[#ffd371] shadow-[0_0_24px_rgba(237,180,11,0.25)] scale-[1.02]'
                      : isDelta
                      ? 'bg-[#191b26] border-[#ffb871]/40 hover:border-[#ffd371]/80'
                      : 'bg-[#191b26] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono">
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

                    <h3 className="font-headline font-bold text-base text-white mt-2.5">{node.name}</h3>
                    <p className="text-xs text-[#d3c5ac] mt-1 line-clamp-2 leading-relaxed">{node.summary}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-[#d3c5ac]">
                    <span>PREREQ: {node.prerequisite}</span>
                    <span className="text-white font-semibold">{node.drillTime}</span>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Inspector Detail Bar */}
        {displayedNode && (
          <div className="p-5 rounded-xl bg-[#1d1f2a] border border-[#ffd371]/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-inner">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ffd371]/10 border border-[#ffd371]/30 flex items-center justify-center text-[#ffd371] flex-shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-white font-bold">
                    ACTIVE FOCUS: {displayedNode.code} // {displayedNode.name.toUpperCase()}
                  </span>
                  <span className="text-[#ffd371] bg-[#ffd371]/10 px-2 py-0.5 rounded text-[10px] font-bold">
                    {displayedNode.delta}
                  </span>
                </div>
                <p className="text-xs text-[#d3c5ac]">{displayedNode.summary}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate?.('practice')}
              className="px-5 py-2.5 rounded-xl bg-[#ffd371] hover:bg-[#edb40b] text-[#3f2e00] font-mono text-xs font-bold shadow-md transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer"
            >
              <span>Queue Drill Vector</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
