INSERT INTO releases (product_id, version, released_on, summary)
VALUES (
  'mobile',
  '0.1.0',
  DATE '2026-10-19',
  'Zunia for Android is on Google Play. Create or restore a wallet on the phone. The keys stay there.'
)
ON CONFLICT (product_id, version) DO NOTHING;

INSERT INTO changelog_entries (release_id, kind, title, body)
SELECT r.id, lines.kind, lines.title, lines.body
FROM releases r
JOIN (VALUES
  (
    'added',
    'On Google Play',
    'The official Android install is [Google Play](https://play.google.com/store/apps/details?id=com.zunialab.wallet), package com.zunialab.wallet. The iPhone build is still in review.'
  ),
  (
    'added',
    'The same phrase as the extension',
    'Create or restore a wallet on the phone. There is no account. Unlock with a fingerprint or a password. The phrase stays on the device.'
  ),
  (
    'added',
    'Send, stake, vote, and swap',
    'Send on the same chain or over IBC. Stake, claim rewards, and vote. A swap on the Swap screen carries a 0.5% fee, shown before you sign.'
  ),
  (
    'added',
    'Pair a website from the phone',
    'Browse a dApp in the app, or scan a QR code from the web dashboard. Both screens show the same code, and the messages are end-to-end encrypted.'
  )
) AS lines(kind, title, body) ON true
WHERE r.product_id = 'mobile' AND r.version = '0.1.0'
  AND NOT EXISTS (
    SELECT 1 FROM changelog_entries e
    WHERE e.release_id = r.id AND e.title = lines.title
  );
