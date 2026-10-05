# zunia-updates

Public changelog, versions, and reports for Zunia at [updates.zunialab.com](https://updates.zunialab.com).

Releases and changelog entries are written in `/admin`. Sign in as Support or Technical with the same token. A comment on a public report shows on the requests board under that team name. Marking a report fixed writes the version onto the changelog and the versions page. The version line always includes the product, for example Extension 0.1.2.

## Develop

```bash
pnpm install
createdb zunia_updates
cp .env.example .env.local
# set DATABASE_URL and ADMIN_TOKEN
pnpm db:migrate
pnpm dev
```

In development, human verification uses Cloudflare's always-pass Turnstile test keys unless you set real ones.

## Production

The app listens on `127.0.0.1:3016`. Secrets live in `/srv/zunia/shared/updates.env` and are not committed.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres database `zunia_updates` |
| `ADMIN_TOKEN` | Password for `/admin`. The sign-in form also asks for Support or Technical |
| `TURNSTILE_SITE_KEY` | Turnstile site key. `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is also accepted |
| `TURNSTILE_SECRET_KEY` | Turnstile secret. A missing secret rejects every report |
| `CF_ACCESS_TEAM_DOMAIN` | Optional. Team host, such as `zunia.cloudflareaccess.com` without the scheme |
| `CF_ACCESS_AUD` | Optional. Access application audience tag |
| `TRUST_PROXY` | `cloudflare` so the rate limit uses `CF-Connecting-IP` |

Create the Turnstile widget and the Access application for `updates.zunialab.com/admin` in the Cloudflare dashboard. Access is the outer gate. The token still has to match, so a missed Access rule does not open the inbox.

## License

Apache-2.0.
