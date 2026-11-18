# MAHORAGA v10 — Data Architecture Foundation

**Status:** research design + provenance JSON Schema + offline integrity tests **implemented**. No persistent live feed, trained AI, external deployment, production strategy modification, exchange account access, or orders.

## Goal

Feed the eight proposed learning specialists and the separate MAHORAGA supervisory learner with **reproducible, truly time-available** public data, rather than treating a successful backtest or newly observed price candle as proof of a profitable strategy.

The system has **four isolated lanes**:

1. **Raw public market events** — first Hyperliquid `l2Book`, `trades`, `bbo` (if necessary); later a distinct Binance USD-M comparison feed. Save unmodified raw event bytes to immutable object storage and a SHA-256 per message.
2. **Derivatives context** — market/mark/oracle price, open interest and periodic funding rates from `activeAssetCtx` and/or documented info endpoints. Preserve each feed's exact exchange timestamp; when a native source event timestamp is absent, distinguish observed-at from source-timestamped inputs and **do not misstate provenance**.
3. **Engine feedback** — for each actual-time signal: engine and immutable version SHA, market, observed timestamp, raw-input hashes, feature snapshot id, LONG/SHORT/NONE, abstention reason, predicted horizon, registration id, mature-after time, baseline decision and later outcome. Labels are appended only after their future window closes. Never overwrite a prior prediction to improve retrospective accuracy.
4. **Execution quality and data validity** — all-in fee, funding, spread/slippage input with each component's provenance and effective time; receipt lag, clock skew, delayed or missing snapshot, dedup, reconnect epochs, and schema validation. Research costs remain `ASSUMED` until verified market data or actual fill evidence exists. No account PnL without fills.

These lanes must join by **(venue, venue_symbol, contract type, UTC event timestamp/available-to-model timestamp, experiment id)**, not coin ticker alone. Binance USD-M BTCUSDT and Hyperliquid BTC perpetuals are different instruments and may not share executable price or funding rules.

## Implemented foundation

- `event.schema.json`: JSON Schema 2020-12 envelope with explicit source, raw SHA-256, raw location, message ID, exchange/receipt/monotonic/available timestamps, quality/reconnect/sequence flags and immutable research-only permission bits.
- `provenance.cjs`: programmatic semantic gate: reject unsupported event types and provenance, quarantine stale or future-dated/clock-skewed messages, catch duplicate IDs, out-of-order event receipts and detected sequence gaps, require a new order-book snapshot after an epoch change, and **deny training until a separate authorized review confirms raw hash, timestamp, data schema and locked train-only split**.
- `provenance.test.cjs`: deterministic fixtures for duplicate messages, staleness, out-of-order events, reconnect handling, missing sequence, future-clock skew, and training/test boundaries.
- `feed-catalog.json`: documented public-feed feasibility inventory and phased rollout. This file is an API plan, **not a proof of live API availability or successful connections**.
- `.github/workflows/v10-data-foundation.yml`: isolated Actions CI running offline tests only; no credentials and read-only repository permission.

**Important engineering limitation:** the envelope's `sequence` is optional and only detects gaps if the source actually supplies comparable incremental sequence numbers. Hyperliquid `l2Book` is a book-snapshot stream, not a documented contiguous update-ID stream. Snapshot gaps cannot be reliably reconstructed with a fabricated counter. Missing messages when offline are unknown and recorded as coverage gaps; the implementation is *not* a complete high-availability stream reconstructor. The current JSON Schema is a contract, while semantic CI tests exercise the JavaScript verifier; independent automated full JSON Schema compilation is still future work.

## Public API feasibility, source links

| Data lane | Proposed feed | Practical finding | Status |
|---|---|---|---|
| L2 book & spread | Hyperliquid `l2Book` and optional `bbo` | Documented public WebSocket feeds, book messages provide bid/ask levels and timestamps | Docs checked; no live collector |
| Executed trades | Hyperliquid `trades` | Public trade prices/sizes/sides/timestamps; not exchange-account fills | Docs checked; no live collector |
| Mark, open interest & funding | Hyperliquid `activeAssetCtx`, `metaAndAssetCtxs` | Documented fields include mark, mid, oracle, funding rate and open interest | Docs checked; no live collector |
| Independent venue comparison | Binance USD-M `@aggTrade`, `@depth` | Public streams exist; contract and incremental-depth handling need separate implementation | Future |
| Our engine prediction/feedback | INVO internal forward journal, future MAHORAGA research ledger | No public API; timestamp/version linkage essential | Schema planned; not integrated |
| Actual execution costs | Public quotes and published fee/funding information | Best-effort estimates until dated quotes and real fills are available | No verified all-in cost ledger |

