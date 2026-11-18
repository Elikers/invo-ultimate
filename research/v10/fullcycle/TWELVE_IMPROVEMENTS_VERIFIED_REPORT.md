# MAHORAGA v10 — Twelve Improvements Consolidated Verified Delivery

**Report:** 2026-11-18, Asia/Manila  
**Research branch:** `research/v10-twelve-improvements`  
**Overall conclusion:** All 12 **research software tracks** have an implemented or updated component and have passed synthetic/offline regression, with a bounded public-source pilot. **The 12 real-world operational requirements are NOT yet all satisfied. Automatic ongoing learning is NOT running. Activation remains BLOCKED.**

## Evidence

- [All-12 research offline integration — PASS (44240744934)](https://github.com/Elikers/invo-ultimate/actions/runs/44240744934)
- [Independent protected-production / twelve-track audit — PASS (44240744962)](https://github.com/Elikers/invo-ultimate/actions/runs/44240744962)
- [Three-market public Hyperliquid source pilot — PASS (44240105400)](https://github.com/Elikers/invo-ultimate/actions/runs/44240105400): **12 seconds**, **77 received public source frames**, **65 accepted book/trade market events** (BTC 45, ETH 14, SOL 6), **36 separate receipt-only derivatives contexts** (12 per market), **1 quarantined frame**, **0 duplicate frames counted**, and local five-file SHA-256 archive manifest verified. No reconnects during this pilot. This proves neither continuous feed coverage nor external durability.

## Twelve tracks and honest completion criteria

| # | Track | Delivered module or change | Operational state |
|---|---|---|---|
| 1 | Continuous collection | Extended `next/capture.cjs` and `runtime/run-bounded.cjs` to BTC/ETH/SOL public books, trades and receipt-only asset context; reconnect/clock/gap controls inherited from `runtime/controller.cjs` | **Bounded pilot passed**, **NOT continuous** |
| 2 | Durable evidence | `fullcycle/manifest.cjs` seals/checks raw data, accepted events, health, connection log and receipt-only context; `next/capture.cjs` replays/verifies raw links | Local integrity verified; **externally durable, immutable, timestamp-anchored storage NOT connected** |
| 3 | Causal features | `fullcycle/features.cjs`: trade trend/volatility, 4 completed 30-second bucket volume ratio, timely spread and depth imbalance, receipt-timestamped funding and two-context open-interest change, with explicit masks and hash references | **All seven features exercised in synthetic tests**; real coverage/freshness not established; receipt time is not exchange event time |
| 4 | Eight specialist predictions | `fullcycle/decisions.cjs` records frozen versioned eight specialist votes + Mahoraga + baseline, with NONE when prediction/model authenticity absent; `pipeline.cjs` snapshots only fresh public book evidence | Research decision interface built; **genuine running eight-engine inference NOT wired** |
| 5 | Supervisor learning | `fullcycle/meta-challenger.cjs` trains advisory challenger only from complete eight-expert versioned matched votes and matured TRAIN paper outcomes, using `next/meta.cjs` | Synthetic training test passed; **not yet learned from real forward matching** |
| 6 | Multi-engine outcomes | `fullcycle/multi-ledger.cjs` versioned, hash-chained, separate engine-outcome and no-trade records, source-gap type, duplicate/clock protection | Synthetic journal tests passed; no independent real future outcomes |
| 7 | Settled paper labeling | `fullcycle/paper.cjs` with conservative entry/exit bid/ask, exact matured horizon, one-minute exit tolerance, replay-verifiable gross return, and MISSING_DATA rather than late hindsight | Synthetic correctness passed; no independent exchange fills |
| 8 | Cost-aware results | Separate per-side hypothetical fee and slippage, negative/net results and source hashes; fixed short-return entry denominator | Paper assumption tests passed; real costs, funding, executable spread and fills **not verified** |
| 9 | Research auto-learning | `fullcycle/train.cjs`, `scheduled-step.cjs`, `cycle.cjs`, `run-once.cjs`: per-engine TRAIN-only updates, idempotence, abstention, bounded one-shot workflow | **Offline step passed**. No live continuous scheduling; no actual eligible v10 auto-updates |
| 10 | Model registry/rollback | `fullcycle/checkpoint.cjs`, checkpoint lineage, SHA-256 + atomic fsync, prior challenger restore, single-writer locks | Local test passed; no externally anchored, retained registry or live rollback trial |
| 11 | Forward evaluation | `fullcycle/evaluation.cjs` and existing `next/paired.cjs`: matched protected-forward diagnostics, abstention and missing-outcome coverage, conservative clusters | **BLOCKED — zero independently eligible v10 closed forward trades** |
| 12 | Security and activation gates | `fullcycle/readiness.cjs`, `final-audit.cjs` plus independent main checkout; production files checked byte-identical | Audit passed; **NO model auto-promotion, live orders, strategy changes or website activation** |

## Safe research orchestration added

`fullcycle/cycle.cjs` can perform an explicitly invoked one-shot sequence: replay-verify prior bounded source capture; record source-timestamped observations; append matured paper or no-trade outcomes only; incrementally checkpoint eligible **challenger** updates; produce blocked-or-review evaluation. The CLI `fullcycle/run-once.cjs` has no order/market-execution APIs and no internal timer or daemon. If no authentic frozen model inference is provided, the ten engine decisions are **NONE** rather than invented signals. If there are no verified observations/labels, there are **zero model updates**.

```sh
# On an explicitly approved host: first complete a bounded public capture
node research/v10/runtime/run-bounded.cjs --public-data-only --duration-seconds 60 --dir /absolute/research-storage

# After the registered start date, run a separate research-only step
node research/v10/fullcycle/run-once.cjs --research-only --dir /absolute/research-storage
```

Neither command sets up an always-on host. **Do not call the second command during concurrent writes to the same raw journal**; the current replay layer is fail-closed but not transactional multi-writer storage. Manual user approval is still required for any live service, paid hosting, retained external storage or production integration.

## Real blockers — cannot be declared complete from passing GitHub Actions

1. **Continuous runtime**: choose, provision and approve genuinely persistent infrastructure with uptime/reconnect observation, resource limits, a maintenance/stop plan and an independent health alert.
2. **Durable external storage/time anchoring**: persist original raw frames, checkpoints, model versions, outcomes and audit receipts externally, verify restores, protect from concurrent writes and clock forgery.
3. **Verified genuine inference**: connect actual frozen eight specialist research models and unchanged baseline to the real available feature snapshots. Scalping has no validated 1-minute or depth-labeled training dataset. Do not automatically convert missing models into trades.
4. **Matured independent forward sample**: registration starts **2026-11-19T00:00Z** (08:00 Asia/Manila); no eligible forward v10 closed trade record has been verified by the audit. Do not backfill or pretend synthetic paper tests occurred in the future.
5. **Independent net economics**: independently verify costs/funding/fills and compare matched forward risk-adjusted net P&L against frozen champions across correlated markets, with human statistical review and robust rollback.
6. **Separate activation authorization**: even ideal future evidence only permits manual review; no code path here authorizes real orders or production website changes.

## Why all twelve are not automatically 'running'

Code and CI can verify contracts, input guards, deterministic training and safe failure behavior. They **cannot** create future evidence, guarantee profitable outcomes, run an absent always-on service, certify price-source completeness, or prove real exchange fills. Therefore this is a delivered *research software foundation*, not a finished live self-improving trading operation. The safe next externally dependent step is an approved persistent source and model-inference environment, followed by a protected future-only shadow trial.
