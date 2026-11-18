# MAHORAGA v10 — Five Priority Improvements: Verified Research Delivery

**Date:** 2026-11-18 UTC / Asia-Manila  
**Branch:** `research/v10-mahoraga-five-gates`  
**Overall:** **FIVE SOFTWARE/RESEARCH IMPROVEMENTS IMPLEMENTED AND CI VERIFIED. ACTIVATION NOT AUTHORIZED.** No live trading, paid deployment, production strategy/risk changes, or website activation.

## What was implemented

| Priority | Code | Verification | Honest scope |
|---|---|---|---|
| 1. Reliable market-data ingestion | `research/v10/next/capture.cjs` stores exact public source frames with SHA-256 and per-frame health, accepted envelopes, source time, duplicate/replay handling, and fail-closed restart verification; `pilot.cjs` connects to BTC public Hyperliquid WebSocket for exactly 12 seconds | [Offline CI 44231175404](https://github.com/Elikers/invo-ultimate/actions/runs/44231175404), [real public bounded pilot 44231582068](https://github.com/Elikers/invo-ultimate/actions/runs/44231582068) | **PASS**. Pilot captured **17 frames / 47 accepted research events / 0 quarantined** in 12 seconds. Artifact retention seven days. **Not** a continuous, independently monitored or durable always-on collector. Restart test covers clean persistence and fails closed on torn files; automated crash repair/concurrent writers not yet implemented |
| 2. Specialist learning integrity | `temporal.cjs` enforces immutable chronological TRAIN/VALIDATION/TEST boundaries, purges outcomes crossing segment boundaries, and distinguishes missing features from actual zeros using explicit observation masks; prevents incomplete-feature examples from entering full-feature calibration | [CI 44231288486](https://github.com/Elikers/invo-ultimate/actions/runs/44231288486) | **PASS**, offline synthetic fixtures. Existing seven-specialist verified BTC April 2026 retrospective development run generated 1,662 training updates; **scalping still untrained**, full eight-specialist unseen evaluation absent |
| 3. Trained supervisor prototype | `meta.cjs` learns bounded linear **net-paper-return** research weights from eight frozen, timestamp-aligned expert predictions, only from matured TRAIN records with explicit cost inputs; `advisory` abstains when evidence/model requirements are unmet | [CI 44231363859](https://github.com/Elikers/invo-ultimate/actions/runs/44231363859) | **PASS**, trained only on synthetic fixtures. **Not** trained on verified matched real-market expert outcomes, no independent performance |
| 4. Independent profitability gate | `paired.cjs` requires registered, genuinely forward, matched, frozen model/baseline opportunities with verified cost inputs and matured labels; rejects future dates and training contamination; uses deterministic date-cluster bootstrap, 8-way conservative one-sided lower bounds | [CI 44231443867](https://github.com/Elikers/invo-ultimate/actions/runs/44231443867) | **PASS** for fail-closed software tests. **0 eligible v10 independent forward closed trades**, **no verified net edge** |
| 5. Production readiness and safe release | `release.cjs` always refuses automatic promotion, live orders, or website activation, even with ideal flags; `final-audit.cjs` compares production-critical files byte-for-byte with a separate main checkout and checks current legacy journal | [Final CI 44231517217](https://github.com/Elikers/invo-ultimate/actions/runs/44231517217) | **PASS** for source integrity and blocked activation. Current main legacy candidate journal **3 captured, 0 closed**; not Mahoraga forward evidence |

## Additional integrity controls

- All models and their learning data remain in a **research-only branch**. No production file modifications.
- Missing historical microstructure, open-interest and funding inputs must **not** be interpreted as observed zero values. The new observation mask enforces this for future properly formed training rows.
- A paper label is not an actual exchange fill; a model trained to predict positive net paper outcomes is not a demonstrated profitable system.
- The meta model is a bounded regression prototype, not an autonomous profit optimizer, and all its currently tested weights are synthetic.
- The public pilot does not prove full book reconstruction, tick-level continuity, reconnect recovery, clock synchronization, long-term reliability, or training eligibility.
- Forward gate uses eight-group Bonferroni-adjusted, day-cluster resampling but its statistical design requires external validation and enough *real* matched samples before inference.

## Hard blockers that code alone cannot solve in this session

1. **Always-on runtime and approved durable storage:** public WebSocket only ran for 12 seconds. No persistent paid service was activated, and GitHub Actions is not a suitable tick-level continuous service.
2. **Data acquisition and labeled outcomes:** no valid v10 independent forward paper trade outcomes or 1-minute scalping training dataset yet. Historic archives alone cannot become new prospective evidence.
3. **Genuine meta-model learning:** needs real, fully versioned, matched expert decisions and matured paper outcomes with actual market microstructure and documented cost provenance. Synthetic regression tests are not proof of learning an edge.
4. **Economic and statistical validation:** realistic spread/slippage/fees/funding, missing data, correlated opportunities, adverse regimes and robust net expectancy must be demonstrated on protected unseen forward records. Real fills are necessary before asserting actual execution P&L.
5. **Independent risk/release review:** live website activation and real-money execution require separate human authorization and cannot be inferred from passing CI.

## Current decision

**MAHORAGA v10 activation status: BLOCKED.** Software gates 1–5 pass. Data and economic proof gates do not. The safest next work is a separately approved long-running *read-only* collection runtime with storage, then a preregistered shadow-paper comparison and independent evaluation. Keep production signals and risk frozen until the user separately approves a reviewed release.
