# MAHORAGA v10.3 — Verified Forward-Learning Infrastructure Report

**Verification date:** 2026-11-18 UTC.
**Branch:** `research/v10.3-forward-learning`.
**GitHub Actions verified tests/capture:** https://github.com/Elikers/invo-ultimate/actions/runs/44284652222 — **SUCCESS**.\n**Separate zero-observation maturity-path test:** https://github.com/Elikers/invo-ultimate/actions/runs/44285167271 — **SUCCESS**. It retrieved the earlier pre-registration source artifact, passed receipt hash verification, and correctly generated no matured outcome or profit claim.

## What actually exists
1. Frozen research registration (`registration.json`) starts **2026-11-19 00:00:00 UTC**. No observations before this are allowed to count as prospective.
2. `forward.cjs` creates one timestamp-checked, source-hashed future-only public Hyperliquid L2 imbalance hypothesis per market (BTC, ETH, SOL), explicitly including NONE/no-trade. It has zero wallet or order API dependencies.
3. `capture.cjs` receives a bounded public websocket feed, retains the exact selected public raw frames, separately records missing markets as gaps and saves a GitHub Actions artifact containing source receipts and SHA256.
4. `settle.cjs` requires the **previously written** capture artifact, recomputes the original decision against its source frames, and accepts only a fresh observed exit quote at 60min maturity plus up to 5min tolerance. No later reconstruction of missing quotes is permitted. Without a matching future source it writes **MISSING_DATA**, not a fabricated win/loss.
5. `audit.cjs` independently checks source recomputation, no duplicate observations/outcomes, missing-data accounting, mature-only timestamps, the original receipt hash, and hard no-live/no-training gates.
6. `.github/workflows/v103-forward.yml` runs the tests and bounded public capture on research-branch push or `workflow_dispatch`. `.github/workflows/v103-mature.yml` permits a **separate manual** outcome evaluation using a prior Actions run ID. These workflows do **not** auto-trade.

## Actual CI evidence, not hypothetical success
- Forward hypothesis test: **PASS**.
- Prospective shadow regression: **PASS**.
- V10 full-cycle research safety regression: **PASS**.
- New v10.3 raw-source audit regression: **PASS**.
- Bounded Hyperliquid public websocket connectivity: **9 received frames, zero invalid frames**.
- Pre-registration capture gaps: BTC, ETH, SOL — **REGISTRATION_NOT_ACTIVE**.
- Registered prospective predictions: **0** (correct because run was executed Nov 18, prior to Nov 19 00:00 UTC).
- Authenticated future matured trade labels: **0**.
- Verified strategy/account profits: **NONE**.
- Production/website/execution/risk files modified: **NONE**.

## Scientific limitations and release verdict
The v10.3 rule is a new pre-registered but **untrained** experimental single-book-snapshot imbalance hypothesis. All v10.2 candidates had failed their training-only selection criteria, so NO v10.2 candidate or existing MAHORAGA production engine has been promoted. An isolated public book snapshot cannot establish robust edge, full venue liquidity or fill certainty. The research cost proxy uses assumed per-side fees/slippage, while *actual forward funding* is missing and explicitly blocks all-in profitability statements. GitHub Action logs and artifacts are only provisional audit evidence (not independent externally signed or durable). A short connectivity pilot proves neither 24/7 uptime nor prospective prediction performance.

The forward capture workflow has **no recurrence schedule**: scheduling a workflow in a nondefault research branch does not provide a reliable automatic GitHub Actions cadence. Future capture is supported by incrementing \`capture-request.json\` on the research branch after registration (push-triggered), or separately authorized durable scheduling. Later evaluation can be triggered by updating \`maturity-request.json\` with the prior capture run ID, because GitHub's normal workflow_dispatch path requires a default-branch workflow. The original test request points to a zero-observation pre-registration run and must not be reused as genuine future performance. The later evaluator must be dispatched after the 60-min horizon, within the 5min registered exit observation tolerance, or it labels missing data. The 30-day artifact retention is not a durable multi-month evidence store.

**Final status:** research-only infrastructure implemented and tested. Forward profitability unproven. Model training on v10.3 forward evidence not yet permitted. `approved_for_live=false` and `training_eligible=false`; no real orders and no changes to production strategy or risk.
