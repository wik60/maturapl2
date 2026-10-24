import { useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';

/** Hash-based router: works on any static host (and inside a hosted artifact) without server rewrites. */
export interface Route {
  path: string;
  segments: string[];
  query: URLSearchParams;
}

function parse(): Route {
  const raw = (typeof location !== 'undefined' ? location.hash : '').replace(/^#/, '') || '/';
  const [p, q = ''] = raw.split('?');
  const path = p.startsWith('/') ? p : `/${p}`;
  return { path, segments: path.split('/').filter(Boolean), query: new URLSearchParams(q) };
}

let current = parse();
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    current = parse();
    listeners.forEach((l) => l());
    window.scrollTo({ top: 0 });
    // move focus to main content for screen-reader users after navigation
    requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true }));
  });
}

export function useRoute(): Route {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
  );
}

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  const hash = `#${to}`;
  if (opts.replace) {
    history.replaceState(null, '', hash);
    current = parse();
    listeners.forEach((l) => l());
  } else location.hash = to;
}

export function Link(props: { to: string; className?: string; children?: ReactNode; style?: CSSProperties; 'aria-current'?: string; onClick?: () => void; 'aria-label'?: string }) {
  const { to, children, ...rest } = props;
  return (
    <a href={`#${to}`} {...rest}>
      {children}
    </a>
  );
}
