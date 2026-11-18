# MAHORAGA v10 — Automatic Research Learning Loop

**Branch:** `research/v10-auto-learning-loop`  
**Current condition:** **working offline train-only challenger prototype; not a deployed automatic training service**.

## Implemented

- `loop.cjs`: reads hash-chained prospective observation/outcome journal; requires a real pre-outcome observation with all 8 expert decisions + Mahoraga + baseline, an actual matured paper result for the specified expert, immutable version and registration IDs, matching source/feature/cost hashes, and fully observed required features. **No incomplete feature mask** can masquerade as zero.
- `training-registration.json`: preregistered train window **2026-11-19T00:00Z inclusive through 2026-12-19T00:00Z exclusive**; purge any training record whose prediction or matured outcome lands outside it. Later validation and test windows are protected.
- `specialists.cjs` unchanged: applies a small bounded update to the challenger only. The champion model is **never overwritten**. Repeated input IDs are idempotently skipped.
- `store.cjs`: single-writer local file lock, fsynced atomic model checkpoint with SHA-256, corrupted ledger fails closed. A zero-example run changes no checkpoint. Outputs do not authorize orders or model promotion.
- `runner.cjs`: explicit **manual or separately orchestrated** research-only job, using absolute local evidence paths. No live network, API keys, execution, or website modification.
- `loop.test.cjs`, `store.test.cjs`: deterministic **synthetic** training, 35 matured examples, no-trade and unsafe evidence rejection, idempotence, holdout and clock guards. Synthetic future timestamps are only unit-test fixtures, not claimed real observations.

## What this DOES NOT establish

- No always-on runtime has been deployed; a repo branch or CI that tests model code does **not** learn automatically without a running collector and persisted, source-audited journal.
- No actual new v10 forward validated expert outcomes have been supplied to the runner in this session. Tests cannot be treated as observed market predictions.
- The current shadow journal's outcome format supports a single engine-scoped paper result per observation; all eight simultaneously evaluated models will require a separately reviewed multi-engine outcome ledger before full live research collection.
- `source_audited` and `outcome_audited` currently come from external records and are declarations, **not cryptographic third-party timestamp attestations**. Verify them with independent forward logs before using real data.
- Cost is explicitly tagged `ASSUMED_PAPER`, not filled trade costs. The learning label is hypothetical paper-net-positive, not realized profits.
- Automatic challenger **promotion**, production website display, account execution and leverage changes remain prohibited. A challenger update is not proof of market skill or net edge.

## Manual opt-in use (only with actual independently retained future evidence)

```sh
node research/v10/autolearn/runner.cjs --research-only \
  --expert fusion \
  --dir /absolute/research/model-state \
  --shadow-journal /absolute/research/shadow.jsonl \
  --audited-labels /absolute/research/audited-train-labels.json
```

The audited-train-labels input is a JSON array with a matching observation ID, training-registration SHA, model-version SHA, paper-exit costs, feature snapshot hash, full observed feature mask, timestamps, and source audit fields. A missing or unverified input causes **no training**. The runner uses the current real machine clock, never a user-supplied simulated time.

To make this genuinely continuous, use an explicitly authorized stable runtime/storage and forward capture; then build a separate audited label generator and schedule bounded training **after** outcomes mature. This branch does none of those external deployments.

## Safety evidence

On this research branch, all main production-critical source files are byte-identical; no production trading changes or account calls were requested. Release remains **BLOCKED** until independently verified forward economics and separate human authorization.
