# MAHORAGA v10 Historical Experience — Verified First Full Replay

Date: 2026-11-18 UTC. Workflow: https://github.com/Elikers/invo-ultimate/actions/runs/44275316419

## Evidence quality
- Successfully normalized **7,888,320** verified public Binance USD-M one-minute candles covering **BTCUSDT, ETHUSDT and SOLUSDT**, 2021-11-18 to 2026-11-17 inclusive.
- Replayed **150,025 simulated trades** using a **fixed illustrative 60-minute momentum baseline**, **NOT the production MAHORAGA strategy**.
- Fixed illustrative assumptions: 4 bps taker fee and 2 bps adverse slippage **per side**, 12 bps round trip in total; 0 bps funding proxy (therefore **understates actual costs**). SL=0.8%, TP=1.2%, max hold=60 minutes. No exchange order book, leverage or liquidation model.
- No optimizer/trained MAHORAGA model was evaluated. This was a causality and economic-baseline diagnostic, not evidence of profitable AI learning.

## Per-symbol counts / retrospective last-year test (2025-11-18–2026-11-17)
| Market | Full period simulated trades | Test trades | Test win rate | Test profit factor | Test mean per-trade net return |
|---|---:|---:|---:|---:|---:|
| BTCUSDT | 35,961 | 6,417 | 33.94% | 0.533 | -0.1255% |
| ETHUSDT | 46,300 | 8,224 | 35.37% | 0.632 | -0.1148% |
| SOLUSDT | 67,764 | 9,323 | 37.91% | 0.642 | -0.1191% |

Each test profit factor is below 1.0; the illustrative baseline **failed** economic testing for each market even before actual funding, exchange-specific fills and other operational costs. Do **not** activate it.

The engine's compounded-per-trade statistic assumes hypothetical full-equity notional reinvestment and is not an investable portfolio return. We intentionally do not present the near-total mathematical drawdown as an audited account result.

## Verified safety and phase status
- Original source preservation: SUCCESS, https://github.com/Elikers/invo-ultimate/actions/runs/44275006085 ; public checksum-backed release: https://github.com/Elikers/invo-ultimate/releases/tag/mahoraga-history5y-20261118
- Research simulator and safety unit tests: SUCCESS, https://github.com/Elikers/invo-ultimate/actions/runs/44275395508
- Five-year normalize/replay/report: SUCCESS, https://github.com/Elikers/invo-ultimate/actions/runs/44275316419
- Live trading activation: **DENIED**. No production strategy, website or risk parameter changed.
- Evidence artifact with simulated trade JSONL and machine reports attached to the full replay workflow; artifact retention 30 days, whereas publisher source ZIPs are preserved as GitHub Release assets.

## Next scientific requirements
1. Obtain timestamp-aligned historical funding settlements and defensible venue-specific fee/slippage models; represent unavailable cost features as missing, not as zero evidence.
2. Add immutable point-in-time context and train-only candidate selection with walk-forward embargo, followed by an independently locked last-year test that is not repeatedly optimized.
3. Test sensitivity to adverse costs, outages, missing context and volatility regimes.
4. Collect independent future shadow/paper decisions with authenticated timestamped outcomes, then require separate human authorization before ever considering production release.

**No profitability, current live accuracy, or MAHORAGA auto-learning success has been demonstrated by these simulations.**
