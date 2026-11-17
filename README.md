# INVO Ultimate v6.2 — Automated Research & Profitability Validation

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
