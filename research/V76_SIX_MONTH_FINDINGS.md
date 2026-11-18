# INVO Ultimate v7.6 — Six-Month Frozen Historical Evaluation

**Completed: November 18, 2026. Status: verified retrospective results; NO profitable production candidate.**

## Evidence and provenance

- [Six-month matrix run 44215386913](https://github.com/Elikers/invo-ultimate/actions/runs/44215386913): **19/19 jobs successful** (source-validation job plus 18 independent market-month jobs).
- [Consolidated report run 44215617462](https://github.com/Elikers/invo-ultimate/actions/runs/44215617462): evidence aggregation **successful**, all 18 market-month JSON artifacts checked.
- Full predeclared window **April 1–September 30, 2026**, BTCUSDT, ETHUSDT, SOLUSDT (Binance USD-M perpetual five-minute OHLCV).
- **158,112 candles**: 183 complete UTC days × 288 candles/day × 3 symbols. Each monthly ZIP verified against official SHA-256 checksum, complete chronological continuity and valid OHLCV. No third-party trader performance claims used.
- **Frozen model**: exact website signal via existing `research/run.cjs` and shared `v61-core.js`; same seven engine IDs, 1% stop, 1.5% target, 12-bar holding period, 8/16 bps hypothetical cost cases. **No fitting, production change, position orders or prospective trade journal edits.**
- **Design limitation**: separate 50/25/25 historical folds **within each calendar month**, with existing 12-bar embargo. The weighted averages below pool each month's final fold; they are **NOT one independent six-month chronological holdout**. Monthly warmups exclude earlier signal opportunities; cross-market observations share market regimes.
- Still excludes exchange-specific actual fills, funding, variable spread/slippage and liquidation.

## Results: weighted net mean percentage per trade over six monthly FINAL folds (8 bps scenario)

| Engine | BTC | ETH | SOL |
|---|---:|---:|---:|
| Fusion | −0.1435% | −0.1753% | −0.1407% |
| Sweep | −0.0494% | −0.0243% | −0.0908% |
| Auction | −0.0814% | −0.0290% | −0.0410% |
| Pullback | −0.1035% | −0.0866% | −0.0969% |
| Volbreak | −0.1262% | −0.1127% | −0.1008% |
| Mean | −0.0311% | −0.0423% | −0.0719% |
| Strict | −0.1868% | −0.1720% | −0.1160% |

- **21/21 market-engine combinations negative** in the weighted monthly final-fold means at 8 bps.
- All 21 are also negative at the stricter 16 bps assumption (same gross return and 8 bps additional assumed cost).
- Among 126 monthly market-engine screens at 8 bps, **one** (SOL Fusion in one month) passed the existing historical screen, but SOL Fusion showed positive monthly final-fold mean in only **1 of 6 months**, and a negative six-month weighted monthly final-fold mean (**−0.1407%**). No engine is selected.
- Monthly model screen is only a screening heuristic, not evidence of independent prospective validation. Multiple comparisons, non-independence and sampling uncertainty make isolated passing months especially unreliable.

## Recommendation / research gate

Keep production v6.9 and risk settings **frozen**, continue collecting genuinely new forward-paper trades, and avoid live-money promotion. The long retrospective suggests the fixed strategy rules lack robust profitability under these hypothetical cost cases. It does not establish that a new tweak would help. Only future preregistered, independent observations and realistic execution evidence can improve confidence.

Artifacts: detailed market-month JSON outputs are retained by GitHub Actions for 14 days; the consolidated six-month summary artifact for 30 days. This narrative report preserves conclusions but not all 18 raw datasets. No recurring six-month job scheduled.

