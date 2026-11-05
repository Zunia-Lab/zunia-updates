UPDATE changelog_entries e
SET body = 'The official Android install is [Google Play](https://play.google.com/store/apps/details?id=com.zunialab.wallet), package com.zunialab.wallet. The iPhone app is on the [App Store](https://apps.apple.com/app/zunia-wallet/id6824444063) since 2026-10-31.'
FROM releases r
WHERE e.release_id = r.id
  AND r.product_id = 'mobile' AND r.version = '0.1.0'
  AND e.title = 'On Google Play';

INSERT INTO releases (product_id, version, released_on, summary)
VALUES (
  'mobile',
  '0.1.1',
  DATE '2026-11-05',
  'Swap SAF, see staked coins in the value, find NFTs without pasting a contract, and restore a wallet without a quiz.'
)
ON CONFLICT (product_id, version) DO NOTHING;

INSERT INTO changelog_entries (release_id, kind, title, body)
SELECT r.id, lines.kind, lines.title, lines.body
FROM releases r
JOIN (VALUES
  (
    'added',
    'Trade SAF on Osmosis',
    'SAF can be swapped on Osmosis before Osmosis verifies it. It shows no verified seal until Osmosis does.'
  ),
  (
    'changed',
    'Staked coins count in the value',
    'Portfolio rows and totals include what is staked, unbonding, and earned in rewards.'
  ),
  (
    'fixed',
    'NFTs show without pasting a contract',
    'The gallery finds collections on CosmWasm chains such as Safrochain by itself. A pasted contract no longer fails with "Could not reach Safrochain". Scan the chain again forces a new search.'
  ),
  (
    'fixed',
    'Transactions sign on the first try more often',
    'The account is read again before signing, and a sequence mismatch is retried once with the sequence the chain expects.'
  ),
  (
    'changed',
    'Restore without a quiz',
    'Restoring a wallet no longer asks you to verify the phrase, and the "not verified" banner is gone. Checking your written copy is still in Security.'
  ),
  (
    'changed',
    'Activity updates while the app is open',
    'Transfers refresh balances and history as they arrive. What arrived while the app was in the background shows as a notice when you come back.'
  ),
  (
    'changed',
    'A simpler browser and a Help sheet',
    'The browser opens Safrochain Hub, Osmosis, Mintscan, and Zunia IBC Map, and keeps favorites and history. A Help sheet links support, the guide, a report form, and email. Bridge opens the cross-chain Send.'
  )
) AS lines(kind, title, body) ON true
WHERE r.product_id = 'mobile' AND r.version = '0.1.1'
  AND NOT EXISTS (
    SELECT 1 FROM changelog_entries e
    WHERE e.release_id = r.id AND e.title = lines.title
  );
