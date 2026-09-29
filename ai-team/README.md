# Dala AI Team

Suggest-only CLI with ten roles, no shell/database/GitHub/deployment tools, no runtime dependencies. Node 20-compatible; use Node 24 LTS for the new service. No Next.js runtime changes.

## Run without spending

From the repository root:

```sh
node --test ai-team/test/*.test.mjs
node ai-team/src/cli.mjs ai-team/examples/evidence.json
```

This prints a plan and makes no API requests. Evidence is explicitly prepared metadata or reviewed source excerpts; the program never crawls the repository. Example evidence is not an actual audit.

## Optional live review

Supply OPENAI_API_KEY securely through the process environment, DALA_ENABLE_API=true, DALA_EVIDENCE_REVIEWED=true and DALA_MONTHLY_CAP_SAR (positive, max 100). Then append --live. These flags acknowledge that the evidence was manually reviewed for secrets and personal data. DALA_KILL_SWITCH=true disables live execution. DALA_ROLES accepts comma-separated product,ux,technical,database,qa,security,pricing,content; validation and manager always run last.

No live calls have been tested or funded by this change. Account/model availability must be verified. Network policy should allow only api.openai.com. Never mount production credentials, a Docker socket or writable application source. Review outputs remain untrusted text.

The CLI uses gpt-6-luna, store:false, 2,000 maximum output tokens, a 24KB evidence limit and 0.03 SAR conservative reservation per request. Prices dated 2026-09-29: input $0.10/M, cache writes $0.125/M, output $0.50/M; conversion 3.75 SAR/USD. Revalidate prices before enabling. Source: https://developers.openai.com/api/docs/models/gpt-6-luna

The ledger is persistent and fail-closed under concurrent access. Reservations are not refunded, including failed or unknown requests. This intentionally underuses the nominal cap. Keep state/ on persistent storage and use exactly one installation/ledger per budget; multiple copies cannot enforce an account-wide cap. A stale lock needs operator investigation, never automatic removal. Do not delete/reset the ledger to retry. Monthly boundary is UTC. API-account spending from other applications is outside this cap.

Secret pattern scanning is defense in depth, not a guarantee. No automatic ingestion of customer records or env files. Long reviewer output can cause validation to stop at the size limit; the report then remains incomplete. Reports are JSON, not executable commands or trusted HTML. Live QA validates recommendations only; it does not execute application tests.

## Change and production approvals

The CLI cannot create branches, open PRs, merge or deploy. A separately authorized operator applies proposed fixes on a development branch, opens a draft PR, runs app CI and Staging tests, and records independent validation and human approval for the exact SHA. The policy test workflow here only tests this service; it is not a full Dala release pipeline. Configure branch protection after checking the GitHub plan; no plan was purchased.

## Isolated Staging

`compose.staging.yml` creates a separate internal network and PostgreSQL volume. No public/host ports or production networks. Generate a new staging-only database password on the server (never copy production env). Set DALA_STAGING_IMAGE to an inspected immutable local image ID and DALA_SOURCE_DIR to a read-only source directory providing matching Prisma schema/migrations and node_modules. The migration service mounts only these two directories, not the production env file. Run db, then `docker compose -f compose.staging.yml run --rm migrate`, then app. Do not run `down -v`.

On 2026-09-29 all five migrations and Prisma schema-drift verification passed on a new empty database. Home and login returned HTTP 200 via the internal address. No customer records were copied, and no end-to-end booking/payment test was performed. The reused production image runs Node 20; Node 24 migration remains outstanding. Reuse of an image does not prove its exact source commit unless provenance is available.

Access through an SSH tunnel to the current container IP, obtained with `docker inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' dala-ai-staging-app-1`. Forward local 33211 to that IP port 3211 and visit localhost:33211. The IP may change after recreation. Authentication cookies marked Secure may require local HTTPS for full login testing. Keep staging private and use synthetic data only. The internal network blocks external provider calls; API keys are empty. Resource caps: app 512MB/0.5 CPU, database 256MB/0.5 CPU. No auto-restart configured.
