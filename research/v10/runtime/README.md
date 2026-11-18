# MAHORAGA — Data Capture Reliability Upgrade

**Date:** 18 November 2026  
**Branch:** `research/v10-capture-reliability`  
**Status:** research-only. **No continuous deployment, live trading, auto-training, website activation, or paid services.**

## Implemented and tested

1. A restart-safe bounded session controller at `runtime/controller.cjs` with persistent connection-epoch journal, explicit gap events, single-writer file lock, stale-input signal, bounded frame count, fsync and torn-file rejection.
2. Repaired `next/capture.cjs` to detect already-accepted source event IDs after reconnect and process restart rather than resetting the duplicate window; each accepted market book ID includes the SHA-256 frame prefix to reduce same-millisecond collisions.
3. An **explicitly opt-in** public-data-only runner at `runtime/run-bounded.cjs` with automatic reconnect attempts/backoff, 20-second stale-socket watchdog, signal handling and a strict duration limit of 5–3600 seconds.
4. Existing `shadow/shadow.cjs` remains a detached preregistered observation recorder. This collector does **not** manufacture eight-model predictions or feed old observations back as fresh forward data.
5. A read-only final GitHub Actions production audit comparing critical website/strategy files against `main`.

## Verified results

- [Offline restart gate](https://github.com/Elikers/invo-ultimate/actions/runs/44235111577): PASS, including lock conflict, disconnect epochs, crash/torn-state quarantine and replay deduplication.
- [Live bounded public BTC pilot](https://github.com/Elikers/invo-ultimate/actions/runs/44235116046): PASS. The runner captured **16 Hyperliquid public frames and 47 accepted market events in 10 seconds**, with zero quarantined frames. **This did not test a real network disconnect or permanent uptime.** Captured event files were retained as a temporary GitHub Actions artifact.
- Final independent production safety audit should be checked separately after this document; passing bounded pilot does not establish forward profitability.

## Important remaining deficiencies

- GitHub Actions runner is temporary. The files survive only in a short-lived artifact; it is **not an always-on research database or validated backup**.
- Live socket reconnection after an actual outage has not been observed; only controlled offline fault tests passed.
- Trade records, exchange-account fills, funding cash flows and full book continuity have not been proven. No live data in this pilot is training-approved.
- The preregistered forward evaluation has **zero eligible v10 closed trades**; absent independently verified net profitability, activation must remain blocked.
- To operate continuously, select an actually available **user-approved always-on runtime plus durable retention/monitoring and maintenance**, run a longer source-quality and recovery trial, then timestamp and evaluate genuine eight-specialist prospective decisions and matched unchanged baseline. No paid services without separate approval.

## Opt-in manual pilot (only on a computer with Node native WebSocket and a writable absolute directory)

```sh
node research/v10/runtime/run-bounded.cjs --public-data-only --duration-seconds 60 --dir /absolute/local/research/directory
```

This command terminates after the selected number of seconds. It does not create a service, place orders, learn autonomously, or alter the website.
