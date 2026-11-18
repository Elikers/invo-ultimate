# MAHORAGA v10.3 — Prospective Paper Market Intelligence (research only)

**Purpose:** collect genuinely NEW public Hyperliquid L2 market observations, lock preregistered research-only paper decisions BEFORE seeing the outcome, and label them only after a registered 60-minute maturity horizon. This is an observation and evidence system, **not trained profitable AI, not real orders, not trading deployment**.

## Frozen contract
See [registration.json](./registration.json): begins **2026-11-19 00:00:00 UTC**. Any run before the start is merely connectivity/pre-registration evidence, and MUST produce **zero** registered forward predictions. Recorded hypotheses are single top-10-level L2 book imbalance with spread < 5bps: imbalance >0.35 LONG, <-0.35 SHORT, otherwise NONE. These rules are an **untrained experimental hypothesis**, not a qualified MAHORAGA v10.2 strategy (all v10.2 families were rejected) and not an existing specialist's authenticated decision.

The public websocket collector (`capture.cjs`) runs for a bounded 20s, requests BTC/ETH/SOL `l2Book`, saves exact input source frames and hashes, timestamps and decision receipts, and writes explicit capture gaps on missing markets. Before the start time, records only pre-registration gaps; never backdates predictions. Capture artifacts last **30 days**. If no frames arrive, the workflow fails closed.

Later (`settle.cjs`), a separate manual workflow run downloads the original GitHub artifact, checks SHA256 and recomputes its original decision from stored pre-outcome raw quotes. A fresh public L2 exit quote is accepted only when observed at or after the 60-minute maturity and within 5 minutes of the specified horizon. Anything stale, unsupported, past the window, or lost during a disconnect is **MISSING_DATA**, not a loss/win or a backfill.

For a LONG the reference buys ask / sells bid; a SHORT sells bid / buys ask. Per-side fixed 4bps fee and 2bps extra adverse slippage are disclosed as **assumptions**. Unknown true future funding is never silently set to zero: reference outcomes contain `paper_net_ex_funding` and `paper_net_including_funding=null`. No fills are verified. A NONE observation matures to NO_TRADE. Sample count, side distribution, gap rates and matched quote P/L are research diagnostics, not validated account profitability.

## Workflows
- `.github/workflows/v103-forward.yml`: on research-branch push or manual dispatch, runs regression tests plus bounded public WebSocket capture. **Research-branch schedule is not configured**; GitHub schedules run on a repository's default branch. No ongoing unattended future collection is claimed.
- `.github/workflows/v103-mature.yml`: manual dispatch with the prior `source_run_id` after maturity. Its quote must arrive within the registered maturity window, otherwise data must be missing.
- CI can be tested with `node research/v10/forward/forward.test.cjs` and inherited `shadow.test.cjs` / `fullcycle/integration.test.cjs`.

## Durable provenance and governance limits
GitHub Actions log timestamps + uploaded receipt artifacts provide a preliminary audit trail, but not independent external signed attestation. Do not infer real exchange fill, true opportunity coverage, reliable market prediction, fresh evidence sufficiency, forward profitability, or continuous operation from a single short public capture. To validate performance, configure a separately approved durable collector and anchored store, capture many future opportunities (including all missing polls), with defensible fees, funding, independent attestation, and a risk-preserving shadow evaluation. Current outputs explicitly say `training_eligible=false` and `approved_for_live=false`.

**Live engine settings, website, risk limits, model champion and execution endpoints are untouched.**
