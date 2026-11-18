# INVO v8.0 — Global Strategy Evidence Scan (research only, 2026-11-18)

**No production change, no new strategy implementation, no live orders, no profit claim.**
Scope: a representative set of internationally accessible public platforms and academic results relevant to **BTC, ETH, SOL, JUP**. It is impossible to audit *every* trading website worldwide or their non-public account books. **JUP-specific independently reproducible strategy PnL was NOT found in this initial scan.** No external winning-system code/positions have been copied.

## INVO baseline (verified code and archived research)
- Engines: fusion, sweep, auction, pullback, volbreak, mean, strict.
- 5m closed candles, lookback up to 900 bars; simulated execution at next signal candle open; fixed 1% stop, 1.5% target, 12 five-minute bars maximum (~1h); stop-first assumption; 8/16 bps hypothetical round-trip costs. See `research/run.cjs`, `v61-core.js`.
- The six-month (Apr–Sep 2026) BTC/ETH/SOL Binance USD-M historical research tested 158,112 market-specific five-minute bars and showed negative weighted last-quarter monthly fold expectancy for **all 21 market/engine combinations at 8 bps**, and also negative at 16 bps. This is not a single six-month holdout and not live PnL; see `research/v76/README.md`.
- Latest verified main research snapshot: forward closed 19/100, shadow candidate closed 0. Not enough to establish INVO profitability. **Never** use external marketed returns to overwrite this evidence.

## Representative external research comparison and evidence grades
Use **A = public onchain/exchange records with independently auditable capital movements (still requires portfolio-level verification); B = forward-recorded hypothetical or published paper fills; C = retrospective backtest or self-reported ranking; D = tool/provider without strategy profit proof**. The grades indicate auditability, not recommendation or expected profits.

| Source | Relevant markets | Public performance evidence | Grade | What we can learn, not copy |
|---|---|---|---|---|
| Hyperliquid onchain vaults / BotOrNot leaderboard | Multi-asset perps; **cannot assume BTC/ETH/SOL/JUP exposure per vault** | Nov 17: HLP $2.21m 30d PnL and $141m all-time; other positive and negative vaults. Not comparable with INVO trade expectancy; vault types and leader fees differ | A for public figures; trade source/fee audit pending | Realized/unrealized total equity, cashflow adjustment, leverage/drawdown, strategy-type segmentation, survivorship and manager cuts |
| TradingAgentStack AI-labelled Hyperliquid vault review | Various perps; per-coin attribution not established | Nov 17: one vault +9.5% since Mar 4, 2026 (−2.0% max DD), allegedly AI-run; only leader's AI claim; vendor's calculation, not independently replicated by INVO | A/B conditional | Risk-adjusted returns, low drawdown, full-book accounting instead of only winning trades |
| SimianX AI trade leaderboard | BTC ETH SOL markets listed; cross-model results, **not guaranteed per coin** | Nov 16: Grok 4.6 +0.22R avg over 822 closed trades at 48.2% win rate, reported board statistic; open trades and portfolio costs require review | B/C published model analytics | Expectancy/R-multiple > win rate, minimum samples and open-position reconciliation; cannot assume net executable profits |
| OAK Research AI perpetual benchmark | BTC ETH SOL and others | Season 1 winner +29.4% over 90 days against BTC buy-and-hold +23.3%; modeled $10k perpetual account with leverage, fees, funding, slippage, liquidations; **historical simulation**, not live | C | Benchmark against buy-and-hold and common market conditions, realistic cash and funding accounting, evaluate AI only if genuine added information |
| TradeRank AI competition | Crypto + stocks; exact pairs require per-season checks | 11 completed seasons, 3,131 paper trades across models, **paper only**; today's winning season does not prove future edge | B | Avoid model leaderboard as strategy certification; compare forward paper with common benchmark |
| Six7 Alpha crypto bot experiments | BTC ETH SOL spot | Public paper-trading portfolio; notable negative local reconstructions: published backtests for RSI/EMA/Donchian can reverse dramatically under different fees, modeling and samples | B paper / C retrospective | Independent reproduction and cross-exchange fee sensitivity; reject advertised returns that fail reproduction |
| Collective2 | Assets vary; exact crypto strategies require lookup | Tracks model trades prospectively and some broker confirmations, but own methodology labels strategy returns **hypothetical** | B | Forward time-stamped track records and subscriber fill differences |
| QuantConnect | Crypto supported | Provides rigorous backtest/live analytics and out-of-sample testing framework; **not proof a specific public crypto system is profitable** | D methodology | Separate research from live accounting; benchmark real slippage, fees and look-ahead detection |
| 3Commas Strategy Gallery | BTC/USDT etc | Own documentation states displayed ROI/APY are historical DCA strategy backtests with default fees, not guaranteed live returns | C | Don't confuse backtest APY, trade frequency and real net profit; DCA can disguise tail exposure |
| Pionex | BTC/ETH/SOL bot pairs subject to current listings | Grid-profit metric reflects completed cycles, not necessarily total portfolio profit including unrealized inventory | D until full account verified | Track total equity and underwater inventory, not only completed winning cycles |
| Cryptohopper | Supported crypto pairs vary | Marketplace signaler reports and short historical backtests; specific total verified live net performance not established here | C/D | Audit signal publication timestamps and user-level fees/fills |
| eToro CopyTrader | BTC/ETH/SOL availability depends on jurisdiction/product | Investor track records shown, but broker explicitly says past user performance not predictive, copy fills differ | B/C depending account | Actual follower entry timing/costs and open losses; leader returns != follower returns |
| Numerai Crypto | Crypto signal tournament, not direct INVO PnL | Model signal scoring/originality, not automatically cash portfolio profit | D | Validate feature contribution and independence without saying tournament scores are dollar PnL |

