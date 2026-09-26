CREATE TABLE products (
  id text PRIMARY KEY,
  name text NOT NULL,
  sort integer NOT NULL
);

CREATE TABLE releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL REFERENCES products (id),
  version text NOT NULL,
  released_on date NOT NULL,
  summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, version)
);

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('bug', 'feature')),
  product_id text NOT NULL REFERENCES products (id),
  title text NOT NULL,
  body text NOT NULL,
  contact text,
  status text NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'accepted', 'planned', 'in_progress', 'shipped', 'declined', 'spam')
  ),
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE changelog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid NOT NULL REFERENCES releases (id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('added', 'fixed', 'changed', 'security')),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  report_id uuid REFERENCES reports (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX changelog_entries_one_report
  ON changelog_entries (report_id)
  WHERE report_id IS NOT NULL;

CREATE INDEX releases_by_day ON releases (released_on DESC, created_at DESC);
CREATE INDEX reports_by_status ON reports (status, created_at DESC);
CREATE INDEX reports_by_ip ON reports (ip_hash, created_at DESC);

INSERT INTO products (id, name, sort) VALUES
  ('extension', 'Extension', 1),
  ('mobile', 'Mobile', 2),
  ('wallet', 'Wallet', 3),
  ('website', 'Website', 4);
