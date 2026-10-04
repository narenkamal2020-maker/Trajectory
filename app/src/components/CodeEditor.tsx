import { useEffect, useLayoutEffect, useRef } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { sql } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { indentWithTab } from '@codemirror/commands';
import type { Language } from '../lib/types';

const langExt = (l: Language) => (l === 'python' ? python() : l === 'sql' ? sql() : javascript());

const theme = EditorView.theme({
  '&': { height: '100%', fontSize: '13px', backgroundColor: '#0b0e18' },
  '.cm-scroller': { fontFamily: "'JetBrains Mono', monospace" },
  '.cm-gutters': { backgroundColor: '#0b0e18', borderRight: '1px solid rgba(255,255,255,0.06)' },
  '&.cm-focused .cm-cursor': { borderLeftColor: '#ffd371' },
});

export function CodeEditor({ value, language, onChange, onRun, ariaLabel = 'Code editor' }: {
  value: string; language: Language; onChange: (v: string) => void; onRun?: () => void; ariaLabel?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const lang = useRef(new Compartment());
  const cb = useRef({ onChange, onRun });
  useLayoutEffect(() => { cb.current = { onChange, onRun }; });

  useEffect(() => {
    if (!host.current) return;
    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          keymap.of([indentWithTab, { key: 'Mod-Enter', run: () => { cb.current.onRun?.(); return true; } }]),
          lang.current.of(langExt(language)),
          oneDark,
          theme,
          EditorView.updateListener.of((u) => { if (u.docChanged) cb.current.onChange(u.state.doc.toString()); }),
          EditorView.contentAttributes.of({ 'aria-label': ariaLabel }),
        ],
      }),
    });
    view.current = v;
    return () => v.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    view.current?.dispatch({ effects: lang.current.reconfigure(langExt(language)) });
  }, [language]);

  // External value changes (language switch, reset) replace the document.
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
  }, [value]);

  return <div ref={host} className="h-full min-h-[280px] overflow-hidden rounded-xl border border-white/10" />;
}
