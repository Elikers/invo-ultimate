# INVO Ultimate — MAHORAGA v10 Five-Improvements Consolidated Research Report

**Date:** November 18, 2026 (UTC+08)  
**Branch:** `research/v10-five-improvements`  
**Deployment status:** **NOT ACTIVATED — research-only**. Production `main`, website, fixed strategy/risk settings, private accounts and execution endpoints remain unchanged.

## Overview: five requested improvements

| Improvement | Implemented and verified software | Not yet established |
|---|---|---|
| 1. Reliable public market-data capture | Bounded WebSocket CLI with raw SHA-256, durable local JSONL, restart dedup, timestamp/latency reject, reconnect and local health; [live read-only runtime smoke passed](https://github.com/Elikers/invo-ultimate/actions/runs/44230932237) (74 accepted events over ~12s, no orders) | **Not an always-on 24/7 service**; no approved permanent runtime/cloud storage, validated coverage, time synchronization study or complete outage recovery. Context without exchange event timestamp quarantined, not silently trained. |
| 2. Broader specialist training | Seven existing 5m specialists have frozen-strategy historical training on **BTC/ETH/SOL April–May 2026**, 10,021 retrospective labeled paper examples across all markets. 8th `scalping` is registered but remains at 0 real 1m/microstructure training examples. Uses chronological no-future-label gates. | Scalping 1m source and cost-aware learning, continuous fresh labels, robust training/validation and cross-instrument generalization. |
| 3. Learned MAHORAGA supervisor | A separate logistic historical meta learner trained on June–July 2026 **after expert weights were frozen**, 10,461 retrospective paper examples across all markets; versioned and integrity-hashed model checkpoint store, research-only confidence/abstention logic. | This is a **paper-win probability filter**, not a validated optimal portfolio, profitable strategy, or live ensemble; real-time combination of all eight concurrent signals requires fresh aligned opportunity data. |
| 4. Honest independent economic evaluation | August 2026 retrospective validation / September 2026 already-inspected retrospective audit with frozen models, paired fixed-vs-specialist-vs-meta opportunity returns, nominal clustered diagnostics and explicit cost scenarios. [Three-market six-month development workflow passed](https://github.com/Elikers/invo-ultimate/actions/runs/44230986053). | **Not independently forward validated**, no actual fills / independently verified execution costs, no correction for all repeated model/market comparisons. |
| 5. Prelaunch release safeguards | Immutable file comparison against separate production checkout, model / data / paired forward blockers, no order privileges, fail-closed readiness / human-only promotion, [independent safety CI passed](https://github.com/Elikers/invo-ultimate/actions/runs/44230713070). | No real deployment or website change approved; economic gates remain **BLOCKED**. |

## Verified dated source evidence

Earlier v7.6 archive research verified eighteen official Binance USD-M monthly ZIPs against source SHA-256 for three symbols, April–September 2026, containing **158,112 market-specific 5m candles (not 158,112 trades)**. v10 re-downloaded/verifies official archives separately for the retrospective training study. Frozen v6.1 simulator stops at 1%, targets 1.5%, holds <=12 five-minute bars; charges **hypothetical** 8 bps round-trip without true funding, spread, latency, exchange matching or execution fills. Existing website strategy source unchanged.

Total in v10 three-market replay:
- April–May: **10,021** chronological specialist-training updates (BTC 3,354; ETH 3,284; SOL 3,383).
- June–July: **10,461** separate supervisory-training updates (BTC 3,424; ETH 3,427; SOL 3,610).
- August–September: **10,165** retrospective labeled paper opportunities scored with no update (BTC 3,302; ETH 3,355; SOL 3,508).
- Scalping: **0** 1m historical examples; live/independent v10 closed trades: **0**.
- Hypothetical net modeled payoff of current learned specialist and supervisor threshold filters during August–September: **0 trades taken**, thus **0% simulated return per opportunity due to abstention** in all six market-month comparison cells. **THIS IS NOT POSITIVE EXPECTANCY, VERIFIED PROFIT, OR PROOF OF A SUPERIOR MODEL.** A model never trading avoids costs and losses but is not sufficient to satisfy the purpose of a profitable trading AI.

### Actual retrospective six month-month comparisons

All numbers below are **mean hypothetical net return per fixed-engine trade opportunity**, 8 bps assumed cost, with the existing seven production engines' simulated trades pooled by symbol and month. Multiple experts can describe overlapping opportunities, so these are not executable independent portfolio returns. The learned filters' zero return results from **no trades**, not realized gains.

| Symbol | Month | Fixed engine reference per opportunity | Adaptive specialists | MAHORAGA meta | MAHORAGA trades |
|---|---|---:|---:|---:|---:|
| BTCUSDT | Aug 2026 | −0.078807% | 0.000000% | 0.000000% | 0 |
| BTCUSDT | Sep 2026 | −0.085079% | 0.000000% | 0.000000% | 0 |
| ETHUSDT | Aug 2026 | −0.077075% | 0.000000% | 0.000000% | 0 |
| ETHUSDT | Sep 2026 | −0.100424% | 0.000000% | 0.000000% | 0 |
| SOLUSDT | Aug 2026 | −0.090921% | 0.000000% | 0.000000% | 0 |
| SOLUSDT | Sep 2026 | −0.054914% | 0.000000% | 0.000000% | 0 |

These retrospectively viewed periods are **not** independent holdouts given previous analysis of April–September data. The supervisor is a cost-insensitive binary win calibrator in its training phase; it should **not** be interpreted as net-profit maximizing yet.

## Offline software verification

- Five new improvements unit suite: [successful Actions run](https://github.com/Elikers/invo-ultimate/actions/runs/44230535232) (before added research registry).
- Complete A–F earlier research rehearsal: [successful Actions run](https://github.com/Elikers/invo-ultimate/actions/runs/44227699446).
- One-shot Hyperliquid order-book WebSocket: [successful Actions run](https://github.com/Elikers/invo-ultimate/actions/runs/44228610063).
- Initial public bounded market capture: [successful Actions run](https://github.com/Elikers/invo-ultimate/actions/runs/44228773828).
- New bounded restart-aware production-independent capture process: [successful Actions run](https://github.com/Elikers/invo-ultimate/actions/runs/44230932237).
- Final separate checkout of production: [successful Actions run](https://github.com/Elikers/invo-ultimate/actions/runs/44230713070).

## Necessary remaining work and blockers

1. Approve a suitable persistent runtime/storage for a **monitored continuous public-only collector**, with drop/reconnect statistics, chronologically normalized derivative contexts, true raw-to-normalized feed provenance and measured uptime. Nothing has been deployed to run continuously or incur paid costs.
2. Obtain and verify genuine 1m plus microstructure data for scalping and preregister that candidate's paper signal, exit and fee assumptions before training.
3. Train and prospectively validate **economic/return** models and jointly timed eight-expert ensemble decisions, not only win/loss labels and single-expert trade filters.
4. Prospectively capture immutable v10 signals, NONES, rejected opportunities, cost evidence and mature outcomes; compare against unchanged fixed engines on future identical time windows. Robust uncertainty, dependent outcomes and multi-testing must be independently assessed.
5. Obtain enough valid forward economic evidence and explicit independent human authorization for any production or website integration. No automatic strategy activation or guaranteed gains.

**Do not claim work is complete at operational or financial level.** This research stage delivered a stronger data/learning/evaluation/safety prototype; activation remains blocked. Any future website status must say `MAHORAGA RESEARCH ONLY — NOT LIVE OR PROFIT-VALIDATED`.
