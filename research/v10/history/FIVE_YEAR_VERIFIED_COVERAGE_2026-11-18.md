# MAHORAGA verified five-year 1-minute historical market archive

**Audit date:** 2026-11-18 UTC. **Research source:** [Binance public USD-M perpetual futures 1m archives](https://data.binance.vision/). **Separate venue from Hyperliquid.**

**Collection:** GitHub [successful 18-shard acquisition run](https://github.com/Elikers/invo-ultimate/actions/runs/44272498664), reporting 180 original monthly ZIP archives, 0 archive download/checksum failures, 7,881,120 observed one-minute OHLCV rows, 7,200 explicitly missing minutes, within **2021-11-01 through 2026-10-31 (60 complete calendar months)**. Expected rows including missing intervals: 7,888,320. Coverage 99.908726%. Each verified ZIP matches the publisher's SHA-256 CHECKSUM; official checksum verification does not imply continuous coverage or real strategy profit.

**Important gaps:** SOLUSDT 2022-02 missing 4,320 minutes; SOLUSDT 2022-04 missing 2,880 minutes. Do not interpolate, substitute zero, or count missing source minutes as actual trading activity. All other monthly shards report zero missing one-minute candles. This is historical venue data, **not five years of Mahoraga live trading experience** and **not eligible for the pre-registered v10 forward shadow test**.

| Market | Year | Months | Verified candles | Missing minutes |
|---|---:|---:|---:|---:|
| BTCUSDT | 2021 | 2 | 87,840 | 0 |
| BTCUSDT | 2022 | 12 | 525,600 | 0 |
| BTCUSDT | 2023 | 12 | 525,600 | 0 |
| BTCUSDT | 2024 | 12 | 527,040 | 0 |
| BTCUSDT | 2025 | 12 | 525,600 | 0 |
| BTCUSDT | 2026 | 10 | 437,760 | 0 |
| ETHUSDT | 2021 | 2 | 87,840 | 0 |
| ETHUSDT | 2022 | 12 | 525,600 | 0 |
| ETHUSDT | 2023 | 12 | 525,600 | 0 |
| ETHUSDT | 2024 | 12 | 527,040 | 0 |
| ETHUSDT | 2025 | 12 | 525,600 | 0 |
| ETHUSDT | 2026 | 10 | 437,760 | 0 |
| SOLUSDT | 2021 | 2 | 87,840 | 0 |
| SOLUSDT | 2022 | 12 | 518,400 | 7,200 |
| SOLUSDT | 2023 | 12 | 525,600 | 0 |
| SOLUSDT | 2024 | 12 | 527,040 | 0 |
| SOLUSDT | 2025 | 12 | 525,600 | 0 |
| SOLUSDT | 2026 | 10 | 437,760 | 0 |

## Where the actual data is

The successful GitHub run uploaded **18 artifacts**, one year-by-market shard, totaling approximately **321.4 MB** of original ZIPs and per-month SHA-256 provenance manifests. The artifacts are available via the [Actions run's Artifacts section](https://github.com/Elikers/invo-ultimate/actions/runs/44272498664) and expire around **2026-12-18 09:05–09:07 UTC** (reported by GitHub). **Artifacts are temporary, not durable permanent storage**; do not claim that the repo contains the entire 321 MB. The original publisher ZIP URLs remain in each manifest, and the reproducible acquisition script in this branch can download the source again.

## Research use and safeguards

- Split chronologically and maintain separate development, validation, and independent test intervals.
- Respect the SOL historical data gaps; missing source records must fail closed, not generate synthetic zero or backfilled candles.
- Futures USD-M Binance market behavior, fees, funding, executions and order-book liquidity are **not the same as Hyperliquid**. This archive is useful for prior-market-regime context and historical offline experiments, not exchange-specific live execution proof.
- For simulated trading experiences, freeze the actual eight-engine research strategy/exit/cost definitions **before** producing retrospective paper labels; label the results as hypothetical, never as live or as independent forward proof.
- Maintain separate authentic prospective MAHORAGA predictions and outcomes. Do not train v10 registered TEST samples or auto-promote into production.
- GitHub research branch only; production website, account settings, live trading and risk parameters remain unchanged.

**Status:** FIVE-YEAR HISTORICAL SOURCE ACQUIRED AND CHECKSUM VERIFIED; TWO SOL MONTHS INCOMPLETE; ZERO VERIFIED LIVE MAHORAGA HISTORICAL TRADES; NO AUTO-LEARNING/PROFITABILITY CLAIM.
