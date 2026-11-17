# INVO Ultimate v6.7 — Dependable Research Operations

## What is now automated
- **Source provenance and health:** `research/operations-health.json` records the last collector timestamp, run trigger, market coverage, freshness warnings, and forward sample limitations. A push-triggered heartbeat does **not** verify that a scheduled 15-minute action actually ran.
- **Append-only paper event transitions:** `research/archive/forward-events.jsonl` stores each distinct observed journal state with an idempotent event key. It begins with observations available when v6.7 was introduced, not all events from before v6.7. This is a simulated forward paper journal, never a verified exchange fill.
- **Daily historical snapshot:** `research/archive/daily/YYYY-MM-DD.json` stores the first completed daily UTC historical summary. It is written once without overwriting an existing day's snapshot. Full rolling reports remain in the existing JSON files and GitHub Actions execution artifacts.
- **Automated release quality:** `research/release-gate.cjs` pins the git blob identity of the unchanged `index.html` strategy module, `v61-core.js`, and `research/forward.cjs`. The release gates fail if frozen trading files change without a reviewed baseline update. `.github/workflows/quality.yml` runs non-deploying tests for pull requests. Publishing on main still requires passing the website tests.
- **Safe manual rollback:** GitHub Actions → **Deploy INVO Ultimate to GitHub Pages** → **Run workflow** supports an optional `restore_sha` containing a full 40-character commit SHA from main history. The workflow verifies ancestry and executes applicable tests before publishing. It deploys that selected historical code; it does not rewrite the repository or change forward journals. Rollback is user-initiated and not automatic. For a version before these workflows existed, test coverage may be narrower; verify the deployed status.
- **Improvement tracker:** `research/improvements.json` and `v67.js` display priorities, implementation state, caveats, and next checks. Tracker status is a human-maintained work plan, not a substitute for actual workflow evidence.

## Retention, limitations and integrity
The forward event archive is append-only under normal operation, but an authorized Git history rewrite, force push, or manual deletion could alter it. GitHub Actions artifacts have finite retention; Git is not an independent off-site backup. A separate external storage destination and access permissions would be required for stronger disaster recovery. Automated collection and report publishing depend on GitHub scheduled execution, the exchange API and network availability. Failed runs remain failures; we do not manufacture or retroactively capture forward paper entries. No live order placement or changes to the seven signal rules, fixed 1% stop, 1.5% target or 12-bar holding period.

---

# INVO Ultimate v6.6 — Market Intelligence & Signal Quality

## Scope of this approved release
- **Collector provenance:** `research/collector-health.json` now records the GitHub trigger and run ID. A push-triggered check is **not** counted as proof that a recurring 15-minute schedule ran. Polling remains best-effort rather than streaming live market data.
- **Causal descriptive regimes:** each signal candle is labeled from its own and earlier fully completed five-minute candles, using a fixed two-hour close-change threshold (+/-1%) and 24-candle average high-low ranges (0.18%/0.55%). These descriptive labels are not predictive trade filters.
- **Entry/exit audit:** `research/market-intelligence.json` reports historical strategy exits by market regime, including stop-related and target exits. A stop-out does **not** necessarily mean a false breakout.
- **Chronological comparisons:** 50/25/25 historical periods with the existing 12-bar embargo compare regime performance without modifying stops, targets, signals or holding limits.
- **Clear sample warnings:** subgroups with fewer than 20 closed historical trades are labeled insufficient. All historical regime segments come from the same 14-day window, so they are NOT independently forward-validated. Selecting promising groups after seeing these results is data snooping.
- **Read-only UI:** `v66.js` adds an interactive market/strategy/period view and reads the saved JSON without creating live trades.

No strategy entry signal, position size, stop-loss, take-profit, hold limit or cost assumption has been changed for trading. The prior v6.2 to v6.5 research and forward-only monitoring remain separate.

---

# INVO Ultimate v6.5 — Research Integrity and Risk Intelligence

