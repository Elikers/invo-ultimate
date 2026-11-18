# MAHORAGA v10.4–v10.8 consolidated research implementation report

Status recorded November 18, 2026. **No actual profitable forward results, live execution, independent attestation, or automatically learned candidate are established.**

## Change isolation
- v10.4 `research/v10.4-durable-evidence`: validates original raw pre-decision frames, receipt hashes, source-run identities, and a chained ledger. A Git repository is not independently immutable.
- v10.5 `research/v10.5-outcome-audit-20261118`: checks post-horizon source exit frame SHA256 and recomputes paper exit returns under preregistered assumptions; refuses missing frames and tampering. No funding or actual fills.
- v10.6 `research/v10.6-challenger-20261118`: gated candidate research screen with minimum evidence thresholds. Research observations are training_eligible=false and **candidate training is not executed**. No live or automatic model promotion.
- v10.7 `research/v10.7-paper-dashboard-20261118`: static, offline user-loaded research viewer plus provenance-gated ex-funding paper summary. No production website change.
- v10.8 `research/v10.8-operations-20261118`: stale, gap, missing durable ledger and pre-registration checks fail closed. No live trading.

## What the tests mean
Unit fixtures create synthetic books *only inside tests*. They are not counted as prospective data. Action success validates code tests, not scheduled public ingestion, realized slippage, genuine funding reconciliation, independent timestamps, strategy profitability or unattended operational uptime.

## Scheduling / data durability block
GitHub Actions `schedule` is executed from a repository's default branch. These research branches intentionally do not touch the default branch, and the v10.4–v10.8 workflows are push-triggered safety suites **not recurring collection**. v10.8 now also contains a separate push-triggered bounded public capture and audited Git ledger publisher at `.github/workflows/v108-capture-ledger.yml`, activated by an increment of `research/v10/research/capture-request.json`. This workflow is not a cron and still needs a verified trigger. A compatible authorized default-branch dispatcher or external task scheduler must be configured and its runs verified before claiming hourly collection. Existing v10.3 evidence remains artifact-retained (30 days); the v10.8 persistence program can store raw source payloads, per-run receipts and hash-chain metadata in a research-only Git branch and retains an optional GitHub Actions copy. A bounded pre-registration end-to-end capture, authenticated git push, and GitHub artifact upload are **verified** by GitHub Actions run 44333316682 (success). This test received 12 public frames, recorded 0 prospective observations, 3 correct REGISTRATION_NOT_ACTIVE gaps, and wrote ledger entry 0 (run 44333316682). It proves one operational on-demand archive, not repeat-run reliability after registration. GitHub is still a **single provider**, not an independent backup. Independent off-provider backup remains outstanding.

## Known unresolved limits
1. No deployed research-only hourly scheduling for v10.3+ and no verified recurring successful receipt chain.
2. Bounded push-triggered Git-backed archival and same-provider artifact upload passed once before registration; unattended post-registration scheduling, long-term retention, second successful ledger append, and off-GitHub independent backup still require verification.
3. Outcome settlement currently requires a source-run request near maturity. Missing +60-minute quote within five-minute tolerance fails closed. No continuous orchestration, and an hourly sampler alone may miss the registered maturity window.
4. No verified funding, exchange fills, real slippage or complete return. Paper profits cannot be asserted as live or portfolio profits.
5. No approved automatically learning challenger; candidate screening cannot accept the current unverified records.
6. Dashboard is isolated research source files, not publicly hosted or integrated into the production website.

## Safeguards
v10.3 registration date remains November 19, 2026 00:00 UTC. Never backfill prediction records. Never order or trade. Never auto-promote. Production risk settings frozen. Any missing provenance/temporal evidence is a fail-closed result.

## Evidence tracking
Actual full-path smoke test: https://github.com/Elikers/invo-ultimate/actions/runs/44333316682 (success); prestart receipt path research/v10/research/evidence/runs/44333316682/capture-receipt.json; ledger path research/v10/research/evidence/ledger.json. These are real receipt **gaps**, not real predictions. Final research safety workflow runs should be checked against the newest commit, and this document's own CI-triggering commit should be verified.
