import { useEffect, useState, useCallback } from 'react';

/**
 * Minimal hash router. Hash URLs work identically on the web, in Electron (file://) and in
 * Capacitor, so all three shells share one build.
 */
export function currentPath(): string {
  const h = window.location.hash.replace(/^#/, '');
  return h.startsWith('/') ? h : '/' + h;
}

export function navigate(path: string, replace = false) {
  const target = '#' + (path.startsWith('/') ? path : '/' + path);
  if (replace) window.history.replaceState(null, '', target);
  else window.location.hash = target;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

export function usePath(): string {
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const on = () => setPath(currentPath());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return path;
}

/** Match "/practice/:id" against a path; returns params or null. */
export function match(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split('/').filter(Boolean);
  const a = path.split('?')[0].split('/').filter(Boolean);
  if (p.length !== a.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(a[i]);
    else if (p[i] !== a[i]) return null;
  }
  return params;
}

export function useNavigate() {
  return useCallback((path: string) => navigate(path), []);
}

export function Link({ to, className, children, onClick, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  return (
    <a href={'#' + to} className={className} onClick={onClick} {...rest}>
      {children}
    </a>
  );
}