## v6.5 implementation
The approved release adds only research, reliability and dashboard features. The website's seven signal strategies and paper trade parameters remain unchanged: 1% stop, 1.5% target, 12 five-minute bars maximum hold. There are no real orders or exchange keys.

- **Collector reliability:** 15-minute GitHub Actions best-effort collection has retry logic and a saved `research/collector-health.json` heartbeat after a valid run; failures that cannot collect a single market write an explicitly failed health artifact without overwriting valid forward trades. A configured schedule is **not proof that it ran**. Github Actions may delay or skip schedules.
- **Loss diagnosis verification:** full historical runs generate `research/loss-diagnosis.json`, including exit reasons, directional results and 0/8/16/24 bps cost stress. Missing files are displayed as unavailable, never interpreted as zero-loss results.
- **Risk intelligence:** historical simulated losing/winning streaks, maximum per-strategy drawdown and unrecovered-trade streak at fixed 8 bps. These metrics are not portfolio/leverage/funding/liquidation risk.
- **Historical robustness screening:** `research/integrity-risk.json` labels sample insufficiency, positive-middle/last-period behavior, total-history 8/16 bps cost sensitivity and 16 bps historical drawdown; a screen pass is never live or independent validation.
- **Dashboard:** new `v65.js` panel summarizes report timestamps, collector heartbeat, missing files, hypothetical trades and risk warnings across markets. It loads from read-only saved JSON and never triggers orders or strategy changes.

## Release and data provenance
The GitHub workflow now tests v6.5 scripts; check actual successful Actions execution and the presence/timestamps of the generated JSON reports before treating the release as operational. A missing collector-health or diagnosis report is a **release blocker**, even if JS unit tests pass. Successful research workflow completion also triggers GitHub Pages redeployment through a workflow_run event, because GitHub Actions bot-authored commits do not trigger ordinary push workflows. The original v6.2 historical results and v6.3 forward-only paper journal remain independent and clearly labeled. Daily ChatGPT reporting is configured for 10 AM Asia/Manila; Gmail secrets remain unconfigured.

---

# INVO Ultimate v6.4 — Rapid Historical Loss Diagnosis

Research-only website: https://elikers.github.io/invo-ultimate/

## New historical diagnosis (v6.4)
- `research/diagnose.cjs` uses the **unchanged website signal definitions** and original v6.1 stop/target accounting. No new entries, parameters, or orders.
- Once a successful full research run completes, `research/loss-diagnosis.json` records by-market/by-strategy exit reasons (stop, both-hit stop, gap stop, target, time), long/short metrics, chronological 50/25/25 summaries, and fixed 0/8/16/24 bps round-trip cost stress.
- Break-even round-trip cost is the historical mean gross return expressed in bps, **not an actual achievable fee threshold or trading recommendation**. Period splits exclude trades that cross boundaries with a 12-bar embargo.
- The v6.4 read-only panel displays the latest saved report; if no successful run has published it, it explicitly shows unavailable.
- These are **retrospective simulations on the same historical candles**, not fresh forward observations, independent holdout evidence or execution-verified fills.
- Original v6.3 forward observation journal and existing ChatGPT daily summary remain separate.

---

# INVO Ultimate v6.3 — Automated Forward Paper Observations

Public research-only dashboard: https://elikers.github.io/invo-ultimate/

