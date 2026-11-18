# INVO Ultimate v7.5 — Multi-Exchange External Evidence (research only)

Status: **Phase 1 offline adapters PASS; live source gate BLOCKED. No production deployment or external data ingestion.**

## Verified November 18, 2026 source gate
- GitHub offline unit tests: SUCCESS (workflow run 44213773299).
- GitHub-hosted public endpoint smoke matrix: FAILED in all six combinations (workflow run 44213848563).
- Binance USD-M HTTP **451** for BTCUSDT, ETHUSDT and SOLUSDT: access denied from GitHub-hosted runner.
- Bybit linear HTTP **403** for BTCUSDT, ETHUSDT and SOLUSDT: access denied from GitHub-hosted runner.
- These are access restrictions observed in our environment, not proof that the endpoints do not work elsewhere. Do not bypass geographic or service restrictions, fabricate candles, or treat denied responses as zero trades.
- **Phase 2 historical comparisons, Phase 3 multi-exchange strategy diagnostics and Phase 4 external forward validation are NOT implemented or approved.** No automatic retries are scheduled. Next evaluate a permitted documented public data source or provider access with clear authorization; verify provenance and compatibility before further work.


## Frozen baseline
Production remains on main unchanged. This branch does not edit trading rules, risk settings, production workflows, live order logic, or forward-paper journal. Baseline Hyperliquid 5m research uses seven rules (fusion, sweep, auction, pullback, volbreak, mean, strict); 1% stop, 1.5% target, 12 bars maximum, 8/16 bps scenarios. Those are NOT assumed to be executable on other venues.

## Phase 1 sources
- Binance **USD-M futures** BTCUSDT, ETHUSDT, SOLUSDT /fapi/v1/klines: https://developers.binance.com/docs/derivatives/usds-margined-futures/market-data/rest-api/Kline-Candlestick-Data ; historical archive: https://github.com/binance/binance-public-data
- Bybit **linear USDT perpetual** BTCUSDT, ETHUSDT, SOLUSDT /v5/market/kline: https://bybit-exchange.github.io/docs/v5/market/kline
- OKX: future candidate only, requires instrument metadata and clock semantics validation first.
- JUP and other assets are **not silently mapped** to unrelated or missing contracts.

## Usage
`node research/v75/exchanges.test.cjs` (offline, mocked, no network)
`node research/v75/exchanges.cjs binance BTCUSDT` (manual public read-only smoke test)
`node research/v75/exchanges.cjs bybit BTCUSDT` (manual public read-only smoke test)

Each API request has a 12-second timeout, capped 200 candles, strictly validates OHLCV, sorts the returned Bybit newest-first series, detects duplicates/gaps and excludes incomplete 5m candles. API failure is a hard failure; no substitution, synthetic candles, or retrospective labeling as forward evidence. This exploratory adapter does not store historical output or update website reports.

## Phase gates
1. **Source fidelity**: verify exchange API response and timestamps in real hosted runs; check market symbols, contract details, API limits, historical coverage and rate-limit compliance.
2. **Historical comparisons**: only after source gate, run the EXACT frozen engine code against venue-correct comparable candles, with per-venue fee/funding/slippage assumptions, chronological windows and an embargo. No refitting on a holdout.
3. **Diagnostics**: break down results by strategy, exchange and regime, explicitly correct for multiple comparisons and cross-venue correlation.
4. **Forward**: prospectively register a frozen candidate before first new observation. No promotion to production, no claim that multiple venue copies yield independent evidence, no real-money orders.

**Limitations:** 5m OHLCV cannot reconstruct order-book liquidity, intra-bar fill order, funding or liquidation behavior. A cross-venue candle comparison alone says NOTHING about profitability. Historical records from correlated venues are not independent forward samples. All external endpoints are unauthenticated/public and require internet connectivity to smoke test.
