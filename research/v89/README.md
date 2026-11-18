# INVO v8.9 — Actual-Time Forward Directional Evidence Collection

**Status: ACTIVE RESEARCH WORKFLOW, FIRST END-TO-END RUN SUCCEEDED. No orders, no live fills, no demonstrated trading profit.**

## What was installed and verified

1. Existing registered candidate journal from `main` was audited read-only by [run 44221004863](https://github.com/Elikers/invo-ultimate/actions/runs/44221004863). At that snapshot it had 0 rows for JUP/volbreak and SOL/pullback, 0 expired and 0 unresolved; baseline main forward report had 19 closed trades. Thus no candidate profitability is established.
2. A potential **timing mismatch** was diagnosed: legacy v7 candidate collector plans entries for the next 5m bar but generally polls at 15m cadence. When the planned next-5m candle has passed before the next poll, the legacy journal intentionally expires rather than inventing a fill. An empty journal alone cannot establish whether absence of strategy signals or timing is the primary cause.
3. A separate **directional prediction ledger**, `research/v89/directional.cjs`, was implemented. It logs only genuinely observed *latest completed-candle* LONG/SHORT indications for the two preexisting registered pairs, with observed timestamp. It scores each prediction from the close of a subsequent 15-minute horizon **only after** those target candles are completed. No missing signal backfill, exchange order, hypothetical entry fill, actual fee, TP/SL outcome, leverage, or profitability estimate. Signal NONE does not count as a prediction.
4. [Offline forward-timestamp and no-backfill tests succeeded](https://github.com/Elikers/invo-ultimate/actions/runs/44221313073). An earlier run failed on exact floating-point comparison (+1.0000000000000009 vs +1); test corrected using numeric tolerance. A [read-only real public Hyperliquid live dry run passed](https://github.com/Elikers/invo-ultimate/actions/runs/44221709412), with safe observation timestamp after market fetch and fail-closed rollover checking.
5. A new GitHub default-branch operational workflow `.github/workflows/v89-shadow-forward.yml` was added to run on a best-effort UTC 15-minute cron `4,19,34,49 * * * *`, plus manual dispatch. It checks out immutable-source files from `main`, uses the isolated v8.9 research code, and writes **only** `evidence/v89-directional-ledger.json` and `evidence/v89-directional-health.json` into `research/v8.2-v8.8-verified-gates`; it does **not** update production forward journal or production strategy code. The schedule may be delayed/skipped by GitHub, and every requested execution still depends on GitHub Actions; this is not a high-availability guarantee or independent provider deployment.
6. The [FIRST live workflow run 44221803576](https://github.com/Elikers/invo-ultimate/actions/runs/44221803576) **passed** and persisted an actual-time observation at `2026-11-18T02:14:48.417Z` (10:14:48 Asia/Manila). Both JUP/volbreak and SOL/pullback reported `NONE` on that observed latest complete bar; **0 prospective directional predictions and 0 scored directional outcomes** were correctly retained. This is positive operational evidence of a functioning initial collector run, **not** a positive strategy result.
7. After the first live run, Git blob SHA equality was confirmed for `index.html` (`605deb4...`), `v61-core.js` (`4c9762f...`), `research/run.cjs` (`1143d5d...`), and `research/v7-registration.json` (`4a38abd...`) across main and isolated research branch; trading logic and registration unchanged.

## Critical reporting distinctions

- **Old legacy v7 candidate trade journal:** still 0 captured/closed candidate trades at the last inspected main snapshot. It may eventually capture genuine valid prospective entries, but it is *not* equivalent to the v8.9 ledger.
- **New v8.9 directional ledger:** directional ability only; prediction close-price baseline is a previously completed 5m candle close, **not** a tradable entry quote. A directional score is *not* net trade PnL, and cannot count toward the existing 100-total/30-per-group **trade** evidence floors.
- **Positive/negative source claims:** Neither new ML/AI training nor new trading strategies, risk settings, actual fills, or venue-specific costs were created or proven.
- **Scheduling:** The new workflow adds GitHub Actions consumption and may be delayed by GitHub's scheduler; existing provider fallback remains independently unactivated. Cost exposure of GitHub Actions depends on repository plan, visibility, and metered minutes; review usage.

## Operational verification and safeguards

- The new schedule runs on `main`, but its only write target is the isolated research branch `evidence/` files. The workflow has `contents:write` for that commit. It does not edit `main` strategy files or use exchange credentials.
- Every run verifies the directional ledger tests before collecting.
- Public 900-bar contiguous candle windows are checked per registered pair. Failure in any market **aborts without partial evidence write**.
- No historical signals are generated for missed cron slots. Old predictions may be scored using future completed candles *if the prediction genuinely existed before them*; if the exact target candle is not in the fetched window, mark unresolved, not filled.
- GitHub Actions concurrency group serializes runs of the new workflow. Evidence branch push uses fetch + rebase + guarded push to refuse concurrent overwrite; any conflict fails the job.
- No auto promotion; v8.8 still held candidates. No paid service or real-money trade authorized.

## Remaining requirements

1. Gather multiple actual GitHub scheduled run IDs, check observation cadence and gaps over time; a successful first push-triggered run is not proof the cron has begun or will be reliable.
2. Accumulate true future LONG/SHORT predictions and scoring outcomes. Evaluate only with separate immutable model/version provenance, clustering and uncertainty; no claim of profit from directional signs.
3. The **actual** 5m paper-entry capture problem is NOT fixed by directional scoring. To produce candidate *trade-level* forward evidence, preregister and validate a separate timestamped quote/entry/fill model or provide sufficiently frequent reliable observation without retroactively generating fills. Keep legacy v7 candidate paper journal separate.
4. Compare against frozen, simultaneous baseline predictions in future data before selecting any regime, timeframe, or AI approach.
5. Obtain verified venue execution costs and a genuine account/position ledger before any claim of executable profit or production promotion.

**Consolidated conclusion:** Actual future directional signal observation infrastructure was activated, tests and first real data capture succeeded, while candidate *trade-level* profitability remains unverified and zero new directional signals were observed in the first run.
