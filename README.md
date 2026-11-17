# INVO Ultimate v6.1 — Profitability Validation

Research-only dashboard for BTC, ETH, SOL and JUP. **No live trading and no independently established profitable strategy.**

## Website
https://elikers.github.io/invo-ultimate/

## v6.1
- Adds a hypothetical fixed-exit **closed-trade** simulator to the v6.0 signal-edge audit.
- Uses completed 5-minute candles; signals are entered at the following candle's open.
- Uses **1% stop, 1.5% take profit, 12-bar maximum hold** with configurable illustrative round-trip costs (default 8 bps).
- Conservative same-bar ambiguity resolves to the stop; adverse stop gaps fill at the next bar's open.
- Reports trade count, net expectancy, net profit factor, maximum equity drawdown, and compounded results.
- Separately reports first 70% and last 30% of the available historical window. This is **not independent forward validation**, and settings are not optimized.
- Export a hypothetical trade ledger and run in-browser engine self-tests.
- Real-world spread variation, exchange slippage/fills, latency, funding and liquidation risk are **not modeled**. Simulated profits must not be treated as investable performance.

## Deployment
Pushes to `main` trigger `.github/workflows/deploy.yml`, including syntax checks and deterministic accounting unit tests before GitHub Pages deployment. Set the Pages source to **GitHub Actions** in repository settings if necessary.

## Browser use
Open the website in Chrome. The v6.1 module reuses existing 5-minute history and strategy signals. If market history is unavailable, no backtest is reported. No API key or real-money execution is required.
