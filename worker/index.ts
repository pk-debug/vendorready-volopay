/**
 * VendorReady — a small B2B onboarding product with zero model/API calls.
 * Claude connects as an external MCP client and pays for its own inference.
 */
import { McpServer } from '@modelcontextprotocol/server';
import { createMcpHandler } from 'agents/mcp/server';
import { z } from 'zod';
import { calculateProgress, isValidISODate, safeText, validEmail } from './domain.mjs';

interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  DEMO_PASSWORD: string;
  SESSION_SECRET: string;
  MCP_API_KEY: string;
}

type SupplierRow = {
  id: string; workspace_id: string; name: string; contact_email: string | null;
  due_date: string; notes: string; created_at: string; updated_at: string;
  total?: number; complete?: number;
};
type ChecklistRow = { id: string; supplier_id: string; title: string; is_completed: number; sort_order: number; updated_at: string };

const WORKSPACE = 'demo'; // Intentional single isolated demo workspace, not production multi-tenancy.
const USERNAME = 'demo@vendorready.app';
const SESSION_COOKIE = 'vendorready_session';
const MAX_BODY = 32_768;
const SESSION_DURATION_SECONDS = 12 * 60 * 60;

function json(body: unknown, status = 200, additionalHeaders: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      ...additionalHeaders
    }
  });
}
function fail(message: string, status = 400): Response { return json({ error: message }, status); }

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const n of bytes) binary += String.fromCharCode(n);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromBase64Url(encoded: string): Uint8Array {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - padded.length % 4) % 4));
  return Uint8Array.from(binary, ch => ch.charCodeAt(0));
}
async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return toBase64Url(new Uint8Array(signature));
}
function equalString(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}
async function makeCookie(secret: string): Promise<string> {
  const payload = `${WORKSPACE}:${Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS}`;
  return `${SESSION_COOKIE}=${payload}.${await sign(payload, secret)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DURATION_SECONDS}`;
}
async function isAuthenticated(request: Request, env: Env): Promise<boolean> {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 24) return false;
  const raw = (request.headers.get('Cookie') ?? '').split(';').map(x => x.trim()).find(x => x.startsWith(`${SESSION_COOKIE}=`));
  if (!raw) return false;
  const token = raw.slice(`${SESSION_COOKIE}=`.length);
  const dot = token.lastIndexOf('.');
  if (dot < 0) return false;
  const payload = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const parts = payload.split(':');
  if (parts.length !== 2 || parts[0] !== WORKSPACE || !/^\d+$/.test(parts[1]) || Number(parts[1]) < Date.now() / 1000) return false;
  return equalString(mac, await sign(payload, env.SESSION_SECRET));
}
function mcpAuthorized(request: Request, env: Env): boolean {
  if (!env.MCP_API_KEY || env.MCP_API_KEY.length < 24) return false;
  const header = request.headers.get('X-VendorReady-Key') ?? request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  return equalString(header, env.MCP_API_KEY);
}
async function readJson(request: Request): Promise<unknown> {
  const text = await request.text();
  if (text.length > MAX_BODY) throw new Error('Request is too large (32 KB maximum).');
  try { return JSON.parse(text); } catch { throw new Error('Request body must be valid JSON.'); }
}
function inputObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected a JSON object.');
  return value as Record<string, unknown>;
}
function titleFrom(value: unknown): string {
  const name = safeText(value, 120);
  if (!name || name.length < 2) throw new Error('Supplier name must contain 2–120 characters.');
  return name;
}
function dateFrom(value: unknown): string {
  if (!isValidISODate(value)) throw new Error('Due date must be a real date in YYYY-MM-DD format.');
  return value as string;
}
function optionalEmail(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (!validEmail(value)) throw new Error('Contact email is not valid.');
  return String(value);
}
function checklistTitle(value: unknown): string {
  const title = safeText(value, 180);
  if (!title || title.length < 2) throw new Error('Checklist item title must have at least two characters.');
  return title;
}

