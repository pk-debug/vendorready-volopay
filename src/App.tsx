import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

type Progress = { complete: number; total: number; percent: number; status: 'ready' | 'in_progress' | 'not_started' };
type SupplierListItem = {
  id: string; name: string; due_date: string; contact_email: string | null;
  notes: string; created_at: string; updated_at: string; progress: Progress;
};
type ChecklistItem = { id: string; title: string; is_completed: number; sort_order: number };
type Supplier = SupplierListItem & { checklist: ChecklistItem[] };
type Page = 'overview' | 'setup';

const PROMPT = `Create a supplier onboarding in VendorReady for ABC Industrial Services. Due date: November 20, 2026. Include these five checklist requirements: GST registration evidence, company PAN documentation, signed service agreement, company contact details and bank verification confirmation. Add a short note explaining that requirements are tracked but not independently verified. Use the VendorReady create_vendor_onboarding tool, then give me its saved supplier ID.`;

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      credentials: 'include',
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      result !== null &&
      typeof result === 'object' &&
      'error' in result &&
      typeof result.error === 'string'
        ? result.error
        : `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return result as T;
}

function SvgIcon({ name, size = 20 }: { name: 'grid' | 'layers' | 'plug' | 'logout' | 'check' | 'arrow' | 'plus' | 'copy' | 'search' | 'chevron' | 'shield' | 'refresh' | 'calendar' | 'briefcase' | 'spark' | 'menu' | 'close' | 'trash' | 'edit' | 'back' | 'external' | 'info'; size?: number }) {
  const paths: Record<string, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    layers: <><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/></>,
    plug: <><path d="M9 2v6m6-6v6M7 8h10v3a5 5 0 0 1-10 0V8Zm5 8v6"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    copy: <><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
    search: <><circle cx="10.8" cy="10.8" r="7"/><path d="m16 16 5 5"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    refresh: <><path d="M20 11a8 8 0 1 0-2 6"/><path d="M20 4v7h-7"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/></>,
    spark: <><path d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2L12 2Z"/></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
    close: <path d="M18 6 6 18M6 6l12 12"/>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6"/><path d="M10 10v7m4-7v7"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4Z"/></>,
    back: <path d="m15 18-6-6 6-6"/>,
    external: <><path d="M13 5h6v6m0-6-9 9"/><path d="M19 13v6H5V5h6"/></>,
    info: <><circle cx="12" cy="12" r="10"/><path d="M12 11v6m0-10h.01"/></>
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function prettyDate(value: string): string {
  if (!value) return 'No due date';
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
function Status({ progress }: { progress: Progress }) {
  const text = progress.status === 'ready' ? 'Checklist complete' : progress.status === 'in_progress' ? 'In progress' : 'Not started';
  return <span className={`status status-${progress.status}`}><i />{text}</span>;
}
function ProgressBar({ progress }: { progress: Progress }) {
  return <div className="progress-track"><div className="progress-fill" style={{ width: `${progress.percent}%` }} /></div>;
}
function Brand({ compact = false }: {compact?:boolean}) {
  return <div className="brand"><span className="brand-logo"><SvgIcon name="layers" size={22}/></span>{!compact && <span className="brand-word">vendor<span>ready</span><small>WORKSPACE</small></span>}</div>;
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('demo@vendorready.app');
  const [password, setPassword] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setWaiting(true);
    try { await api('/api/login', { method: 'POST', body: JSON.stringify({ username: email, password }) }); onSuccess(); }
    catch (e) { setError((e as Error).message); }
    finally { setWaiting(false); }
  };
  return <main className="login-layout"><section className="login-side"><Brand/><div className="login-pitch"><span className="eyebrow light">THE INTELLIGENCE IS YOURS. THE WORKFLOW IS OURS.</span><h1>From Claude conversations to <em>work that gets done.</em></h1><p>Organize supplier onboarding in one place. Claude creates the starting point, your team keeps everything moving.</p><div className="hero-steps"><div><span>01</span>Ask Claude to create an onboarding</div><div><span>02</span>See it instantly in your workspace</div><div><span>03</span>Review, edit and track every requirement</div></div></div><div className="login-side-bottom">BUILT FOR FINANCE & OPERATIONS TEAMS <span>•</span> CLAUDE + MCP</div></section><section className="login-main"><div className="login-form-shell"><div className="mobile-brand"><Brand/></div><span className="eyebrow">WELCOME TO VENDORREADY</span><h2>Your team workspace</h2><p className="muted">Sign in to explore the live supplier onboarding demo.</p><form onSubmit={submit} className="login-form"><label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="username" /></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" placeholder="Provided with your submission" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="btn btn-primary btn-wide" disabled={waiting}>{waiting ? 'Signing in…' : 'Enter workspace'} <SvgIcon name="arrow" size={17}/></button></form><p className="login-note"><SvgIcon name="shield" size={17}/> Demo uses fictional suppliers. Never upload real financial or identity documents.</p></div><div className="login-main-bottom">VendorReady is independent software. AI reasoning remains in your own Claude account.</div></section></main>;
}

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [page, setPage] = useState<Page>('overview');
  const [suppliers, setSuppliers] = useState<SupplierListItem[]>([]);
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', contact_email: '', due_date: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState('');
  const mcpUrl = `${window.location.origin}/mcp`;

  useEffect(() => { api<{authenticated:boolean}>('/api/session').then(x=>setAuthenticated(x.authenticated)).catch(()=>setAuthenticated(false)); }, []);
  const refresh = useCallback(async () => {
    try { const res = await api<{suppliers: SupplierListItem[]}>('/api/suppliers'); setSuppliers(res.suppliers); }
    catch (e) { setError((e as Error).message); if ((e as Error).message.includes('sign in')) setAuthenticated(false); }
  }, []);
  useEffect(() => { if (authenticated) refresh(); }, [authenticated, refresh]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(()=>setNotice(''), 4800); return () => clearTimeout(timer); }, [notice]);
  const openSupplier = async (id: string) => {
    setLoading(true); setError(''); setEditing(false); setEditingItem(null);
    try {
      const { supplier } = await api<{ supplier: Supplier }>(`/api/suppliers/${id}`);
      setSelected(supplier); setEditForm({ name:supplier.name, contact_email:supplier.contact_email || '', due_date:supplier.due_date, notes:supplier.notes || '' });
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };
  const updateSupplier = async () => {
    if (!selected) return;
    setSaving(true); setError('');
    try { const {supplier} = await api<{supplier:Supplier}>(`/api/suppliers/${selected.id}`, {method:'PATCH', body:JSON.stringify(editForm)}); setSelected(supplier); setEditing(false); setNotice('Supplier details saved successfully.'); refresh(); }
    catch(e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };
  const saveItem = async (item: ChecklistItem, fields: Partial<{title:string;is_completed:boolean}>) => {
    if (!selected) return;
    setSaving(true); setError('');
    try { const {supplier} = await api<{supplier:Supplier}>(`/api/checklist-items/${item.id}`, {method:'PATCH',body:JSON.stringify({title:fields.title ?? item.title,is_completed:fields.is_completed ?? Boolean(item.is_completed)})}); setSelected(supplier); setEditingItem(null); refresh(); }
    catch(e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };
  const addItem = async (event: FormEvent) => {
    event.preventDefault(); if (!selected || !newItem.trim()) return;
    setSaving(true); setError('');
    try { const {supplier} = await api<{supplier:Supplier}>(`/api/suppliers/${selected.id}/items`, {method:'POST',body:JSON.stringify({title:newItem})}); setSelected(supplier); setNewItem(''); setNotice('Requirement added.'); refresh(); }
    catch(e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };
  const deleteItem = async (item: ChecklistItem) => {
    if (!selected || !window.confirm(`Delete "${item.title}"?`)) return;
    setSaving(true); setError('');
    try { const {supplier} = await api<{supplier:Supplier}>(`/api/checklist-items/${item.id}`, {method:'DELETE'}); setSelected(supplier); setNotice('Requirement removed.'); refresh(); }
    catch(e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };
  const logout = async () => {
    try { await api('/api/logout',{method:'POST'}); } finally { setAuthenticated(false); setSelected(null); }
  };
  const copyText = async (value:string,what:string) => {
    try { await navigator.clipboard.writeText(value); setNotice(`${what} copied to clipboard.`); }
    catch { setError('Clipboard permission denied. Select and copy the text manually.'); }
  };
  const visible = useMemo(()=>suppliers.filter(s => (filter === 'all' || s.progress.status === filter) && `${s.name} ${s.notes}`.toLowerCase().includes(search.toLowerCase())),[suppliers,filter,search]);
  const ready = suppliers.filter(s=>s.progress.status==='ready').length;
  const incomplete = suppliers.length-ready;
  const overdue = suppliers.filter(s=>s.progress.status!=='ready'&&s.due_date<new Date().toISOString().slice(0,10)).length;
  if (authenticated === null) return <div className="initial-loading"><Brand/><div className="spinner"/>Loading workspace…</div>;
  if (!authenticated) return <Login onSuccess={()=>{ setAuthenticated(true); setError(''); }} />;

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <div className="sidebar-top"><Brand/><button className="mobile-close icon-btn" aria-label="Close navigation" onClick={()=>setMobileMenu(false)}><SvgIcon name="close"/></button></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        <button className={`nav-item ${page==='overview'?'active':''}`} onClick={()=>{setPage('overview');setSelected(null);setMobileMenu(false);}}><SvgIcon name="grid"/> Overview</button>
        <button className={`nav-item ${page==='setup'?'active':''}`} onClick={()=>{setPage('setup');setSelected(null);setMobileMenu(false);}}><SvgIcon name="plug"/> Connect Claude</button>
      </nav>
      <div className="sidebar-spacer"/>
      <div className="side-panel"><span className="side-panel-icon"><SvgIcon name="spark" size={19}/></span><strong>Powered by your Claude</strong><p>No AI API keys, subscriptions or inference inside VendorReady.</p><button onClick={()=>{setPage('setup');setSelected(null);setMobileMenu(false);}}>How it works <SvgIcon name="arrow" size={15}/></button></div>
      <div className="sidebar-footer"><span className="avatar">VD</span><div><strong>Demo Workspace</strong><small>Administrator</small></div><button title="Sign out" aria-label="Sign out" onClick={logout} className="icon-btn"><SvgIcon name="logout" size={18}/></button></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><button className="mobile-menu icon-btn" aria-label="Open menu" onClick={()=>setMobileMenu(true)}><SvgIcon name="menu"/></button><div className="breadcrumbs"><span>Workspace</span><SvgIcon name="chevron" size={14}/><strong>{page==='setup'?'Connect Claude':selected?'Supplier details':'Overview'}</strong></div><div className="top-actions"><span className="live-indicator"><i/>Live workspace</span><div className="top-avatar">VD</div></div></header>
      <main className="content">
        {error && <div className="flash flash-error" role="alert"><SvgIcon name="info" size={17}/><span>{error}</span><button aria-label="Dismiss error" onClick={()=>setError('')}><SvgIcon name="close" size={16}/></button></div>}
        {notice && <div className="flash flash-success" role="status"><SvgIcon name="check" size={17}/><span>{notice}</span><button aria-label="Dismiss notice" onClick={()=>setNotice('')}><SvgIcon name="close" size={16}/></button></div>}
        {page==='setup' ? <>
          <div className="page-header"><div><span className="eyebrow">GET CONNECTED</span><h1>Claude + VendorReady</h1><p>Claude does the thinking. VendorReady saves and maintains the real workflow.</p></div><span className="head-icon"><SvgIcon name="plug" size={26}/></span></div>
          <div className="setup-columns"><div className="card setup-card"><h2>Connect in four steps</h2><p className="muted">This workspace exposes a real remote MCP server with three operations.</p>
          <div className="setup-step"><span>01</span><div><strong>Open Claude settings</strong><p>Navigate to Customize → Connectors → Add custom connector.</p></div></div>
          <div className="setup-step"><span>02</span><div><strong>Use this MCP endpoint</strong><p>Enter your VendorReady server URL:</p><div className="copy-field"><code>{mcpUrl}</code><button onClick={()=>copyText(mcpUrl,'MCP URL')} aria-label="Copy MCP URL"><SvgIcon name="copy" size={17}/></button></div></div></div>
          <div className="setup-step"><span>03</span><div><strong>Add the access header</strong><p>Select no sign-in, then configure a request header: <code>X-VendorReady-Key</code>. Use the secret supplied privately with the assignment. Do not share it publicly.</p></div></div>
          <div className="setup-step"><span>04</span><div><strong>Enable the connector and run a prompt</strong><p>Enable VendorReady in your Claude chat, approve the tool invocation and open the saved result here.</p></div></div>
          </div><div className="setup-side"><div className="card prompt-card"><span className="eyebrow">TRY IT IN CLAUDE</span><h2>One prompt. A live onboarding.</h2><p className="muted">Copy this complete example prompt and paste it into Claude with your connector enabled.</p><div className="prompt-text">{PROMPT}</div><button className="btn btn-primary btn-wide" onClick={()=>copyText(PROMPT,'Sample prompt')}><SvgIcon name="copy" size={17}/> Copy sample prompt</button></div><div className="safety-note"><SvgIcon name="shield"/><div><strong>Human-first by design</strong><p>Claude proposes the initial checklist. Your team confirms accuracy and marks requirements complete. This app does not validate supplier identities or banking documents.</p></div></div></div></div>
          <div className="card tools-card"><h3>Available Claude actions</h3><div className="tools-grid">{[['create_vendor_onboarding','Save a supplier plus checklist'],['get_vendor_onboarding','Read the latest saved supplier'],['list_vendor_onboardings','List supplier readiness statuses']].map(([name,desc])=><div key={name}><code>{name}</code><p>{desc}</p></div>)}</div></div>
        </> : selected ? <>
          <div className="back-row"><button className="text-button" onClick={()=>{setSelected(null);refresh();}}><SvgIcon name="back" size={17}/> All suppliers</button><span>Supplier ID: {selected.id.slice(0,8)}…</span></div>
          <div className="detail-heading"><div><div className="heading-tag"><SvgIcon name="briefcase" size={15}/> SUPPLIER ONBOARDING</div><h1>{selected.name}</h1><div className="detail-heading-meta"><Status progress={selected.progress}/><span><SvgIcon name="calendar" size={16}/> Due {prettyDate(selected.due_date)}</span></div></div><button className="btn btn-outline" onClick={()=>setEditing(!editing)}><SvgIcon name="edit" size={17}/>{editing?'Close editor':'Edit details'}</button></div>
          {loading ? <div className="card empty-state">Loading supplier…</div> : <div className="details-grid"><div className="details-main"><div className="card progress-card"><div className="card-heading"><div><span className="eyebrow">ONBOARDING PROGRESS</span><h2>{selected.progress.percent}% <span>complete</span></h2></div><span className="progress-count">{selected.progress.complete} of {selected.progress.total} requirements</span></div><ProgressBar progress={selected.progress}/><p className="muted small">Completion means checklist items were marked complete. It does not imply independent verification.</p></div>
          <div className="card checklist-card"><div className="card-heading"><div><h2>Requirements checklist</h2><p className="muted">Check items off as your team completes them.</p></div><span className="counter-chip">{selected.checklist.length} items</span></div>
          <div className="checklist-list">{selected.checklist.map((item,i)=><div className={`checklist-row ${item.is_completed?'done':''}`} key={item.id}>
            <button className={`check-toggle ${item.is_completed?'checked':''}`} disabled={saving} aria-label={`${item.is_completed?'Mark incomplete':'Mark complete'}: ${item.title}`} onClick={()=>saveItem(item,{is_completed:!Boolean(item.is_completed)})}>{item.is_completed ? <SvgIcon name="check" size={16}/> : null}</button>
            <div className="item-main">{editingItem===item.id?<form onSubmit={event=>{event.preventDefault();saveItem(item,{title:itemDraft});}} className="inline-edit"><input autoFocus value={itemDraft} onChange={event=>setItemDraft(event.target.value)} maxLength={180}/><button className="btn btn-small btn-primary" disabled={saving}>Save</button><button type="button" className="btn btn-small btn-ghost" onClick={()=>setEditingItem(null)}>Cancel</button></form>:<><strong>{item.title}</strong><small>Requirement {String(i+1).padStart(2,'0')}</small></>}</div>
            {editingItem!==item.id&&<div className="item-actions"><button title="Edit requirement" aria-label={`Edit ${item.title}`} onClick={()=>{setEditingItem(item.id);setItemDraft(item.title);}}><SvgIcon name="edit" size={17}/></button><button title="Delete requirement" aria-label={`Delete ${item.title}`} onClick={()=>deleteItem(item)}><SvgIcon name="trash" size={17}/></button></div>}
          </div>)}</div>
          <form className="new-item-form" onSubmit={addItem}><input aria-label="New requirement" placeholder="Add another requirement…" value={newItem} maxLength={180} onChange={e=>setNewItem(e.target.value)}/><button type="submit" className="btn btn-soft" disabled={saving||!newItem.trim()||selected.checklist.length>=20}><SvgIcon name="plus" size={17}/> Add</button></form>
          </div></div>
          <div className="details-side">{editing?<div className="card editor-card"><h2>Edit supplier</h2><p className="muted">Update information and save to the shared database.</p><label>Supplier name<input value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})} maxLength={120}/></label><label>Contact email<input type="email" value={editForm.contact_email} onChange={e=>setEditForm({...editForm,contact_email:e.target.value})}/></label><label>Due date<input type="date" value={editForm.due_date} onChange={e=>setEditForm({...editForm,due_date:e.target.value})}/></label><label>Internal notes<textarea rows={5} maxLength={1500} value={editForm.notes} onChange={e=>setEditForm({...editForm,notes:e.target.value})}/></label><button className="btn btn-primary btn-wide" onClick={updateSupplier} disabled={saving}>{saving?'Saving…':'Save changes'}</button></div>:<div className="card overview-card"><h2>Supplier information</h2><div className="info-row"><span>Contact email</span><strong>{selected.contact_email||'Not provided'}</strong></div><div className="info-row"><span>Target due date</span><strong>{prettyDate(selected.due_date)}</strong></div><div className="info-row"><span>Created</span><strong>{new Date(selected.created_at).toLocaleDateString('en-IN')}</strong></div><div className="info-row"><span>Last updated</span><strong>{new Date(selected.updated_at).toLocaleDateString('en-IN')}</strong></div><div className="info-row"><span>Internal notes</span><p>{selected.notes||'No notes yet.'}</p></div><button className="btn btn-outline btn-wide" onClick={()=>setEditing(true)}><SvgIcon name="edit" size={16}/> Edit information</button></div>}
          <div className="hint-card"><SvgIcon name="info" size={18}/><div><strong>Live after the chat ends</strong><p>Changes here are written to the database. Claude's read tool can retrieve the latest checklist state.</p></div></div></div></div>}
        </> : <>
          <div className="page-header"><div><span className="eyebrow">SUPPLIER OPERATIONS</span><h1>Good {new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'}. <span>Let's get vendors ready.</span></h1><p>Everything your team needs to track supplier onboarding, in one place.</p></div><button className="btn btn-primary create-guidance" onClick={()=>setPage('setup')}><SvgIcon name="spark" size={17}/> Create with Claude <SvgIcon name="arrow" size={16}/></button></div>
          <section className="stats-grid" aria-label="Supplier readiness summary"><div className="stat-card"><div className="stat-icon icon-navy"><SvgIcon name="briefcase"/></div><div><span>Total suppliers</span><strong>{suppliers.length}</strong><small>All onboarding records</small></div></div><div className="stat-card"><div className="stat-icon icon-green"><SvgIcon name="check"/></div><div><span>Checklist complete</span><strong>{ready}</strong><small>All requirements checked</small></div></div><div className="stat-card"><div className="stat-icon icon-blue"><SvgIcon name="layers"/></div><div><span>Still in progress</span><strong>{incomplete}</strong><small>Requirements pending</small></div></div><div className="stat-card"><div className="stat-icon icon-orange"><SvgIcon name="calendar"/></div><div><span>Past due</span><strong>{overdue}</strong><small>Incomplete and overdue</small></div></div></section>
          <section className="supplier-section card"><div className="list-heading"><div><h2>Supplier onboardings</h2><p className="muted">Your live workspace, created from Claude and updated by your team.</p></div><button className="btn btn-outline" onClick={()=>{refresh();setNotice('Supplier list refreshed.');}}><SvgIcon name="refresh" size={17}/> Refresh</button></div>
          <div className="list-filters"><div className="search-box"><SvgIcon name="search" size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search suppliers…" aria-label="Search suppliers" /></div><select aria-label="Filter by status" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All statuses</option><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="ready">Checklist complete</option></select></div>
          {visible.length ? <div className="supplier-list">{visible.map(s=><button className="supplier-row" key={s.id} onClick={()=>openSupplier(s.id)}><span className="supplier-avatar">{s.name.trim().split(' ').slice(0,2).map(x=>x[0]?.toUpperCase()).join('')}</span><span className="supplier-name"><strong>{s.name}</strong><small>Due {prettyDate(s.due_date)}</small></span><span className="supplier-status"><Status progress={s.progress}/></span><span className="supplier-progress"><span>{s.progress.complete} of {s.progress.total} complete</span><ProgressBar progress={s.progress}/></span><SvgIcon name="chevron" size={19}/></button>)}</div> : <div className="empty-state"><div className="empty-icon"><SvgIcon name={suppliers.length?'search':'spark'} size={28}/></div><h3>{suppliers.length?'No matching suppliers':'Your first supplier starts in Claude'}</h3><p>{suppliers.length?'Try a different search or filter.':'Connect your Claude account and ask it to create a new vendor onboarding. It will appear here automatically.'}</p><button className="btn btn-primary" onClick={()=>{if(suppliers.length){setSearch('');setFilter('all');}else setPage('setup');}}>{suppliers.length?'Clear filters':'Connect Claude'} <SvgIcon name="arrow" size={16}/></button></div>}
          </section>
          <div className="bottom-note"><SvgIcon name="shield" size={18}/> Demo workspace uses fictional vendors only. Completion statuses reflect human checklist updates, not legal or banking verification.</div>
        </>}
      </main>
    </div>
  </div>;
}
