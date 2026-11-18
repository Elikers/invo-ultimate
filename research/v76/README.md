# INVO Ultimate v7.6 — Six-Month Historical Research (verified)

**Status: COMPLETED, RESEARCH ONLY. No strategy promotion. Production main untouched.**

## Scope and verification

- Predeclared period: **April 1–September 30, 2026 UTC**, six complete months.
- Instruments: Binance USD-M futures BTCUSDT, ETHUSDT, SOLUSDT; **not** INVO executed prices.
- Eighteen monthly official Binance Vision ZIPs, each validated against official published SHA-256 and checked for UTC continuity, complete 5m candles and OHLCV integrity.
- Total: **158,112 five-minute market-specific candles**, across 3 markets and 183 days; not 158,112 independent trading outcomes.
- **Seven unchanged production website signal rules** evaluated by the existing v6.1 historical simulator; stop 1%, take profit 1.5%, hold 12 bars; hypothetical 8- and 16-bps round-trip cost scenarios.
- [19/19 offline validation + 18 market-month simulations passed](https://github.com/Elikers/invo-ultimate/actions/runs/44215386913).
- [Independent aggregation of all 18 retained artifacts passed](https://github.com/Elikers/invo-ultimate/actions/runs/44215617462); [aggregate artifact](https://github.com/Elikers/invo-ultimate/actions/runs/44215617462/artifacts/14388860352).
- No live execution, candidate approval, risk settings changes, or new independent forward-paper trades.

## Results: six-month per-market/per-engine historical summary

Each value is **trade-count weighted mean net percentage per simulated trade across six *monthly last 25% historical folds***, at the *hypothetical 8-bps round-trip* cost. This is **not** a single six-month chronological holdout and cannot be interpreted as actual exchange wallet PnL. The count is the total number of simulated last-fold trades across the six separate months.

| Engine | BTC mean (n) | ETH mean (n) | SOL mean (n) |
|---|---:|---:|---:|
| fusion | −0.1435% (238) | −0.1753% (238) | −0.1407% (231) |
| sweep | −0.0494% (572) | −0.0243% (558) | −0.0908% (553) |
| auction | −0.0814% (134) | −0.0290% (136) | −0.0410% (126) |
| pullback | −0.1035% (445) | −0.0866% (464) | −0.0969% (469) |
| volbreak | −0.1262% (456) | −0.1127% (454) | −0.1008% (473) |
| mean | −0.0311% (562) | −0.0423% (577) | −0.0719% (625) |
| strict | −0.1868% (102) | −0.1720% (105) | −0.1160% (92) |

**Finding: all 21 market/engine weighted means negative at 8 bps.** The 16-bps scenario is still more negative (same historical signals/exits, 0.08 percentage point extra cost). No group has a positive weighted six-month result at either cost.

One **SOL Fusion** monthly evaluation passed the historical screen at 8 bps (1 of 6 months), but its weighted last-fold result over all six months is **−0.1407%**; no 16-bps SOL Fusion month passed. A single selected month is not evidence for profitable production deployment.

## Research honesty and limitations

- Archive integrity and successful CI jobs establish that these historical programs executed and verified their data; neither proves that forecasts or live fills work.
- Signals share correlated cryptocurrency market regimes. Market-month folds are not independent forward trials, and prior discussions/results may influence future research choices.
- Monthly fold resets exclude each month's first 65-bar warmup and discard entries straddling month boundaries; do not treat the weighted summary as a continuous portfolio or a properly isolated six-month out-of-sample evaluation.
- The simulator's costs (8/16 bps) are *scenarios*, not validated all-in fees; excludes variable spread/slippage, funding, liquidation and order-book executions. More realistic costs could worsen outcomes.
- The held-out folds are historical retrospective comparisons rather than independently preregistered forward trades.
- Explicitly **do not** cherry-pick a favorable month, loosen frozen thresholds, modify risk, promise profitability, or merge these scripts into main without new separate authorization and evidence.

## Next gated research action

Keep the production frozen. Continue independent prospective forward collection using the existing research system. If later considering research-only new hypotheses, preregister them separately and use genuinely unseen subsequent candles; do not iterate on the same April–September historical folds and call them fresh holdouts.

For repeatability, scripts are in `research/v76/`, the CI workflow is `.github/workflows/v76-history.yml`, and aggregate reproducibility check is `research/v76-summary.py` and `.github/workflows/v76-summary.yml`.