async function getSupplier(env: Env, id: string) {
  const supplier = await env.DB.prepare('SELECT * FROM suppliers WHERE id = ? AND workspace_id = ?').bind(id, WORKSPACE).first<SupplierRow>();
  if (!supplier) return null;
  const items = (await env.DB.prepare('SELECT id, supplier_id, title, is_completed, sort_order, updated_at FROM checklist_items WHERE supplier_id = ? ORDER BY sort_order, id').bind(id).all<ChecklistRow>()).results;
  return { ...supplier, checklist: items, progress: calculateProgress(items) };
}
async function listSuppliers(env: Env) {
  const rows = (await env.DB.prepare(`
    SELECT s.id,s.name,s.contact_email,s.due_date,s.notes,s.created_at,s.updated_at,
      COUNT(c.id) AS total, COALESCE(SUM(c.is_completed),0) AS complete
    FROM suppliers s LEFT JOIN checklist_items c ON c.supplier_id=s.id
    WHERE s.workspace_id=? GROUP BY s.id ORDER BY s.created_at DESC LIMIT 100
  `).bind(WORKSPACE).all<SupplierRow>()).results;
  return rows.map(row => ({ ...row, progress: {
    total: Number(row.total ?? 0), complete: Number(row.complete ?? 0),
    percent: row.total ? Math.round(100 * Number(row.complete ?? 0) / Number(row.total)) : 0,
    status: row.total && row.complete === row.total ? 'ready' : Number(row.complete) ? 'in_progress' : 'not_started'
  }}));
}

type CreateInput = {
  supplier_name: string; due_date: string; requirements: string[];
  contact_email?: string; notes?: string; idempotency_key?: string;
};
async function createSupplier(env: Env, value: CreateInput): Promise<{ created: boolean; supplier: Awaited<ReturnType<typeof getSupplier>> }> {
  const name = titleFrom(value.supplier_name);
  const due = dateFrom(value.due_date);
  const email = optionalEmail(value.contact_email);
  const notes = safeText(value.notes, 1500);
  if (!Array.isArray(value.requirements) || value.requirements.length < 1 || value.requirements.length > 20) {
    throw new Error('Enter 1–20 checklist requirements.');
  }
  const requirements = value.requirements.map(checklistTitle);
  const key = value.idempotency_key ? safeText(value.idempotency_key, 100) : null;
  if (key) {
    const existing = await env.DB.prepare('SELECT id FROM suppliers WHERE workspace_id=? AND request_key=?').bind(WORKSPACE, key).first<{id:string}>();
    if (existing) return { created: false, supplier: await getSupplier(env, existing.id) };
  }
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  // D1 batch executes atomically: supplier + all checklist items, or nothing.
  const statements = [env.DB.prepare('INSERT INTO suppliers(id,workspace_id,name,contact_email,due_date,notes,request_key,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)')
    .bind(id, WORKSPACE, name, email, due, notes, key, now, now)];
  for (let index = 0; index < requirements.length; index++) {
    statements.push(env.DB.prepare('INSERT INTO checklist_items(id,supplier_id,title,is_completed,sort_order,updated_at) VALUES(?,?,?,0,?,?)')
      .bind(crypto.randomUUID(), id, requirements[index], index, now));
  }
  try { await env.DB.batch(statements); }
  catch (error) {
    if (key) {
      const existing = await env.DB.prepare('SELECT id FROM suppliers WHERE workspace_id=? AND request_key=?').bind(WORKSPACE, key).first<{id:string}>();
      if (existing) return { created: false, supplier: await getSupplier(env, existing.id) };
    }
    console.error('Failed supplier creation', error);
    throw new Error('Could not save onboarding. Please try again.');
  }
  console.log(`created_supplier id=${id} requirements=${requirements.length}`);
  return { created: true, supplier: await getSupplier(env, id) };
}

