const P: Record<string, string> = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10',
  map: 'M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Zm0 0v13m6-10.5v13',
  practice: 'M5 4h11l3 3v13H5zM9 10h6M9 14h6M9 18h3',
  exam: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  me: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7.5 8.5c1-3.7 4-5.5 7.5-5.5s6.5 1.8 7.5 5.5',
  play: 'M8 5.5v13l11-6.5z',
  stop: 'M7 7h10v10H7z',
  check: 'M5 12.5 10 17l9-10',
  cross: 'M6 6l12 12M18 6 6 18',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9h-13z',
  star: 'm12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8-4.3-4.1 5.9-.8z',
  flame: 'M12 21c-4 0-6.5-2.7-6.5-6.2C5.5 10 10 8 9.5 3c3.5 2 5.2 5 5 8 1-.6 1.7-1.6 2-3 1.5 1.6 2 3.6 2 5.8 0 4-3 7.2-6.5 7.2Z',
  speaker: 'M4 9.5h3.5L12 6v12l-4.5-3.5H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11',
  back: 'M15 5l-7 7 7 7',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20',
  pen: 'M4 20l4-1 11-11-3-3L5 16zM14 6l3 3',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  cloud: 'M7 18.5h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.1 4.75 4.75 0 0 0 7 18.5Z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-11v6m0-9h.01',
};

export function Icon({ name, size = 24, label }: { name: keyof typeof P | string; size?: number; label?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label}>
      <path d={P[name] ?? P.info} />
    </svg>
  );
}

/** Logo: an answer-card bubble with a ballpoint tick. */
export function Mark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="13" fill="none" stroke="var(--ink)" strokeWidth="3" />
      <path d="M9.5 16.5l4.5 4.5 9-10" fill="none" stroke="var(--ink)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
