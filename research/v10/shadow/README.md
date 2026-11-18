# MAHORAGA v10 — Prospective Shadow Gate (research only)

**Branch:** `research/v10-forward-shadow-gate`  
**Date:** 2026-11-18  
**Next eligible observation registration start:** **2026-11-19 00:00 UTC** (**08:00 Asia/Manila**)

## What has been implemented

- `registration.json`: one declared research-only Hyperliquid BTC/ETH/SOL observation contract, eight specialists (including still-untrained scalping), Mahoraga supervisor, and frozen website baseline. All three types must be included per observation; **NONE is a recorded decision**.
- `shadow.cjs`: validates declared feature availability at decision time; refuses retroactive frames, wrong start date, stale submission, mismatched registration fingerprint, missing/duplicate experts, premature outcome entries, duplicate labels and tampered hash chains. Records a timestamped all-NONE frame correctly without claiming a profitable trade. Has single-writer on-disk JSONL with fsync and a conflict guard.
- `shadow.test.cjs`: deterministic *offline* synthetic fixtures. A pass is not evidence that any actual Mahoraga forward model prediction has occurred.
- GitHub workflow `v10-shadow-gate.yml`: read-only offline CI for this branch only, no trading credentials, no periodic deployment.

**Limitations:** This is a recording and validation *library*. No run is wired to a genuinely continuous WebSocket runtime, no scheduled prediction observation exists, and no future trade labels have been captured. A local timestamp is not independently attested merely because it is in a hashed line, and a SHA-256 hash-chain does not stop an attacker who can rewrite the entire file and recompute hashes. To establish a defensible forward experiment, external time-anchored independent append-only capture/retained GitHub artifacts or equivalent trusted storage, model version pinning, and a continuously monitored source are needed. Do not treat historical data as newly forward.

**Economic evaluation:** No verified execution costs, actual exchange fills, or v10 closed forward trade sample. Legacy production paper records do not count as Mahoraga forward outcomes. `training_eligible` remains false for all outcomes by default. Independent profit and model readiness are **NOT ESTABLISHED**.

**Production:** Source files `index.html`, `v61-core.js`, `research/run.cjs`, `research/v7-registration.json`, and production research workflow must remain byte-for-byte frozen. This branch must never be promoted automatically. No live orders, website activation, or paid service.
