# MAHORAGA v10 — A–F Pre-Activation Research Engineering Report

**Date:** November 18, 2026 (Asia/Manila)  
**Branch:** `research/v10-prelaunch-hardening`  
**Final ordered CI:** [GitHub Actions run 44228205002](https://github.com/Elikers/invo-ultimate/actions/runs/44228205002) — **all six offline phase gates PASS**.  
**Release decision:** **HOLD / NOT ACTIVE / NO WEB PRODUCTION DEPLOYMENT.**

## Implemented and verified

| Phase | Committed deliverables | What passing CI proves | What it does NOT prove |
| --- | --- | --- | --- |
| **A** — Public feed preparation | `research/v10/prelaunch/adapters.cjs` with Hyperliquid L2 book, public trades, and funding/open-interest/mark-context adapters; `adapters.test.cjs`; extended original `research/v10/data/provenance.cjs`, `provenance.test.cjs` and `event.schema.json` | On deterministic fixtures, rejects crossed/unsorted/invalid books and malformed trades/context; handles dedup, stale and future-clock events, reconnect/sequence problems, missing source-event timestamps and protected train/test boundaries | No WebSocket service connected to this branch; no verified continuous live feed or guaranteed latency; no independent full JSON Schema engine compilation |
| **B** — Eight specialists | `experts.cjs`, `experts.test.cjs`; separately keyed expert outcome learners for Fusion, Sweep, Auction, Pullback, Volbreak, Mean, Strict and separate Scalping; `feedback.cjs`, `feedback.test.cjs` append-only predictions with delayed labels | Basic shrinkage-based conditional outcome estimates are calculated independently for all eight experts from valid mock mature rows; protects train cutoff and duplicated entries | Models are **simple offline algorithm prototypes**, not trained on a full verified historical microstructure dataset, not self-improving online production AI, not evidence of profitability |
| **C** — Ninth supervisor | `supervisor.cjs`, `supervisor.test.cjs` | Shadow supervisor ranks eligible descriptive net scores, can abstain on missing evidence and conflicting sides; rejects future and duplicate signals; cannot issue orders | Not trained ML mixture-of-experts, no real-time ensemble service, no validated learned decision policy |
| **D** — Versioning, drift and rollback | `registry.cjs`, `registry.test.cjs` | Deterministic model fingerprinting, immutable checkpoint registration, conservative drift alarm and research rollback; any evaluation only says HOLD or eligible for separate human review | Simple drift alarm is not a statistical change-point detector; no persisted production model serving or automatic promotion |
| **E** — Independent evaluation design | `evaluation.cjs`, `evaluation.test.cjs`, `integration.test.cjs` | Matched synthetic decision/label flow works through feedback -> expert training -> supervisor -> registry -> fail-closed release screen. Evaluator counts paired opportunities, refuses duplicate/nonprospective evidence and never claims independent approval | Synthetic rehearsal is **not actual forward data**. Descriptive day-cluster screen is not a fully calibrated confidence interval under serial correlation or selection; no audited fees, genuine fills or portfolio risk |
| **F** — Safe site preview | `dashboard-preview.html`; final ordered CI compares production website, simulator, collector and candidate-registration files across `main` and research branch | A static, expressly non-live HTML readiness preview is in isolated research tree. Source-file equality checks **passed**; no production integration | No Mahoraga panel was deployed to INVO GitHub Pages; no live status/AI capability should be advertised |

## AI mission and architecture updated

The research-only `research/v10/mission.json` now recognizes eight distinct individual expert families, including **scalping** separate from the existing auction strategy. MAHORAGA remains a **separate ninth supervisory component**. The registered goal is positive risk-adjusted net forward expectancy, not guaranteed profit or recovery after a loss.

## Test provenance

- [Final run 44228205002](https://github.com/Elikers/invo-ultimate/actions/runs/44228205002): **6/6 ordered phase jobs passed**; A includes both original and revised provenance checks; B includes new feedback; E includes synthetic integration; F verifies immutable production code and static UI restrictions.
- Earlier runs exposed a **bad crossed-book fixture** and an overbroad **static text scanner** that treated the word “WebSocket” as an actual executable connection. Both CI test issues were corrected and all phases rerun. No failed run is claimed to have passed.
- As a separate research branch activity, [public Hyperliquid BTC information smoke 44227826376](https://github.com/Elikers/invo-ultimate/actions/runs/44227826376) successfully checked bounded **read-only HTTP** L2 book and mark/funding/OI context, **not a persistent WebSocket**, and [development-only historical rehearsal 44228070510](https://github.com/Elikers/invo-ultimate/actions/runs/44228070510) sampled previously verified historical BTC April data. These two checks took place on `research/v10-mahoraga-preactivation`, **not as components or evidence that our present prelaunch branch is collecting continuous public ticks**. The historical rehearsal reported **zero scalping examples, zero independent forward samples and no profitability claim**.

## Known unresolved pre-activation gates (not negotiable)

1. **Continuous public-feed collector:** No user-approved always-on runtime and durable immutable raw market-data storage has been deployed. Need source-specific process that restarts, reconnects, preserves raw bytes, audits sequence/coverage and exposes freshness metrics. GitHub scheduled jobs are not sufficient for continuous tick data.
2. **Durable provenance:** The updated envelope distinguishes missing native source timestamps, but the implementation does **not** yet possess a real raw-data archive, source-clock calibration, persistent dedup/restart log or independent schema validator compilation. Context observations lacking source event-time remain prohibited as training records.
3. **Real learning data:** No real feed-derived eight-expert training set with verified fees/funding and fully matured outcomes has been registered, collected and trained end-to-end in this branch. Our 158,112 previously verified BTC/ETH/SOL five-minute **candles**, not trades, are useful **historical development** inputs, not independent future test records or genuine scalping fill observations.
4. **Independent forward validation:** There is no demonstrated positive Mahoraga trading edge after genuine execution costs, correlation-aware statistics, sufficient matched independent prospective observations and drawdown/tail-risk checks. The v9 collector and registration work is not enough to establish profit.
5. **Security and operational approvals:** Any deployment of persistent WebSocket collector/storage must undergo a service security/privacy/reliability review, cost authorization if non-free, metrics, alerting, resource caps and rollback drill.
6. **Release separation:** The actual production `index.html`, `v61-core.js`, `research/run.cjs`, `research/v7-registration.json`, and `.github/workflows/research.yml` matched their frozen counterparts in final CI. No main-branch AI or trading logic changes, real orders, credentials or paid services authorized.

## Next safe sequence

- Harden source-specific, durable collector storage and conduct a long-running *read-only* reliability soak in an explicitly approved environment.
- Produce immutable versioned training/validation/test partitions with time gaps, funding/spread/slippage provenance and physically separated future forward observations. Register exact scalping contract/timeframe and sample standards.
- Train baseline interpretable experts and the supervisor on true development data; audit parameter count, hyperparameter search and stability across markets/regimes. Never read protected future outcomes for tuning.
- Run paired paper-only research and strict economic evaluation. Keep historical backtests, forecasts, quote-based hypothetical PnL and account execution receipts distinct.
- Only after the above, consider whether to expose a research-only website dashboard. Activation as trading authority is a **separate future decision**, with explicit user authorization and no automatic switch.

**Final honest outcome:** We implemented and verified a significant A–F offline engineering foundation, including protected source timestamps, eight specialist learning scaffolds, an abstaining ninth supervisor, memory, rollback, matched evaluation and a non-live dashboard preview. We did **not** complete continuous training deployment, proven profitability or activation. **MAHORAGA MUST REMAIN INACTIVE.**
