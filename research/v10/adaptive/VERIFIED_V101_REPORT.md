# MAHORAGA v10.1 — Consolidated Verified Research Report
**UTC date:** 2026-11-18. **Branch:** `research/v10.1-adaptive-profitability`.
**Result:** Historical adaptive filter is NOT profitable; forward authorization is BLOCKED. No production strategy/risk changes.

## Independent completed workflows
- [Phase A/C test + full three-market adaptive replay](https://github.com/Elikers/invo-ultimate/actions/runs/44277400248): SUCCESS; 12 unit tests passed including baseline and adaptive causality/label/funding input checks.
- [180-month publisher funding audit (60 months per market)](https://github.com/Elikers/invo-ultimate/actions/runs/44277508370): SUCCESS all three markets, through **October 2026** (not November).
- [Checksum-backed funding evidence release sealing](https://github.com/Elikers/invo-ultimate/actions/runs/44277714331): SUCCESS.
- [Signed funding settlement reconciliation](https://github.com/Elikers/invo-ultimate/actions/runs/44277989669): SUCCESS.
- Source immutable snapshot release: https://github.com/Elikers/invo-ultimate/releases/tag/mahoraga-history5y-20261118

## A — Historical fees, execution and funding
- BTC, ETH, SOL: 7,888,320 original checksum-verified Binance USD-M 1-minute observations retained in release.
- Retrieved **180 independently checksum-verified monthly funding archives**, 2021-11 through 2026-10. Reconciliation applies each publisher-settled rate to historical simulated positions with LONG paying a positive rate and SHORT receiving it, or the converse when negative.
- November 1–17, 2026 has no verified funding archive in this version. Trades there are explicitly excluded from funding-reconciled metrics. Historical exchange order books, mark-price liquidation, stochastic fills, actual Hyperliquid fees and market impact remain unavailable. No claim of full realistic live executions.

## B — Candidate adaptive NO-TRADE learner
- Illustrative fixed 60-minute momentum research baseline from v10; **not the production MAHORAGA strategy**.
- The learner computes trade-outcome expectancy by side and UTC hour. Only matured TRAIN exits can fit a model, with a minimum sample rule and shrinkage. No predictions, outcomes or features from the future test period are fed into training. Only fixed pre-registered thresholds (-0.001, -0.0005, 0, 0.00025) can be selected.
- Candidate is selected by two chronological TRAIN-only forward development folds; no automatic promotion or dynamic adjustment of live risk settings. Selection threshold was **-0.001** on all three markets.
- Candidate is replayed from the original candles with filtered signals, not selected post-hoc from a favorable list of baseline trades.

## C — Results (historical final-year test previously exposed; not blind)
| Symbol | Baseline trades | Baseline PF | Adaptive trades | Adaptive PF | Adaptive mean net/trade |
|:--|--:|--:|--:|--:|--:|
| BTCUSDT | 6,417 | 0.533 | 2,078 | 0.585 | -0.1157% |
| ETHUSDT | 8,224 | 0.632 | 3,018 | 0.623 | -0.1209% |
| SOLUSDT | 9,323 | 0.642 | 2,672 | 0.652 | -0.1165% |

All three adaptive PFs are **below 1.0**. The BTC and SOL filters modestly raise historical PF but cannot yield positive net expectancy; ETH degrades. Additional adverse costs of 4, 10, or 20 bps **per side** further deteriorated net economics. This is a diagnostic, not a viable alpha discovery.

### Publisher funding reconciled subset
(Funding verified only through October 2026; November trades excluded.)
| Symbol | Reconciled candidate trades | Excluded unknown-funding trades | Signed funding-adjusted PF | Funding-adjusted mean/trade |
|:--|--:|--:|--:|--:|
| BTCUSDT | 1,965 | 113 | 0.585 | -0.1150% |
| ETHUSDT | 2,854 | 164 | 0.621 | -0.1211% |
| SOLUSDT | 2,534 | 138 | 0.639 | -0.1217% |

These adjusted returns still use **modeled** 4bps taker fees and 2bps slippage per side. Funding reconciliation operates on a different subset and must not be misread as a precise apples-to-apples full-year gain.

## D — Independent forward evidence and release safety
- 2025-11 to 2026-11 test interval was already inspected in the v10 baseline project; **it cannot honestly be called a pristine independent test**.
- No authenticated newly arrived prospective trading decisions or matured shadow account labels were supplied and verified for the new v10.1 candidate. Forward sample count = **0**.
- `forward_gate.py` requires causality, source validation, unique predictions and independent attestation to even mark evidence quality acceptable. It **never promotes** a model.
- All reports enforce `approved_for_live=false`. No wallet API, order entry, production website, production strategy, or risk parameter files were changed. The only inherited source-file modification is the optional research-only `signal_filter` argument in `research/v10/experience/engine.py`; calling the engine without it yields the unchanged baseline logic.

## Verdict and next requirements
**RESEARCH INFRASTRUCTURE: IMPLEMENTED AND TESTED. CANDIDATE: REJECTED FOR PROFITABILITY. PRODUCTION: FROZEN.**

Before further model development: source independent forward periods, improve venue-specific execution and intrabar fill assumptions, explicitly reconcile November 2026 missing funding or exclude it, choose candidates using closed historical development only, record paper decisions *before* their outcomes occur, and require separately authorized human approval for any future live change. Even apparent profitability is not a guarantee.
