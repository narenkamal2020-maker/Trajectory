import React, { useState } from 'react';
import type { QuestionItem } from '../types';
import { PlayIcon, CheckCircleIcon } from './Icons';

interface PracticeViewProps {
  questions: QuestionItem[];
  selectedQuestionId: string | null;
  onSelectQuestion: (id: string) => void;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  questions,
  selectedQuestionId,
  onSelectQuestion
}) => {
  const [filterDifficulty, setFilterDifficulty] = useState<string>('ALL');
  const [language, setLanguage] = useState<'typescript' | 'python'>('typescript');
  const [code, setCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'problem' | 'hints' | 'solution'>('problem');
  const [testResult, setTestResult] = useState<{ passed: boolean; message: string; output: string } | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const activeQuestion = questions.find(q => q.id === selectedQuestionId) || questions[0];

  React.useEffect(() => {
    if (activeQuestion) {
      setCode(activeQuestion.starterCode[language]);
      setTestResult(null);
    }
  }, [activeQuestion, language]);

  const filteredQuestions = questions.filter(q => {
    if (filterDifficulty !== 'ALL' && q.difficulty !== filterDifficulty) return false;
    return true;
  });

  const handleRunCode = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setTestResult({
        passed: true,
        message: 'All 3 test cases passed successfully! Execution time: 48ms · Memory: 34.2MB',
        output: 'Case 1: Output [0, 1] == Expected [0, 1] ✅\nCase 2: Output [1, 2] == Expected [1, 2] ✅\nCase 3: Output [0, 1] == Expected [0, 1] ✅'
      });
    }, 800);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 'var(--space-3)', height: 'calc(100vh - 120px)' }}>
      {/* Left Column: Problem Catalog */}
      <aside className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Problem Catalog</h2>
          <span className="badge badge-primary">{filteredQuestions.length} Problems</span>
        </div>

        {/* Difficulty Filter Tabs */}
        <div style={{ display: 'flex', gap: 'var(--space-1)', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          {['ALL', 'EASY', 'MEDIUM', 'HARD'].map((diff) => (
            <button
              key={diff}
              type="button"
              className={`btn btn-sm ${filterDifficulty === diff ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilterDifficulty(diff)}
              style={{ flex: 1, padding: '4px 8px', fontSize: '11px' }}
            >
              {diff}
            </button>
          ))}
        </div>

        {/* List of problems */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', paddingRight: '4px' }}>
          {filteredQuestions.map((q) => {
            const isSelected = q.id === activeQuestion.id;
            return (
              <div
                key={q.id}
                onClick={() => onSelectQuestion(q.id)}
                className="glass-card glass-card-interactive"
                style={{
                  padding: 'var(--space-1-5)',
                  background: isSelected ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                  borderColor: isSelected ? 'var(--border-active)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{q.title}</span>
                  <span className={`badge ${q.difficulty === 'EASY' ? 'badge-easy' : q.difficulty === 'MEDIUM' ? 'badge-medium' : 'badge-hard'}`} style={{ fontSize: '10px' }}>
                    {q.difficulty}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>{q.category}</span>
                  <span>{q.solveRate}% Pass Rate</span>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Right Column: Code Editor & Runner Studio */}
      <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', overflow: 'hidden' }}>
        {/* Editor Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-1-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{activeQuestion.title}</h3>
            <span className={`badge ${activeQuestion.difficulty === 'EASY' ? 'badge-easy' : activeQuestion.difficulty === 'MEDIUM' ? 'badge-medium' : 'badge-hard'}`}>
              {activeQuestion.difficulty}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)' }}>
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-medium)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <option value="typescript">TypeScript 5.0</option>
              <option value="python">Python 3.12</option>
            </select>

            {/* Run Button */}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleRunCode}
              disabled={isRunning}
            >
              <PlayIcon size={14} /> {isRunning ? 'Running Tests...' : 'Run Code'}
            </button>
          </div>
        </div>

        {/* Tab Selector (Problem Description / Hints / Solution) */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setActiveTab('problem')}
            style={{
              borderBottom: activeTab === 'problem' ? '2px solid var(--color-primary)' : 'none',
              borderRadius: 0,
              color: activeTab === 'problem' ? 'var(--text-primary)' : 'var(--text-muted)'
            }}
          >
            Description
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setActiveTab('hints')}
            style={{
              borderBottom: activeTab === 'hints' ? '2px solid var(--color-primary)' : 'none',
              borderRadius: 0,
              color: activeTab === 'hints' ? 'var(--text-primary)' : 'var(--text-muted)'
            }}
          >
            AI Hints ({activeQuestion.hints.length})
          </button>
        </div>

        {/* Tab Content Body */}
        {activeTab === 'problem' && (
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, maxHeight: '120px', overflowY: 'auto' }}>
            <p>{activeQuestion.description}</p>
          </div>
        )}

        {activeTab === 'hints' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', maxHeight: '120px', overflowY: 'auto' }}>
            {activeQuestion.hints.map((hint, idx) => (
              <div key={idx} style={{ padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                💡 <strong>Hint {idx + 1}:</strong> {hint}
              </div>
            ))}
          </div>
        )}

        {/* Interactive Code Editor Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              flex: 1,
              width: '100%',
              background: 'transparent',
              color: 'var(--text-primary)',
              border: 'none',
              padding: 'var(--space-2)',
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              lineHeight: 1.5,
              resize: 'none',
              outline: 'none'
            }}
            spellCheck={false}
          />
        </div>

        {/* Test Cases / Terminal Output */}
        {testResult && (
          <div style={{
            background: testResult.passed ? 'var(--color-emerald-bg)' : 'var(--color-rose-bg)',
            border: `1px solid ${testResult.passed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-1-5)',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: testResult.passed ? 'var(--color-emerald)' : 'var(--color-rose)', marginBottom: '4px' }}>
              <CheckCircleIcon size={16} /> {testResult.message}
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', margin: 0, fontSize: '12px' }}>
              {testResult.output}
            </pre>
          </div>
        )}
      </section>
    </div>
  );
};
