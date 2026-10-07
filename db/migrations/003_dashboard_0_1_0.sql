UPDATE products SET name = 'Dashboard' WHERE id = 'wallet';

INSERT INTO releases (product_id, version, released_on, summary)
VALUES (
  'wallet',
  '0.1.0',
  DATE '2026-10-07',
  'One desk for every Cosmos chain you follow, at app.zunialab.com. The keys stay in your wallet.'
)
ON CONFLICT (product_id, version) DO NOTHING;

INSERT INTO changelog_entries (release_id, kind, title, body)
SELECT r.id, lines.kind, lines.title, lines.body
FROM releases r
JOIN (VALUES
  (
    'added',
    'The dashboard is at app.zunialab.com',
    'wallet.zunialab.com redirects there and keeps the path. The page never asks for a recovery phrase.'
  ),
  (
    'added',
    'Every chain you follow, or one chain at a time',
    'The Zunia mark covers every followed chain. Pick one chain and the desk shows only that chain. Any Cosmos chain in the catalog can be opened.'
  ),
  (
    'added',
    'Read the chains without connecting',
    'Markets, chains, validators, proposals and compare open with no wallet. A missing figure says why. The page does not invent a number.'
  ),
  (
    'added',
    'Send, swap, bridge and stake from the desk',
    'Swap, bridge, send, stake, vote and NFTs are prepared here and signed in the Zunia extension, Keplr, or the Zunia app. A swap shows the 0.5% fee before you sign.'
  ),
  (
    'added',
    'Notifications stay quiet until you turn them on',
    'Preferences live in Settings. Web push stays off until you allow it.'
  )
) AS lines(kind, title, body) ON true
WHERE r.product_id = 'wallet' AND r.version = '0.1.0'
  AND NOT EXISTS (
    SELECT 1 FROM changelog_entries e
    WHERE e.release_id = r.id AND e.title = lines.title
  );