function mcpResult(payload: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(payload) }] };
}
function mcpError(error: unknown) {
  return { isError: true, content: [{ type: 'text' as const, text: error instanceof Error ? error.message : 'Unexpected server error.' }] };
}
function buildMcpServer(env: Env): McpServer {
  const server = new McpServer({ name: 'VendorReady', version: '1.0.0' });
  server.registerTool('create_vendor_onboarding', {
    description: 'Create a live editable supplier onboarding workspace in VendorReady. The user can open the returned URL and update the saved checklist. Never invent tax or banking verification results.',
    inputSchema: {
      supplier_name: z.string().min(2).max(120),
      due_date: z.string().describe('Due date YYYY-MM-DD'),
      requirements: z.array(z.string().min(2).max(180)).min(1).max(20),
      contact_email: z.string().email().optional(),
      notes: z.string().max(1500).optional(),
      idempotency_key: z.string().min(6).max(100).optional().describe('Stable client-generated key to prevent duplicate creation on retries')
    }
  }, async args => {
    try {
      const outcome = await createSupplier(env, args);
      return mcpResult({ success: true, created: outcome.created, supplier_id: outcome.supplier?.id,
        supplier_name: outcome.supplier?.name, checklist_items: outcome.supplier?.checklist.length,
        message: 'Saved in VendorReady. Open the app to see and edit the supplier.' });
    } catch (error) { return mcpError(error); }
  });
  server.registerTool('get_vendor_onboarding', {
    description: 'Retrieve the most recently saved and human-edited supplier checklist from VendorReady by its ID.',
    inputSchema: { supplier_id: z.string().uuid() }
  }, async ({ supplier_id }) => {
    try {
      const record = await getSupplier(env, supplier_id);
      return record ? mcpResult(record) : mcpError(new Error('Supplier not found.'));
    } catch (error) { return mcpError(error); }
  });
  server.registerTool('list_vendor_onboardings', {
    description: 'List up to 100 suppliers in this VendorReady demo workspace and their checklist completion status.',
    inputSchema: {}
  }, async () => {
    try { return mcpResult(await listSuppliers(env)); }
    catch (error) { return mcpError(error); }
  });
  return server;
}

