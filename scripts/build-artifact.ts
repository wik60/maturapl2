/**
 * Single-file build for publishing as a hosted artifact (one HTML page, JS and CSS inlined).
 *   bun scripts/build-artifact.ts → dist-artifact/index.html
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const out = join(root, 'dist-artifact');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const r = await Bun.build({
  entrypoints: [join(root, 'src/main.tsx')],
  outdir: join(out, 'tmp'),
  target: 'browser',
  format: 'esm',
  splitting: false,
  minify: true,
  define: {
    'process.env.NODE_ENV': '"production"',
    __SUPABASE_URL__: JSON.stringify(process.env.SUPABASE_URL ?? ''),
    __SUPABASE_ANON_KEY__: JSON.stringify(process.env.SUPABASE_ANON_KEY ?? ''),
  },
});
if (!r.success) { for (const l of r.logs) console.error(l); process.exit(1); }
const js = readFileSync(r.outputs.find((o) => o.path.endsWith('.js'))!.path, 'utf8').replace(/<\/script/gi, '<\\/script');
const css = readFileSync(r.outputs.find((o) => o.path.endsWith('.css'))!.path, 'utf8');
const icon = `data:image/svg+xml;base64,${Buffer.from(readFileSync(join(root, 'public/icons/icon.svg'))).toString('base64')}`;

const html = `<title>Matura Quest</title>
<meta name="description" content="Gra do nauki matury podstawowej z angielskiego.">
<meta name="theme-color" content="#2340c8">
<link rel="icon" href="${icon}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&display=swap">
<style>${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`;
writeFileSync(join(out, 'index.html'), html);
rmSync(join(out, 'tmp'), { recursive: true, force: true });
console.log(`dist-artifact/index.html ${(html.length / 1024).toFixed(0)} KB`);
