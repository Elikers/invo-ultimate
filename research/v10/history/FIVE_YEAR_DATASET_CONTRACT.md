# MAHORAGA — Five-Year Historical Futures Dataset

This branch contains **read-only historical source acquisition**, NOT past MAHORAGA trades or proof of strategy skill.

## Dataset contract

- **Window:** 2021-11-01 00:00 UTC through 2026-10-31 23:59 UTC — 60 complete calendar months.
- **Markets:** Binance USD-M perpetual futures **BTCUSDT, ETHUSDT, SOLUSDT**.
- **Time frame:** original **1-minute klines**, twelve-column Binance archive schema.
- **Expected raw points:** 2,629,440 one-minute bars per instrument (**7,888,320 across three**) if every minute is present and valid.
- **Files:** 180 original published monthly ZIP files plus their official `.CHECKSUM` files and source-manifest JSON.
- **Source:** official [Binance Public Data](https://github.com/binance/binance-public-data), `https://data.binance.vision/data/futures/um/monthly/klines/{SYMBOL}/1m/{SYMBOL}-1m-{YYYY-MM}.zip`.
- **Reference venue:** Binance. **This is not the historical Hyperliquid order book, spreads, account execution or actual MAHORAGA trading record.**

## Validation requirements

`five_year_collect.py` downloads the raw ZIP and the archive's official SHA-256 file. It refuses to mark a month verified unless the checksum matches, the ZIP is readable, the file contains valid positive OHLCV values, timestamps are ordered, within the specified month and aligned to a minute. Missing candles remain explicit gaps; **never fill or invent data**. Duplicate/non-monotonic candles are hard failures. Missing archive/checksum is a failed month, not a zero-activity month. Each monthly source manifest includes rows, expected minutes, missing minutes and hash/provenance. A shard succeeds only when every requested monthly archive passes official checksum verification; a source gap is recorded and excluded from automatic approval.

## Original raw data preservation

The GitHub Actions workflow **`v10-five-year-history-full.yml`** runs 18 independently bounded symbol-year jobs (2021: 2 months, 2022–2025: 12 months each, 2026: 10 months). Each job attaches original ZIPs, checksums, per-month manifests and shard summaries to the workflow run as separate **30-day temporary artifacts**. This is **temporary research transfer storage, not a durable historical database**. Download or externally archive the verified dataset before artifact expiry; any later storage setup must be separately approved. No exchange API keys or paid servers are configured.

## Training integrity

Every source record is tagged `source_venue=BINANCE_USDM_NOT_HYPERLIQUID`, `forward_evidence=false`, `market_data_only=true` and `training_approved=false`. Historical prices cannot be relabeled as prospective predictions. This archive can be used for **retrospective hypothesis development** only after an independent feature contract, chronological walk-forward splits, venue mismatch review and registered cost model. Historical 1m klines do **not** contain historical full order-book snapshots, executable spreads, funding payments, trade fills, or MAHORAGA's prior decisions. Missing channels must stay missing.

## Phase reporting

The first pilot validated six monthly original archives for Nov–Dec 2021 across all three instruments (**263,520 source candles, 0 missing minutes**). [Pilot CI evidence](https://github.com/Elikers/invo-ultimate/actions/runs/44272287685). The separate five-year acquisition run must independently verify all 180 months before the full five-year dataset can be described as complete. Check its workflow result, each of the 18 shard statuses, and actual manifests rather than inferring completion from this README.
