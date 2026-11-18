# MAHORAGA v10 — Historical Experience Engine (RESEARCH ONLY)

## Verified source preservation
Release: https://github.com/Elikers/invo-ultimate/releases/tag/mahoraga-history5y-20261118

Preservation job independently re-downloaded, rehashed and sealed the **five annual verified artifact shards** and **five official SOL daily repair archives** into release assets. Source: Binance USD-M one-minute historical OHLCV, 2021-11-18 00:00 UTC inclusive to 2026-11-18 00:00 UTC exclusive. 620 original publisher ZIPs; 7,888,320 actual one-minute candles across BTC/ETH/SOL. This data is public exchange market data, NOT MAHORAGA trading history.

All release downloads have a SHA256SUMS.txt file. Keep an off-GitHub copy too: GitHub releases can be modified or deleted and are not regulated immutable archive storage.

## Reproduction and use
- Run CI: `.github/workflows/v10-experience-ci.yml` (unit tests, fail-closed live promotion).
- Preservation: `.github/workflows/v10-experience-preserve.yml` (source ZIP re-verification and release publication).
- Full replay: `.github/workflows/v10-experience-full-replay.yml` (download checksummed release, extract, independently checksum 620 inner archives, normalize each one-minute bar in order, replay each symbol and upload JSONL simulated trade memories/reports).
- Manual: `python3 research/v10/experience/engine.py --symbol BTCUSDT --csv BTCUSDT-1m.csv.gz --out /tmp/experience --require-full-coverage`

Trade records have decision, entry, exit, outcome, gross return, modeled costs, and split. Never substitute these retrospectively simulated trades for authenticated exchange fills or profitable real-world trading experience.

### Research design and anti-leakage
- Signal uses strictly closed OHLCV bars from a fixed 60-minute lookback.
- Signal evaluated only after candle close, next-minute open entry. Single position at a time, no overlapping positions; no leverage or portfolio sizing optimization.
- Stops resolved before takes when a candle crosses both. Adverse entry-to-stop gap fills are not assumed to recover at the stop price.
- Historical chronology: train until 2024-11-17 23:59; validation 2024-11-18–2025-11-17; retrospective test 2025-11-18–2026-11-17. Lookback is reset at split transitions, and remaining open trades are flattened before a new split.
- The historical candidate is a fixed illustrative momentum baseline **not the live MAHORAGA strategy**; no hyperparameters are selected from the test split.
- Per-side fees = 4 bps and slippage = 2 bps in default example. Cost model is configurable. Funding is an explicit absolute proxy and defaults to ZERO: this **understates actual venue costs** and cannot support a genuine net-profitability claim. No historical exchange-specific order-book execution or funding ledger is reconstructed.
- Reported win rate, PF, drawdown, and compounded per-trade return are illustrative independent single-symbol simulation statistics; compounding uses an unrealistic full-equity notional per trade and is **not an investable audited portfolio return**.
- Provenance is Binance USD-M; do not infer executable Hyperliquid liquidity, maker/taker tiers, funding, mark prices, leverage, liquidation, or spreads.

### Promotion safety
No external credentials, exchanges, wallet, website runtime, strategy or production risk files touched. `release_gate.approved_for_live` is always false, including in hypothetically profitable retrospective tests. Model improvements require actual funding/market microstructure data, robust walk-forward selection, cost sensitivity, an independent locked test and new prospective paper/shadow evidence before separate authorization.

### Current boundary
This milestone implements data preservation, normalized ingestion, a tested illustrative retrospective simulator, simulation memories, chronology, reports and a fixed nonpromotion gate. **It does not train a deployed machine-learning model or prove five years of profitable experience.** Full-history profitability metrics must be read from the successful replay workflow's actual uploaded reports, not predicted.
