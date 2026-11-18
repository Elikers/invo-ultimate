# INVO v7.9 — Independent external scheduler option (NOT DEPLOYED)

Status: **Research branch implementation only, fail-closed and disabled by default.** No production changes, no external Cloudflare account, token, secret, worker deployment, or live dispatch have been created.

## Purpose and boundaries

Cloudflare Workers supports UTC cron-triggered `scheduled()` events separately from GitHub's scheduling infrastructure:
https://developers.cloudflare.com/workers/configuration/cron-triggers/
The proof-of-concept checks the GitHub workflow's most recent *actual* successful runs and, only if stale, requests the repository's existing **collector_only=true** `workflow_dispatch`, never a full backtest or trading order:
https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event

**This is scheduler independence, NOT execution independence.** The collector still runs on GitHub Actions and may be delayed or unavailable during a GitHub Actions outage. It is not a 15-minute real-time guarantee and cannot reconstruct missed prospective signals.

## Conservative decision gate

- Worker itself defaults to `RECOVERY_ENABLED=false`.
- Every 15 minutes, inspect up to 100 `research.yml` runs on `main` (only once deployed/activated).
- If a successful run exists from the past **50 minutes**, do nothing.
- If a relevant run is pending/in progress from the past 50 minutes, do nothing.
- If any workflow_dispatch was issued in the past **60 minutes**, do nothing.
- If a recent failure occurred in the last **15 minutes**, do nothing.
- If valid run history is empty, fail closed.
- Otherwise request exactly `{"ref":"main","inputs":{"collector_only":"true"}}`. Require HTTP 204 to mark *request accepted*, not execution success.
- Public HTTP requests to Worker return 404; no public manual trigger or dynamic arbitrary repository/workflow input.
- The Worker never stores a list of missed candle timestamps, logs a secret, or processes any market-trading logic.
- GitHub's pre-existing watchdog may also dispatch, so event history/cooldown reduces but does **not eliminate** concurrent duplicate dispatch races. Activation requires reviewing frequency, Actions consumption and dispatch permissions.

## Deployment prerequisites (owner authorization needed)

1. Owner-approved Cloudflare Workers account and CLI setup; confirm plan pricing, quotas and Terms before deployment.
2. Owner-provisioned *fine-grained* GitHub token restricted to `Elikers/invo-ultimate`, with **Actions: write** and required read access. Store it only as a Cloudflare Worker secret named `GITHUB_ACTIONS_TOKEN`. **Never paste token into chat, code, GitHub files, website or logs.** Prefer an expiration and rotation policy. Token scope is powerful: this is a security review gate.
3. Deploy `worker.mjs` and `wrangler.toml` from an approved secure environment, **keeping `RECOVERY_ENABLED=false`** for a dry observation before activating; the current sample will not fetch until enabled.
4. Owner separately authorizes setting `RECOVERY_ENABLED=true` after API access verification, failure-notification design, action cost evaluation, and inspection that GitHub's original watchdog will not create dispatch storms.
5. Observe real GitHub run IDs, actual updated collector heartbeat and end-to-end throughput over multiple days. If any unexpected dispatches or costs occur, set flag back to false and revoke the token.
6. This branch is not merged into main. The Cloudflare Worker source runs externally only when the owner explicitly deploys it; this request's GitHub approval **does not** authorize creation of external service accounts or secrets.

## Offline testing

`node research/v79/worker.test.mjs` mocks GitHub API. Tests healthy run, stale run, pending research, cooldown, recent failure, no run history, disabled default, exact dispatch payload, HTTP rejection and no public web route. No actual token required.

**Current baseline:** Main's last verified 8:30 AM Manila collector was healthy for all four markets but stale by the v7.8 9:33 AM audit. No root cause was established. Existing automated paper forward evidence remains 19/100 in the latest verified report. No claims of restored schedule or improved profitability are made.
