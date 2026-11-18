# INVO v8.1 — Economics, Risk, and Market Regime Research

**Research-only implementation. Production v6.9 remains frozen. No strategy promotion or actual trades.**

## What was learned from v8.0 external scan

The [global strategy evidence scan](../v80/global-strategy-evidence-scan.md) found that published AI-leaderboard win rates and backtest ROI cannot substitute for audited net expectancy and complete execution-cost accounting. INVO v7.6 found negative retrospective six-month weighted monthly final-fold results in 21/21 market/engine groups at hypothetical 8 bps.

## Implemented: economics foundation

- `costs.cjs`: deterministic repricing of **unchanged** v6.1 simulator trade records, supporting fee + spread + slippage + flat hypothetical funding buckets, mean net risk-unit R, average holding bars, exit reason counts, expectancy, profit factor, max drawdown and sample-equity estimate.
- All numbers are **assumed bps**, not sourced from an actual venue fee schedule. `optimistic` 8, `base` 16, `stressed` 40 and `severe` 78 bps. The 78 bps total was corrected after CI caught a test expectation mismatch.
- `stress_summary.py`: independently reprices v7.6's validated aggregate historical final-fold expectancy across those exact scenarios, preserving all 21 market-engine combos and sample counts. This algebraic sensitivity check is **not** a new independent backtest; it cannot model feedback from different price fills, liquidation, tick-size effects, realistic time-dependent funding or open inventory.
- `research-design.json`: registration-style frozen study design, with no candidate activation.
- `regimes.cjs`: read-only trend and volatility labels based only on completed candles, using the *existing descriptive* v6.6 thresholds (2h ±1% trend, high 0.55% and low 0.18% mean recent 5m range). This **does not filter trades or change signals**; no strategy was selected using already seen 2026-04..09 data. The tests explicitly verify changing future candles cannot alter past labels.

## Verification and status

- Cost accounting: [v8.1 CI passed](https://github.com/Elikers/invo-ultimate/actions/runs/44218765049).
- Past-only regime labeling: [v8.1 CI passed](https://github.com/Elikers/invo-ultimate/actions/runs/44218893769).
- Repricing report: [GitHub run 44219011741](https://github.com/Elikers/invo-ultimate/actions/runs/44219011741) **PASSED**, using the historical [v7.6 verified summary artifact](https://github.com/Elikers/invo-ultimate/actions/runs/44215617462). It validated all **21** market-engine groups and found **0 positive weighted historical mean net returns** at **8, 16, 40, or 78 bps** assumed total round-trip costs. These are *algebraic re-prices of the same historical fills*, not a new execution simulation or independent 21 trials.
- Scripts and tests in `research/v81/`. Separate branch `research/v7.5-multi-exchange`. No writes to `main`.

## What we cannot conclude

- No new source-grounded proof of what "profitable AI bots" do internally; public ranking can be survivorship biased and fail to include unrealized losses.
- Zero basis point "funding" in scenarios is not an estimate of zero actual funding.
- Synthetic 8/16/40/78 bps re-pricing is not an actual exchange execution ledger or market impact model.
- The month-local 25% fold samples from v7.6 are historical, not a single fully unseen continuous holdout.
- No JUP historical archive was validated for this six-month stress, so JUP is not invented or extrapolated.
- Candidate regime filters or 1h/4h systems are **not** now proven or activated; require separate prospective registration with new genuine forward observations.
- The v7.9 external scheduler remains not deployed, and v7.8 identified a stale collector as of its audit.

## Rational next gates

1. Restore and verify reliable prospective market collection; avoid backfilling or fabricating missed signal times.
2. Acquire venue-specific, timestamped public funding rates and fee rules and measured spread/slippage from eligible permitted data sources before calling any modeled costs realistic. If unavailable, retain scenario-only labels.
3. Freeze and prospectively collect candidate-versus-unchanged-baseline evidence on future candles, with independent forward period, market clustering, sample floors and 95% uncertainty.
4. Reject or retain candidates based on **net** expectancy and tail losses after realistic costs, not win rate. No automatic live promotion or change to production risk.

**Outcome of this engineering phase:** Improved research measurement and discipline, not improved realized trading profits.