Sources:
- Hyperliquid subscription format: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/subscriptions
- Hyperliquid mainnet WebSocket and reconnect guidance: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket
- Hyperliquid perps asset contexts/info requests: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/perpetuals
- Hyperliquid idle timeout / ping: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/websocket/timeouts-and-heartbeats
- Hyperliquid API limits: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/rate-limits-and-user-limits
- Binance USD-M market stream subscriptions: https://developers.binance.com/en/docs/products/derivatives-trading-usds-futures/websocket-market-streams/Live-Subscribing-Unsubscribing-to-streams

## Reliability and gating design

**Proposed initial *review thresholds*, not measured venue guarantees:** quarantine order-book events older than 3 seconds, public trades older than 5 seconds, derivatives context older than 60 seconds, or events time-stamped more than 2 seconds in the future relative to receipt. Log source time, arrival time, and monotonic elapsed time separately. These research limits must be calibrated per provider and transport before collecting actual training data. Missing exchange-source timestamps are **not** to be invented.

For a future real collector:
1. Start separate public WebSocket process; record startup and source endpoint/adapter version, subscribe to chosen market, and retain append-only raw message bytes.
2. Validate symbol/instrument mapping; audit received vs source time and exchange clock drift. Detect disconnected intervals, dropped messages and untrustworthy book states; quarantine, not backfill.
3. Maintain only a bounded in-memory working window plus immutable, externally approved raw storage. New rows get checksum and monotonic ingestion ID. Restore from an authenticated checkpoint, avoid duplicate replay.
4. Resubscribe after disconnect; request a fresh book snapshot. Do not claim continuity across the outage, even if a later snapshot is valid. For Binance incremental depth, use its documented sequence/reconstruction requirements, not generic guessed counters.
5. Create completed, correctly aligned future feature windows; enforce `available_to_model_ms <= prediction_time`, `label_matured_at > prediction_time`, source/event availability and experiment registration. Reject any feed with persistent gap or unresolved time skew.
6. Record **all** model decisions including no-trade, rejected signals and missed observations. Separate training, model selection, and protected independent forward evaluation; never train on already-inspected test outcomes and then call them unseen.
7. Offline stage passes before any network test. A separate approval is required for any always-on runtime/storage, especially paid deployments. GitHub Actions 15-minute best-effort cron is not a tick-level or second-by-second stream collection service.

## Acceptance gates

| Gate | Acceptance condition |
|---|---|
| Schema & provenance | Required event identity, raw SHA-256, actual timestamps and immutable source/version fields; malformed records rejected |
| Market microstructure | Book sanity (noncrossed positive bid/ask), bounded depth, dedup, tracked outage/reconnect; **no claim of complete L3 replay** |
| Derivatives context | Rate units, source effective time, mark/oracle/open interest checks, no conflation of a rate with actual funding paid |
| Engine feedback | Every signal/NONE recorded with model version and registration; future outcome appended only when matured |
| Economics | Distinguish assumed vs sourced vs verified execution; no account PnL without trades and cash-flow ledger |
| Quality | Clock/receipt latency, heartbeat, quota and dropped/gap accounting, fail-closed on unknown |
| Training split | No future feature or label leakage, immutable versioned split, protected forward unseen sample |
| Safeguards | No production strategy/risk modifications, no account credentials, live orders, AI training, or automatic promotion |

## Next sequence (NOT implemented)

1. Build **offline source-specific adapters and comprehensive source-message fixtures** from documented Hyperliquid feed payloads; include precision, quote currency, top-of-book sanity and missing timestamps.
2. Run a **manual, bounded, public-market-only connectivity smoke test** if permission and run environment are available, with explicit status for market availability and public rate limits. Do not write into production.
3. Select an **approved no-cost or user-authorized persistent collector/storage runtime** (not GitHub 15-min cron) and only then activate append-only raw collection; until then, no real-time stream has been deployed.
4. Introduce versioned outcome/feedback schema and valid decision/label joins. Build the eight specialist learners and supervisor only after stable data integrity, a locked time split and independent comparison protocol.

**Current result:** the data contract and deterministic evidence gates are implemented and testable. The system is not collecting additional real-time tick data yet, has no independently validated AI edge, and keeps every current production trading rule frozen.