## Academic hypotheses (not proven INVO improvements)
- 2026 journal paper spanning 2020–2025 finds risk-adjusted **multi-horizon time-series crypto momentum** better than cross-sectional momentum in that historical sample (reported 31.96% annual return; portfolio methodology, not comparable with INVO 5-minute trade metrics). That result must not be reused as a promise.
- 2026 academic paper on **crypto carry** documents unusually large, volatile futures-vs-spot basis driven in part by leverage demand and margin constraints; *not* free arbitrage after funding, venue risk, margin and transaction costs.
- 2025 market-state study suggests momentum can be concentrated in sustained rising-state transitions and vanish during other transitions. Potential **regime classification hypothesis**, not a guarantee or causally proven INVO edge.

## PRIORITIZED test hypotheses; NO implementation/parameter modification approved
1. **P0 — Fix economics and statistical validity**: use complete realized+unrealized PnL, per-venue taker/maker fees, funding, variable spread and slippage, impact, gaps, liquidation, simultaneous stops; measure net expectancy, profit factor, 95% uncertainty, max drawdown, average R, time in market, trade count and buy/hold benchmark. No new strategy tuning.
2. **P1 — Trade filtering hypothesis**: on genuinely future observations, freeze a regime classifier using only completed past candles (trend/volatility/liquidity) and test whether the existing **unmodified** engine's signals are less harmful in predeclared states; compare *opportunity costs and lost trades*, not only selected winners. Do not introduce a live filter yet.
3. **P2 — Longer timeframe hypothesis**: 5-minute signals exiting within 12 bars may chase noise and pay high costs. Test a separately registered strategy family with 1h/4h decision cadence versus identical-cost baselines, *after* the current baseline has a credible execution model. Do not re-label these as identical strategies.
4. **P3 — Risk-aware adaptive sizing hypothesis**: volatility normalization and market risk exposure, with strict max loss/drawdown and no leverage escalation; **research only**. Avoid conflating gross profit with favorable risk-adjusted performance.
5. **P4 — Structure-specific mechanisms**: funding/carry and market-neutral basis, grid/market making, order-flow/imbalance or liquidity sweeps require new validated order-book/spot/perp data and different execution models; **not** inferable from existing 5m OHLCV alone. Potentially costly/unsafe to implement and not a shortcut.
6. **P5 — Cross-exchange/per-asset validation**: match instrument contract and contemporaneous periods, avoid counting BTC/ETH/SOL or correlated venue rows as independent proof; JUP data must be explicitly verified or labeled unavailable.

## Pre-promotion gates
- Registration before any **new** independent forward observation with locked entry/exit, costs, clocks, and treatment of missing data.
- At least 100 closed aggregate forward-paper trades AND 30 per candidate-market group for a minimal inspection; these floors alone cannot justify promotion; include uncertainty and dependence corrections.
- Realistic cost sensitivity, independent period/regime evidence, drawdown and tail-loss scrutiny, no attractive strategy from cherry-picking multiple websites or multiple backtests.
- Full risk approval and independent code review before any production strategy adjustment; no auto promotion or real-money order mechanism.

## Sources inspected Nov 18, 2026
- Hyperliquid onchain vault data: https://getbotornot.com/leaderboard/ ; official vault structure: https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/vaults
- AI-vault evidence and self-labelled caveats: https://tradingagentstack.com/ai-trading-leaderboard/
- AI model expectancy board: https://www.simianx.ai/crypto-leaderboard
- OAK common-model benchmark: https://oakresearch.io/en/ai/trading-benchmark
- TradeRank paper caveats: https://www.traderank.ai/
- Six7 Alpha paper + independent backtest disagreement: https://www.six7alpha.com/transparency/crypto
- Collective2 methodology: https://trade.collective2.com/howc2works
- QuantConnect backtesting/live: https://www.quantconnect.com/docs/v2/cloud-platform/live-trading/results
- 3Commas strategy gallery: https://help.3commas.io/en/articles/14828053-strategy-gallery-how-to-find-and-launch-pre-built-dca-bot-strategies
- Pionex profit vs inventory: https://www.pionex.com/blog/knowledge-base/what-are-grid-profit-and-unrealized-profit/
- Cryptohopper backtests: https://docs.cryptohopper.com/docs/my-library/what-is-the-backtester/
- eToro: https://www.etoro.com/customer-service/copytrading-risks/
- Numerai: https://crypto.numer.ai/
- Academic momentum: https://www.zurnalai.vu.lt/BATP/en/article/view/44540
- Crypto carry: https://pubsonline.informs.org/doi/10.1287/mnsc.2024.05069
- Regime dependence: https://link.springer.com/article/10.1007/s11408-025-00474-9

**Research conclusion:** Credible systems and platforms show *some* positive results, but no general AI/software profitability guarantee and no apples-to-apples proof that their rules would improve INVO. Our demonstrated problem is negative net expectancy of the seven 5m frozen engines in v7.6, compounded by imperfect fill-cost modeling and sparse live forward data. Prioritize better accounting and independently registered tests, not copying returns, leveraged DCA/grid bets, or promoting an AI-branded model.
