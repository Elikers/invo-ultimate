# MAHORAGA — Verified Five-Year Historical Market Archive Collection

**Collected:** November 18, 2026, UTC+8  
**GitHub workflow:** [MAHORAGA Five-Year BTC ETH SOL Futures Historical Acquisition — SUCCESS](https://github.com/Elikers/invo-ultimate/actions/runs/44272498664)  
**Research branch:** `research/v10-five-year-history`  
**Production trading changes:** NONE.

## Confirmed result

| Metric | Verified value |
|---|---:|
| Instrument universe | BTCUSDT, ETHUSDT, SOLUSDT |
| Market/source | Binance USDT-margined perpetual futures — **NOT Hyperliquid** |
| Historical window | 2021-11-01 through 2026-10-31 UTC |
| Complete calendar months per market | 60 |
| Source monthly ZIP archives checked | **180 / 180** |
| Official per-ZIP SHA-256 checksums verified | **180 / 180** |
| Missing or failed monthly archives | **0** |
| Minute slots in five-year window, all three assets | **7,888,320** |
| Actual valid candle rows | **7,881,120** |
| Missing one-minute slots (not backfilled) | **7,200** |
| Months with gaps | **2 of 180** |
| Gap-free verified monthly archives | **178 of 180** |
| GitHub symbol-year jobs | **18 / 18 successful** |
| GitHub artifact shards available | **18** |
| Temporary GitHub archive artifact payload total | **321.45 MB** |
| Forward MAHORAGA paper or real trades | **0 created by this historical collection** |
| Verified trading edge from this dataset | **NOT ESTABLISHED** |

The expected minute count covers 1,826 calendar days (one leap year) × 1,440 minutes/day × 3 markets.

## Explicit missing source candles

- **SOLUSDT, February 2022:** 36,000 source candles; 4,320 one-minute slots absent (3 days).
- **SOLUSDT, April 2022:** 40,320 source candles; 2,880 one-minute slots absent (2 days).
- All remaining 178 monthly source archives had no minute gaps detected by the chronology validator.

All 180 original ZIP files passed Binance's checksum validation. Gaps are **within publisher-verified original archives**, not failures to download. We did not impute or fabricate those missing historical prices. The per-month manifests contain first/last event timestamps and explicit gap ranges for later masking.

## Saved original data

All raw archive ZIPs, publisher `.CHECKSUM` proofs, per-month validation manifests and per-shard summaries are attached to the [successful acquisition workflow run](https://github.com/Elikers/invo-ultimate/actions/runs/44272498664) under **Artifacts**, split into 18 named symbol-year downloads (e.g. `mahoraga-history-BTCUSDT-2024-raw`). The 18 original transfers occupy approximately 321.45 MB of compressed GitHub artifact storage.

**Critical retention limit:** the artifact ZIPs expire **December 18, 2026, approximately 09:04–09:07 UTC** (17:04–17:07 Philippine time). This is temporary transfer storage, **not** a permanent training data lake. The collection script and dataset contract are retained in the branch; do not assume the full raw historical candles remain available after those artifact expirations. Archive them to independent storage before expiration if we want long-term use.

## Validity and next gates

1. **Data source mismatch:** This is Binance futures market history, not Hyperliquid execution/order-book data. Document all vendor and structural differences before attempting to infer trade profitability on Hyperliquid.
2. **Candles are not simulated trader experiences:** Historical OHLCV rows reveal prices/volume but not genuine recorded expert predictions, fills, full depth, spread at execution, liquidation order, slippage, funding payments or live risk conditions.
3. **Gapped training:** For SOL 2022-02 and 2022-04, prevent model windows from crossing missing-candle spans; keep immutable provenance masks and exclude invalid windows.
4. **No lookahead:** Register chronological train/validation/test periods, lock code and features before evaluation, simulate with explicit fees/slippage/funding assumptions, and report uncertainty. Never reuse this historical data as independent post-registration forward evidence.
5. **Risk settings frozen:** No exchange orders, website strategy modifications, model promotion or profitability claims are authorized by this data acquisition.
6. **Persistent storage required:** A temporary GitHub Actions artifact is not an always-on training environment or a durable long-term store.

**Bottom line:** A real five-year, three-asset public historical futures dataset has been gathered and independently source-checksummed. It is a substantial retrospective research foundation, with explicitly documented missing SOL candles. It is **not** five years of actual MAHORAGA trades, and the automatic live-learning system remains OFF.
