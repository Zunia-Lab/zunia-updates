CREATE TABLE report_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports (id) ON DELETE CASCADE,
  team text NOT NULL CHECK (team IN ('support', 'technical')),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX report_comments_by_report ON report_comments (report_id, created_at);

INSERT INTO releases (product_id, version, released_on, summary)
VALUES
  ('extension', '0.1.1', '2026-09-30', 'Prices load again, and Injective transfers sign on that chain.'),
  ('extension', '0.1.2', '2026-10-02', 'Websites you visit keep their own fonts.')
ON CONFLICT (product_id, version) DO NOTHING;

INSERT INTO changelog_entries (release_id, kind, title, body)
SELECT r.id, 'fixed', 'Prices show again',
  'The store build called CoinGecko''s batch route, which returned 403, so a balance had no price. Prices load again.'
FROM releases r
WHERE r.product_id = 'extension' AND r.version = '0.1.1'
  AND NOT EXISTS (
    SELECT 1 FROM changelog_entries e
    WHERE e.release_id = r.id AND e.title = 'Prices show again'
  );

INSERT INTO changelog_entries (release_id, kind, title, body)
SELECT r.id, 'fixed', 'Injective transfers sign on that chain',
  'An Injective send now uses that chain''s key type. A ticker that also exists on another chain keeps its chain suffix.'
FROM releases r
WHERE r.product_id = 'extension' AND r.version = '0.1.1'
  AND NOT EXISTS (
    SELECT 1 FROM changelog_entries e
    WHERE e.release_id = r.id AND e.title = 'Injective transfers sign on that chain'
  );

INSERT INTO changelog_entries (release_id, kind, title, body)
SELECT r.id, 'fixed', 'Pages keep their own fonts',
  'The extension no longer changes the font of websites you visit. Text inside a Zunia prompt still uses the Zunia font.'
FROM releases r
WHERE r.product_id = 'extension' AND r.version = '0.1.2'
  AND NOT EXISTS (
    SELECT 1 FROM changelog_entries e
    WHERE e.release_id = r.id AND e.title = 'Pages keep their own fonts'
  );