async function handleApi(request: Request, env: Env, pathname: string): Promise<Response> {
  const method = request.method;
  if (pathname === '/api/health' && method === 'GET') {
    return json({ name: 'VendorReady', ok: true, ai_inside_app: false, time: new Date().toISOString() });
  }
  if (!env.DB || !env.DEMO_PASSWORD || !env.SESSION_SECRET || env.SESSION_SECRET.length < 24) {
    return fail('Server setup incomplete: configure D1 and secrets.', 503);
  }
  if (pathname === '/api/login' && method === 'POST') {
    const body = inputObject(await readJson(request));
    if (body.username !== USERNAME || typeof body.password !== 'string' || !equalString(body.password, env.DEMO_PASSWORD)) {
      return fail('Incorrect email or password.', 401);
    }
    return json({ authenticated: true, username: USERNAME }, 200, { 'Set-Cookie': await makeCookie(env.SESSION_SECRET) });
  }
  if (pathname === '/api/session' && method === 'GET') {
    return json({ authenticated: await isAuthenticated(request, env), username: USERNAME });
  }
  if (pathname === '/api/logout' && method === 'POST') {
    return json({ authenticated: false }, 200, { 'Set-Cookie': `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` });
  }
  if (!(await isAuthenticated(request, env))) return fail('Please sign in to access this workspace.', 401);
  if (method !== 'GET') {
    const origin = request.headers.get('Origin');
    if (origin && origin !== new URL(request.url).origin) return fail('Cross-origin updates are not allowed.', 403);
  }
  if (pathname === '/api/suppliers' && method === 'GET') return json({ suppliers: await listSuppliers(env) });
  if (pathname === '/api/suppliers' && method === 'POST') return fail('Create onboarding through Claude MCP to demonstrate the assignment workflow.', 405);
  const supplierMatch = pathname.match(/^\/api\/suppliers\/([a-fA-F0-9-]{36})$/);
  if (supplierMatch && method === 'GET') {
    const supplier = await getSupplier(env, supplierMatch[1]);
    return supplier ? json({ supplier }) : fail('Supplier not found.', 404);
  }
  if (supplierMatch && method === 'PATCH') {
    const existing = await getSupplier(env, supplierMatch[1]);
    if (!existing) return fail('Supplier not found.', 404);
    const body = inputObject(await readJson(request));
    const name = titleFrom(body.name);
    const due = dateFrom(body.due_date);
    const email = optionalEmail(body.contact_email);
    const notes = safeText(body.notes, 1500);
    await env.DB.prepare('UPDATE suppliers SET name=?,due_date=?,contact_email=?,notes=?,updated_at=? WHERE id=? AND workspace_id=?')
      .bind(name, due, email, notes, new Date().toISOString(), existing.id, WORKSPACE).run();
    return json({ supplier: await getSupplier(env, existing.id) });
  }
  const checklistCreateMatch = pathname.match(/^\/api\/suppliers\/([a-fA-F0-9-]{36})\/items$/);
  if (checklistCreateMatch && method === 'POST') {
    const supplier = await getSupplier(env, checklistCreateMatch[1]);
    if (!supplier) return fail('Supplier not found.', 404);
    if (supplier.checklist.length >= 20) return fail('Maximum 20 checklist items.', 400);
    const body = inputObject(await readJson(request));
    const title = checklistTitle(body.title);
    const now = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare('INSERT INTO checklist_items(id,supplier_id,title,is_completed,sort_order,updated_at) VALUES(?,?,?,0,?,?)')
        .bind(crypto.randomUUID(), supplier.id, title, supplier.checklist.length, now),
      env.DB.prepare('UPDATE suppliers SET updated_at=? WHERE id=? AND workspace_id=?').bind(now, supplier.id, WORKSPACE)
    ]);
    return json({ supplier: await getSupplier(env, supplier.id) }, 201);
  }
  const itemMatch = pathname.match(/^\/api\/checklist-items\/([a-fA-F0-9-]{36})$/);
  if (itemMatch && (method === 'PATCH' || method === 'DELETE')) {
    const row = await env.DB.prepare('SELECT c.* FROM checklist_items c JOIN suppliers s ON s.id=c.supplier_id WHERE c.id=? AND s.workspace_id=?')
      .bind(itemMatch[1], WORKSPACE).first<ChecklistRow>();
    if (!row) return fail('Checklist item not found.', 404);
    if (method === 'DELETE') {
      const now = new Date().toISOString();
      await env.DB.batch([env.DB.prepare('DELETE FROM checklist_items WHERE id=?').bind(row.id),
        env.DB.prepare('UPDATE suppliers SET updated_at=? WHERE id=? AND workspace_id=?').bind(now, row.supplier_id, WORKSPACE)]);
      return json({ supplier: await getSupplier(env, row.supplier_id) });
    }
    const body = inputObject(await readJson(request));
    const title = checklistTitle(body.title);
    if (typeof body.is_completed !== 'boolean') return fail('is_completed must be true or false.');
    const now = new Date().toISOString();
    await env.DB.batch([
      env.DB.prepare('UPDATE checklist_items SET title=?,is_completed=?,updated_at=? WHERE id=?')
        .bind(title, body.is_completed ? 1 : 0, now, row.id),
      env.DB.prepare('UPDATE suppliers SET updated_at=? WHERE id=? AND workspace_id=?')
        .bind(now, row.supplier_id, WORKSPACE)
    ]);
    return json({ supplier: await getSupplier(env, row.supplier_id) });
  }
  return fail('Endpoint not found.', 404);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/mcp' || url.pathname === '/mcp/') {
        if (!mcpAuthorized(request, env)) return fail('MCP access key required.', 401);
        if (request.method !== 'GET' && request.method !== 'POST' && request.method !== 'DELETE') return fail('Unsupported method.', 405);
        return createMcpHandler(() => buildMcpServer(env))(request, env, ctx);
      }
      if (url.pathname.startsWith('/api/')) return await handleApi(request, env, url.pathname);
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error('VendorReady request failed:', error);
      if (error instanceof Error && (/^(Request body|Expected a JSON|Supplier name|Due date|Contact email|Checklist item title)/.test(error.message))) return fail(error.message, 400);
      return fail('Something went wrong. Please try again.', 500);
    }
  }
} satisfies ExportedHandler<Env>;
