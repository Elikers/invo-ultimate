# MAHORAGA v10.2 — Registered Research Strategy Discovery

**Branch:** `research/v10.2-strategy-discovery` (derived from v10.1 research branch). **Trading permissions:** none.

## Why this upgrade
v10.1's adaptive NO-TRADE filter remained negative on BTC/ETH/SOL after modeled execution costs and signed historical funding. v10.2 tests *different fixed signal hypotheses*, rather than retuning that already-inspected losing model and retroactively claiming a win.

## Preregistered hypotheses and contract
Exactly five fixed family names:
- `trend_12_48` — long/short from 12h vs 48h moving-average gap > ±0.3%.
- `breakout_24` — long when closed price > previous 24h high by 0.1%, short below previous 24h low by 0.1%.
- `revert_24` — counter-trend when closed price is ±1.75 rolling 24h close standard deviations from mean.
- `trend_vol` — same 12h/48h trend, abstain when 24h high-low range exceeds 7% of close.
- `flat_control` — deliberate always-NO-TRADE negative control.

Signals use only fully closed 1h bars aggregated from 7,888,320 publisher-verified continuous 1m source candles. Orders exist **only in a research simulator**: signal after hourly close, hypothetical fill next hour open. Stops 1.5%, takes 2.5%, exit after eight 1h bars; stop-first if both touch, adverse gaps not improved to the stop. Taker fee 4bps + adverse slippage 2bps each side; also add signed official Binance funding events for eligible simulated holding intervals. This is still an **approximate historical venue model**, not real exchange fill or liquidation evidence.

## Chronological evidence firewall
- Fixed preregistered development folds in 2023 and 2024 (four disjoint intervals entirely inside TRAIN).
- A family is eligible only if **each of four folds** contains at least 30 trades, positive mean after modeled costs, and profit factor > 1.05. Rank eligible families by lowest fold mean and reject all if none qualifies. We do not change that rule based on validation/test performance.
- November 18, 2024–November 17, 2025 is a **research validation diagnostic**, not used to select families.
- November 18, 2025–October 31, 2026 is a previously-inspected historical test; it is **NOT an independent blind holdout** and is never used to select candidates. 2026-11 is excluded because monthly funding verification ends October.
- No positive result changes production. New prospective authenticated predictions with independently verified matured labels are required for future confidence.

## Operational safeguards
- All code lives under `research/v10/discovery/` plus its research-only GitHub workflow.
- Original verified source data and publisher funding archives are kept in GitHub prerelease assets with SHA256 sidecars; all 620 original price ZIP files are rehashed during ingestion.
- No wallet credentials, order endpoints, website files, risk settings, or champion registrations are modified.
- `approved_for_live=false`, `auto_promotion=false`, and `forward_evidence=0` in every generated result.
- `sum_trade_returns_not_portfolio_pnl` is **not actual account P&L**; no risk-weighted portfolio or margin/liquidation simulator exists.

### Test execution
Run `python3 -m unittest discover -s research/v10/discovery -p 'test_*.py' -v`. GitHub Actions workflow `v102-discovery.yml` validates all safety tests and runs signed-funding historical comparisons in a symbol matrix. Only completed successful run logs or downloaded artifacts may support claims about actual performance.

**No profits are assumed, fabricated, or guaranteed.**
