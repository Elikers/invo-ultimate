# INVO v7.8 — Read-Only Collector Reliability Diagnosis

**Status: IMPLEMENTED AND GITHUB-TESTED; INVESTIGATION CONFIRMED STALE PRODUCTION HEARTBEAT.** No production changes or fallback dispatch.

## Verified current production evidence (2026-11-18)

[Successful audit run 44216711321](https://github.com/Elikers/invo-ultimate/actions/runs/44216711321) evaluated actual GitHub Actions history and the published main-branch collector-health.json. The test and live diagnostic succeeded.

- Audit: `2026-11-18T01:33:35.845Z` (09:33:35 Manila).
- Most recent main research run: `2026-11-18T00:29:48Z` (08:29:48 Manila), completed successfully.
- Last published collector heartbeat: `2026-11-18T00:30:04.257Z` (08:30:04 Manila), **63.5 min old** at audit time.
- Last observed market coverage in that heartbeat: **BTC, ETH, SOL and JUP all OK at the recorded expected completed-candle timestamp**.
- No research job in progress in returned recent run history.
- Diagnostic flags: `HEARTBEAT_STALE`, `RESEARCH_RUN_STALE`. Status `REQUIRES_RELIABILITY_REVIEW`.
- This does **not** prove 15-minute polling cadence, whether every scheduled slot was skipped, permanent outage, lost trade count or strategy performance.

## Why not just retry the existing collector automatically?

The production collector and its schedule watchdog both rely on GitHub-hosted scheduled workflows. The existing watchdog requests a collector-only fallback after 40 min inactivity **if the watchdog itself runs**. An extended GitHub scheduling delay can therefore delay both. A research-branch workflow cannot provide independent high-availability scheduling: GitHub only executes recurring `schedule` triggers on the default branch. No bypass or backfill is justified.

The existing `research/collector-fallback.cjs` handles pending jobs and cooldown, and the `research/schedule-audit.cjs` correctly declines to invent 15-minute polling evidence when event cron metadata is missing. We did not modify either.

## Implemented diagnostic

- `research/v78/reliability.cjs`: distinguishes last-heartbeat candle coverage from CURRENT heartbeat/run freshness, checks run metadata, prints evidence flags and preserves provenance.
- `research/v78/reliability.test.cjs`: offline tests for healthy heartbeat, stale collector, observed schedule gap, market mismatch and bad clock.
- `.github/workflows/v78-reliability.yml`: branch-triggered/manual read-only evaluation using `actions:read`, `contents:read`, no token-based write, orders, fallback dispatch or edits to main.

## Recovery choices requiring separate implementation and verification

1. **Short term:** The preexisting default-branch scheduled watchdog may recover and send its existing collector-only fallback when GitHub resumes running it. Watch subsequent *actual* runs and updated heartbeat; do not claim successful recovery before it is observed.
2. **Operational escalation:** If reliable quarter-hour observations become mandatory, use an *independent* scheduler outside GitHub Actions, subject to owner approval, provider eligibility, permissions, authentication and rate limits. Independent provider cannot reconstruct missed prospective signal observation times.
3. **No automatic production changes:** This branch contains diagnostic evidence only. Changes to watchdog cron, external scheduler credentials, default-branch operations or notification delivery require review and separate verification.
4. **Never promote strategies:** v7.6 historical results were negative at 8/16 bps; existing main forward sample is 19/100 closed and preregistered shadow candidates 0. Collection cadence is not profitability.

**Conclusion:** At the tested moment, GitHub scheduling/collector freshness was insufficient to establish a 15-minute service guarantee; last completed run's candle integrity was good. Operational root cause beyond lack of a subsequent scheduled run was not proven.
