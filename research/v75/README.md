# INVO Ultimate v7.5 — Multi-Exchange External Evidence (research only)

Status: **Phase 1 official historical archive source VERIFIED (BTC/ETH/SOL), direct exchange APIs BLOCKED. Historical frozen-engine backtest completed; no production deployment or strategy promotion.**

## Frozen historical replay: completed 2026-11-18

[Github run 44214786658](https://github.com/Elikers/invo-ultimate/actions/runs/44214786658) passed **4/4 jobs**: integration test plus BTC/ETH/SOL historical simulations from 2026-09-01 through 2026-09-14. Each symbol used fourteen checksum-verified daily ZIPs (4,032 five-minute bars), exactly the repository's frozen seven website signals and shared v6.1 simulator. No modified entry/exit logic. The research workflow is branch-only, read-only, and does not touch forward journals or main.

Below: mean net % per trade in the final *historical* chronological fold (8 bps assumed round trip). **Not independent forward evidence.**

| Engine | BTCUSDT | ETHUSDT | SOLUSDT |
|---|---:|---:|---:|
| fusion | -0.108253 | -0.011337 | +0.027185 |
| sweep | -0.116791 | -0.163703 | -0.002847 |
| auction | -0.047939 | -0.450545 | +0.003797 |
| pullback | -0.048987 | -0.088498 | -0.007849 |
| volbreak | -0.142433 | -0.002346 | -0.058610 |
| mean | -0.036077 | -0.044919 | -0.009296 |
| strict | -0.128178 | -0.220246 | -0.230250 |

**Screens:** 0/21 combinations passed frozen screen. BTC: all seven nonpositive; ETH: all seven nonpositive; SOL: fusion (+0.027185%, 14 holdout trades) and auction (+0.003797%, 10 holdout trades) were weakly positive but **INSUFFICIENT_SAMPLES**. At 16 bps cost, both become negative. Many other groups also lacked per-fold sample depth. No strategy candidate selected or promoted.

**Important caveats:** The original `research/run.cjs` has a historical split and 12-bar embargo; we reused it unchanged, including its current screening thresholds. These observations are correlated market/time samples. Exchange-specific maker/taker fees, variable spread/slippage, funding and liquidation are unmodeled, so the '8 bps' and '16 bps' columns are *scenarios*, not verified venue-specific all-in execution costs. This cannot establish live INVO follower profitability, statistical independence or real tradability. Do not use this branch to recommend real-money trading.

### Next gated step
Freeze this reported window before extending the historical horizon. Expand to multiple calendar regimes with *predeclared* dates and no per-engine cherry-picking. Keep all source hashes and record failed archives. Further historical results must remain retrospective; collect genuine new forward data on separately registered prospective strategies for eventual independent proof.

## Historical archive validation: PASSED (2026-11-18)

Source: official Binance Vision USD-M futures daily 5m ZIPs and published SHA-256 checksum files. These are archive downloads (not the blocked Binance Futures REST API). GitHub Actions validation run: [44214209823](https://github.com/Elikers/invo-ultimate/actions/runs/44214209823), **4/4 jobs successful**, including deterministic offline tests.

For UTC date **2026-09-15**, each file had exactly 288 contiguous, valid 5-minute candles:
- BTCUSDT: 288 candles, archive SHA-256 `3cfe0ca88c38ec154dd9086b6b53a40a2d7e064e5acdd5819e6488bfe372c8b7`
- ETHUSDT: 288 candles, archive SHA-256 `15e7c884e055844e9c599b53fb94e27d56c8d3dbc3653180cfba546a6fc335c9`
- SOLUSDT: 288 candles, archive SHA-256 `f5c08c2c1798574322163ca554aca920a766ffd2f042ef985c504b05e4a0eec1`

**Extended source gate:** [Run 44214400055](https://github.com/Elikers/invo-ultimate/actions/runs/44214400055) passed **10/10 jobs**, validating all nine combinations of BTCUSDT/ETHUSDT/SOLUSDT and September 14–16, 2026. This confirms **2,592 individual 5-minute candle rows** across market-days (864 per market), with each daily archive's published SHA-256 matching, complete UTC timestamps and valid OHLCV. These nine archive checks are still a narrow three-day sample, not a multi-exchange comparison or profitability research result.

Tools: `research/v75/archive_audit.py` and `research/v75/test_archive_audit.py`; triggered on research branch updates. The download is ephemeral in CI; no bulk historical data are committed, and no automatic recurring collection has been enabled.

**Important:** One day per market is a connectivity and data-integrity smoke test, not sufficient history for statistical research. Binance Vision is an *alternative transport for Binance historical data*, not an independent exchange. The separate Bybit source remains blocked (HTTP 403), and direct Binance futures REST remains blocked (HTTP 451). Historical candles may later support retrospective checks but cannot create new independent forward observations. Verify instrument specifications, funding, slippage, and other cost assumptions before any comparison to Hyperliquid.

### Next research gate
Extend archive coverage deterministically across multiple complete days/months and report missing files, file integrity, chronology and data provenance. Only after this, execute frozen strategies in a separate offline historical research job with chronological splits and cost sensitivity. No model fitting on holdout and no changes to production.

## Verified November 18, 2026 source gate
- GitHub offline unit tests: SUCCESS (workflow run 44213773299).
- GitHub-hosted public endpoint smoke matrix: FAILED in all six combinations (workflow run 44213848563).
- Binance USD-M HTTP **451** for BTCUSDT, ETHUSDT and SOLUSDT: access denied from GitHub-hosted runner.
- Bybit linear HTTP **403** for BTCUSDT, ETHUSDT and SOLUSDT: access denied from GitHub-hosted runner.
- These are access restrictions observed in our environment, not proof that the endpoints do not work elsewhere. Do not bypass geographic or service restrictions, fabricate candles, or treat denied responses as zero trades.
- **Phase 2 historical comparisons, Phase 3 multi-exchange strategy diagnostics and Phase 4 external forward validation are NOT yet implemented.** No automatic retries are scheduled. Next evaluate a permitted documented public data source or provider access with clear authorization; verify provenance and compatibility before further work.


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
