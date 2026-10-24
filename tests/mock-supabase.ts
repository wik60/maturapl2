/**
 * In-memory imitation of the Supabase endpoints Matura Quest uses:
 * GoTrue (signup, password + refresh token, logout, recover) and PostgREST
 * (select on user_progress filtered by the caller, rpc/save_progress with the
 * same compare-and-set semantics as supabase/migrations/0001_user_progress.sql).
 * It does NOT emulate Postgres or RLS itself – those must be checked on a real project.
 *
 *   bun tests/mock-supabase.ts          (port 54321, or PORT=...)
 */

interface User { id: string; email: string; password: string; confirmed: boolean }
interface Row { state: unknown; revision: number; updated_at: string; device_id: string | null }

export function startMockSupabase(port = 54321, opts: { requireConfirm?: boolean } = {}) {
  const users = new Map<string, User>();
  const tokens = new Map<string, string>(); // access token -> user id
  const refresh = new Map<string, string>(); // refresh token -> user id
  const rows = new Map<string, Row>();
  let n = 0;
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'apikey, authorization, content-type, prefer',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
  const json = (status: number, body: unknown) => new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors } });
  const session = (u: User) => {
    const at = `at-${u.id}-${++n}`;
    const rt = `rt-${u.id}-${n}`;
    tokens.set(at, u.id);
    refresh.set(rt, u.id);
    return { access_token: at, refresh_token: rt, expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: u.id, email: u.email } };
  };
  const caller = (req: Request) => tokens.get((req.headers.get('authorization') ?? '').replace('Bearer ', ''));

  const server = Bun.serve({
    port,
    async fetch(req) {
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
      if (!req.headers.get('apikey')) return json(401, { message: 'No API key found in request' });
      const url = new URL(req.url);
      const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};

      if (url.pathname === '/auth/v1/signup') {
        if ([...users.values()].some((u) => u.email === body.email)) return json(422, { code: 422, error_code: 'user_already_exists', msg: 'User already registered' });
        if (!body.password || body.password.length < 6) return json(422, { error_code: 'weak_password', msg: 'Password should be at least 6 characters.' });
        const u: User = { id: crypto.randomUUID(), email: body.email, password: body.password, confirmed: !opts.requireConfirm };
        users.set(u.id, u);
        return opts.requireConfirm ? json(200, { id: u.id, email: u.email, identities: [{}] }) : json(200, session(u));
      }
      if (url.pathname === '/auth/v1/token') {
        const grant = url.searchParams.get('grant_type');
        if (grant === 'password') {
          const u = [...users.values()].find((x) => x.email === body.email && x.password === body.password);
          if (!u) return json(400, { error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
          if (!u.confirmed) return json(400, { error_code: 'email_not_confirmed', msg: 'Email not confirmed' });
          return json(200, session(u));
        }
        if (grant === 'refresh_token') {
          const id = refresh.get(body.refresh_token);
          if (!id) return json(400, { error_code: 'refresh_token_not_found' });
          refresh.delete(body.refresh_token);
          return json(200, session(users.get(id)!));
        }
      }
      if (url.pathname === '/auth/v1/logout') return new Response(null, { status: 204, headers: cors });
      if (url.pathname === '/auth/v1/recover') return json(200, {});

      if (url.pathname === '/rest/v1/user_progress' && req.method === 'GET') {
        const uid = caller(req);
        if (!uid) return json(401, { message: 'JWT expired' });
        const want = (url.searchParams.get('user_id') ?? '').replace('eq.', '');
        const row = want === uid ? rows.get(uid) : undefined; // emulates the RLS select policy
        return json(200, row ? [row] : []);
      }
      if (url.pathname === '/rest/v1/rpc/save_progress' && req.method === 'POST') {
        const uid = caller(req);
        if (!uid) return json(401, { message: 'JWT expired' });
        const cur = rows.get(uid);
        const expected = Number(body.p_expected_revision);
        if ((!cur && expected !== 0) || (cur && cur.revision !== expected)) return json(400, { code: 'P0001', message: 'conflict' });
        const next: Row = { state: body.p_state, revision: (cur?.revision ?? 0) + 1, updated_at: new Date().toISOString(), device_id: body.p_device ?? null };
        rows.set(uid, next);
        return json(200, [{ revision: next.revision, updated_at: next.updated_at }]);
      }
      return json(404, { code: 'PGRST205', message: 'not found' });
    },
  });
  return { server, users, rows, stop: () => server.stop(true), url: `http://localhost:${server.port}` };
}

if (import.meta.main) {
  const m = startMockSupabase(Number(process.env.PORT ?? 54321), { requireConfirm: !!process.env.REQUIRE_CONFIRM });
  console.log(`Mock Supabase on ${m.url}`);
}
