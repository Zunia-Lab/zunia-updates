INSERT INTO releases (product_id, version, released_on, summary)
VALUES
  (
    'extension',
    '0.1.5',
    DATE '2026-10-08',
    'Votes, contract calls, added accounts, and memos with & < > sign the way chains verify them, and every prompt says what a message carries.'
  ),
  (
    'extension',
    '0.1.6',
    DATE '2026-10-22',
    'NFTs show on Safrochain again, and long addresses stay inside their cards.'
  ),
  (
    'extension',
    '0.1.7',
    DATE '2026-11-05',
    'SAF trades before Osmosis verifies it, staked coins count in the value, and Help is one tap away.'
  )
ON CONFLICT (product_id, version) DO NOTHING;

INSERT INTO changelog_entries (release_id, kind, title, body)
SELECT r.id, lines.kind, lines.title, lines.body
FROM releases r
JOIN (VALUES
  (
    'fixed',
    'Votes and memos sign the way chains verify them',
    'A vote, and a memo with &, < or >, are signed in the exact form the chain checks, so the chain no longer rejects the signature. This covers dApp requests and Send.'
  ),
  (
    'fixed',
    'Added accounts sign with their own key',
    'An account added with its own phrase signs dApp requests with the key it shows.'
  ),
  (
    'changed',
    'Every prompt says what a message carries',
    'Prompts name each recipient, the coins a contract call sends, the token an NFT transfer moves and its new owner, and every coin of the fee. Both signing modes read the same. When a chain rejects a signature, the error is in plain words.'
  ),
  (
    'security',
    'The raw transaction is shown whole',
    'Raw transaction was cut at 12,000 characters, so a site could hide where funds go past the cut. It is now shown whole, and a request too large to show is refused. When a transfer''s memo forwards the tokens, the prompt names the channel and the receiver.'
  ),
  (
    'added',
    'Sites can tell which Zunia they talk to',
    'window.zunia reports the installed release and the signing features it supports, so a site can pick a request this version signs.'
  )
) AS lines(kind, title, body) ON true
WHERE r.product_id = 'extension' AND r.version = '0.1.5'
  AND NOT EXISTS (
    SELECT 1 FROM changelog_entries e
    WHERE e.release_id = r.id AND e.title = lines.title
  );

INSERT INTO changelog_entries (release_id, kind, title, body)
SELECT r.id, lines.kind, lines.title, lines.body
FROM releases r
JOIN (VALUES
  (
    'fixed',
    'NFTs show on Safrochain again',
    'Some collections never appeared, Dyma Reputation on Safrochain among them, because an earlier failed check was remembered. The extension checks those contracts again.'
  ),
  (
    'fixed',
    'Long addresses stay inside their cards',
    'An address in an activity or on the approval window no longer runs past the edge of its card. It wraps instead.'
  ),
  (
    'fixed',
    'Live balances turn on in Safari',
    'When website access was already set to Allow in Safari, Enable stayed off. It turns on now.'
  )
) AS lines(kind, title, body) ON true
WHERE r.product_id = 'extension' AND r.version = '0.1.6'
  AND NOT EXISTS (
    SELECT 1 FROM changelog_entries e
    WHERE e.release_id = r.id AND e.title = lines.title
  );

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
    'A coin''s balance, total, and value include what is staked, unbonding, and earned in rewards, marked "incl. X staked".'
  ),
  (
    'fixed',
    'A sequence mismatch retries once',
    'When a chain answers that the account sequence does not match, the transaction is sent again once instead of failing.'
  ),
  (
    'changed',
    'Notifications follow arrivals live',
    'The notifications list updates as transfers arrive, without reopening it.'
  ),
  (
    'added',
    'Help in Settings',
    'Settings has a Help group with support, guides, and a way to report a problem. Empty NFT pages are one line and an action.'
  )
) AS lines(kind, title, body) ON true
WHERE r.product_id = 'extension' AND r.version = '0.1.7'
  AND NOT EXISTS (
    SELECT 1 FROM changelog_entries e
    WHERE e.release_id = r.id AND e.title = lines.title
  );
