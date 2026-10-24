/** Minimal static server for dist/ (used for local preview and e2e tests). */
import { join } from 'node:path';

const dir = new URL(`../${process.env.DIR ?? 'dist'}`, import.meta.url).pathname;
const port = Number(process.env.PORT ?? 4173);
Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = Bun.file(join(dir, path));
    if (await file.exists()) return new Response(file);
    return new Response(Bun.file(join(dir, 'index.html')));
  },
});
console.log(`Serving dist/ on http://localhost:${port}`);
