-- Minimal VendorReady schema. Demo workspace only; no sensitive documents are stored.
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL DEFAULT 'demo',
  name TEXT NOT NULL,
  contact_email TEXT,
  due_date TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  request_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workspace_id, request_key)
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL,
  title TEXT NOT NULL,
  is_completed INTEGER NOT NULL DEFAULT 0 CHECK(is_completed IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_suppliers_workspace ON suppliers(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_checklist_supplier ON checklist_items(supplier_id, sort_order);
