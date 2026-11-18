# MAHORAGA v10.2 — Verified Strategy Discovery Report
**Run date:** 2026-11-18 UTC. **Branch:** `research/v10.2-strategy-discovery`.
**Outcome:** **NO ELIGIBLE STRATEGY — TRAIN-ONLY SELECTION ABSTAINED ON BTC, ETH AND SOL.** No production deployment, orders, strategy or risk edits.

## GitHub verification
- [Verified completed four-job GitHub Actions run](https://github.com/Elikers/invo-ultimate/actions/runs/44279278062): safety-tests SUCCESS; independent BTC/ETH/SOL normalized-history candidate-comparison jobs SUCCESS.
- Ten new discovery unit tests plus existing replay/adaptive regression tests succeeded.
- Each market job verified source release outer SHA256 checksums, independently checked all 620 publisher-price ZIP hashes, normalized all 7,888,320 original 1-minute observations, and loaded the signed Binance funding release with checksum validation.
- Full machine-readable per-market candidate reports are downloadable from the workflow as three research artifacts, retained until 2026-12-18.

## What was improved
The fixed, research-only registry compares hourly:
1. `trend_12_48` — 12h/48h moving-average gap;
2. `breakout_24` — breakout above/below previous 24h range;
3. `revert_24` — 24h z-score mean reversion;
4. `trend_vol` — trend plus 24h volatility avoidance;
5. `flat_control` — deliberate always-NO-TRADE negative control.

Signals use fully closed 1-hour candles and only enter at next hour open. Costs include assumed taker 4bps and slippage 2bps **each side**, with signed actual published historical Binance funding settlements for positions. Stop-first intrabar handling, adverse gaps, 1.5% stop, 2.5% take and 8-hour maximum holding are fixed.

**Selection rule locked before evaluation:** Every one of four 2023/2024 *training-only* chronological folds must contain at least 30 trades, positive net mean, and profit factor above 1.05. Otherwise abstain. Validation 2024-11-18–2025-11-17 was diagnostic only; the previously inspected 2025-11–2026-10 test was not used for candidate selection. Because no candidate qualified, the simulator deliberately did not select a family or claim a final independent test winner.

## Measured validation diagnostics — no candidate selected
| Symbol | Best validation PF (among traded families) | Named family | Validation trades | Mean simulated net/trade | Selected by earlier train-only gate? |
|---|---:|---|---:|---:|---|
| BTCUSDT | 0.826 | trend_vol | 959 | -0.0871% | NO |
| ETHUSDT | 1.072 | breakout_24 | 410 | +0.0529% | NO |
| SOLUSDT | 0.865 | trend_vol | 1,005 | -0.1082% | NO |

**Important:** The ETH breakout appeared profitable in this one examined validation period but **did not satisfy the four prior training-fold requirements**. It would be improper to promote that isolated validation result or modify the selection rule afterward. These are retrospectively simulated strategy outcomes with incomplete venue-specific execution modeling; not proven profit, actual MAHORAGA trades, independent shadow results, or investable account returns.

## Safety and limits
- All generated results have `selected_training_only=null`, `forward_evidence=0`, `approved_for_live=false`, `auto_promotion=false`, `production_changed=false`.
- Differences from v10.1 are limited to `.github/workflows/v102-discovery.yml` and files under `research/v10/discovery/`.
- The 2025-11 onward interval was exposed in earlier v10/v10.1 research and **cannot be labeled a pristine blind holdout**.
- Historical data comes from Binance, not Hyperliquid. Hourly OHLCV stops and exact intrabar execution cannot recreate actual order book liquidity or liquidation. Signed funding is approximated using verified settlement timestamps; November 2026 coverage is unavailable in this version.
- No live APIs, secrets, order-placement or automatic model promotion.

## Recommended next independent milestone
Do not iterate on this inspected validation result until new registered hypotheses are designed with causal data and explicit research budgets. Prioritize truly new prospective, timestamped paper/shadow observations and source-authenticated matured outcomes; evaluate out-of-sample execution economics (especially on the intended venue) before any proposal to advance candidates. Negative experimental results should be retained as permanent research memory.

**Verdict:** Engineering and safety controls improved. An empirically profitable adaptive MAHORAGA engine has **not** been demonstrated. The right automatic decision today is **NO STRATEGY PROMOTION / NO LIVE CHANGE**.