## v6.3 — persistent forward observations
- GitHub Actions requests public 5-minute candles **every 15 minutes** (best effort, delayed schedules possible). It also runs its existing full daily research at **09:20 Philippine time**, with optional Gmail once daily if the user configures private secrets.
- At the **first run**, a forward observation baseline is initialized with **zero** signals/trades. Prior historical signals and backtest trades are never silently relabeled as forward observations.
- Later runs evaluate **only the most recently completed candle** while it is fresh. Intervening missed candles are intentionally **not** backfilled into the journal as live-observed signals. Fifteen-minute checks consequently do NOT monitor every five-minute signal.
- A captured signal is entered hypothetically **at a future unopened five-minute candle open**, not retroactively on the signal candle or a past open. The paper model uses fixed **1% stop, 1.5% target, 12-bar maximum hold**, stop-first same-bar ambiguity, and adverse opening-gap handling. Trades are never executed on an exchange.
- Persistent data: `research/forward-journal.json`; compact dashboard: `research/forward-summary.json`. The v6.3 panel displays 8/16 bps illustrative net performance, trade counts, incomplete observations, missed-run flags and history gaps, with explicit insufficient evidence when no closed trades exist.
- Idempotent candle watermark prevents duplicate observations on retries. Discontinuous history blocks fabricated results; any unresolvable open/pending position is labeled **UNRESOLVED_GAP**, not counted as a closed outcome.
- The original 14-day historical paper backtests remain in `research/latest.json` and the v6.2 panel; they are **not** new forward data.

## Notifications
The existing ChatGPT daily report at 10:00 Philippine time has been updated to compare both saved forward and historical research. Optional Gmail delivery remains unconfigured unless the repository's three private Gmail secrets are supplied.

## Risks and limitations
This is a latency-aware, forward-observed **PAPER simulation**, not broker/exchange-verified fills, independently validated profitability, or a real-time guaranteed service. A GitHub Actions schedule may be late or skipped. Transaction costs are fixed assumptions and omit realistic spreads, funding, latency variability, order-book execution, market impact and liquidation. No strategy is approved for real money; major strategy or parameter changes require user approval.

---


Public, paper-only research dashboard: https://elikers.github.io/invo-ultimate/

## v6.2 — no repetitive manual tests
- GitHub Actions runs automated research **daily at 01:20 UTC (09:20 Philippine time)**, on manual dispatch, or when the research workflow/code changes. Scheduled workflows are best effort and can be delayed or disabled by GitHub.
- The script `research/run.cjs` fetches **completed 5-minute Hyperliquid public candle data** for BTC, ETH, SOL and JUP from the default perpetual universe. Unsupported/missing markets are explicitly flagged.
- The script extracts the **same seven strategy signal functions already used by the website**. It then uses the shared `v61-core.js` conservative paper-accounting rules: next-open entry, fixed 1% stop, 1.5% target, 12-bar hold, stop-first ambiguous candle, and worse stop-gap fill.
- Compares fixed illustrative **8 and 16 bps round-trip costs**. **Funding, variable spreads, real slippage, exchange fill/latency, liquidation, and capital allocation are not modeled.**
- Checks exact candle coverage and continuity; **does not publish fabricated data** if every market fails.
- Splits recent ~14-day history chronologically into 50%, 25%, 25%, with 12-bar boundary embargo. These slices are **historical holdouts, not independent live forward validation**. Strategy rules are frozen; no automatic parameter optimization or promotion.
- GitHub saves the latest publicly viewable JSON report to `research/latest.json`. The site displays it in a new v6.2 panel.
- Output and validation code run without browser access, CSV downloads, trading credentials or placing real orders.

## Automation
See [INVO v6.2 Automated Paper Research](https://github.com/Elikers/invo-ultimate/actions/workflows/research.yml) for scheduled runs, jobs, and immutable execution artifacts. Failed research jobs leave the previous JSON untouched, which may become stale; inspect timestamps.

## Pages deployment
`.github/workflows/deploy.yml` checks website and research JavaScript/tests before deployment. In repository **Settings → Pages**, select **GitHub Actions** as Source.

## Important limitations
No strategy is approved for live trading. Findings are preliminary short-window historical simulations, *not proven predictive accuracy or guaranteed profitability*. Never treat the labels as actionable BUY or SELL signals. A research-only screen pass requires independent forward/paper validation, realistic costs, and considerably more data.

## v6.1
The interactive browser profitability module remains available for manual inspection but is **not required** for the automated v6.2 report.
