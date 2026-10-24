/**
 * Production build with Bun's bundler (no npm install required).
 *   bun scripts/build.ts            → dist/
 * Outputs hashed, code-split JS + CSS, copies public/, generates PNG icons and
 * injects the precache list into the service worker.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, process.env.OUT_DIR ?? 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const result = await Bun.build({
  entrypoints: [join(root, 'src/main.tsx')],
  outdir: join(dist, 'assets'),
  target: 'browser',
  format: 'esm',
  splitting: true,
  minify: true,
  sourcemap: 'none',
  naming: { entry: '[name]-[hash].[ext]', chunk: 'chunk-[hash].[ext]', asset: '[name]-[hash].[ext]' },
  define: {
    'process.env.NODE_ENV': '"production"',
    __SUPABASE_URL__: JSON.stringify(process.env.SUPABASE_URL ?? ''),
    __SUPABASE_ANON_KEY__: JSON.stringify(process.env.SUPABASE_ANON_KEY ?? ''),
  },
});
if (!result.success) {
  for (const l of result.logs) console.error(l);
  process.exit(1);
}

cpSync(join(root, 'public'), dist, { recursive: true });

// PNG icons from the SVG (sharp is available globally in this environment).
try {
  const sharpPath = '/home/claude/.npm-global/lib/node_modules/sharp';
  const sharp = (await import(existsSync(sharpPath) ? sharpPath : 'sharp')).default;
  const svg = readFileSync(join(root, 'public/icons/icon.svg'));
  for (const s of [192, 512]) await sharp(svg).resize(s, s).png().toFile(join(dist, `icons/icon-${s}.png`));
} catch (e) {
  console.warn('Icon PNG generation skipped:', (e as Error).message);
}

const outputs = result.outputs.map((o) => relative(dist, o.path));
const entry = outputs.find((p) => /main-.*\.js$/.test(p));
const css = outputs.filter((p) => p.endsWith('.css'));
let html = readFileSync(join(root, 'index.html'), 'utf8');
html = html
  .replace('<!--STYLES-->', css.map((c) => `<link rel="stylesheet" href="./${c}" />`).join('\n    '))
  .replace('<!--SCRIPTS-->', `<script type="module" src="./${entry}"></script>`);
writeFileSync(join(dist, 'index.html'), html);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const files = walk(dist).map((p) => `./${relative(dist, p)}`).filter((p) => p !== './sw.js' && !p.startsWith('./audio/'));
const version = Bun.hash(files.join('|') + outputs.join('|')).toString(36);
const sw = readFileSync(join(root, 'public/sw.js'), 'utf8')
  .replace("'__VERSION__'", JSON.stringify(version))
  .replace('__ASSETS__;', `${JSON.stringify(['./', ...files])};`);
if (sw.includes('__VERSION__') || sw.includes('__ASSETS__')) throw new Error('service worker placeholders not replaced');
writeFileSync(join(dist, 'sw.js'), sw);

const total = walk(dist).reduce((s, p) => s + statSync(p).size, 0);
console.log(`Built ${outputs.length} bundles, ${files.length + 1} files, ${(total / 1024).toFixed(0)} KB total → dist/`);
for (const o of result.outputs) console.log(`  ${relative(dist, o.path).padEnd(40)} ${(o.size / 1024).toFixed(1)} KB`);
