#!/usr/bin/env python3
"""Report predeclared 18 market-month results, retrospective only. No candidate selection."""
import json, pathlib, sys, statistics
SYMBOLS=("BTCUSDT","ETHUSDT","SOLUSDT")
MONTHS=("2026-04","2026-05","2026-06","2026-07","2026-08","2026-09")
ENGINES=("fusion","sweep","auction","pullback","volbreak","mean","strict")
def aggregate(root):
    folder=pathlib.Path(root)
    sources={}
    rows=[]
    for market in SYMBOLS:
        for month in MONTHS:
            p=folder / f"historical-{market}-{month}" / "result.json"
            if not p.is_file():raise ValueError(f"Missing archive result: {p}")
            d=json.loads(p.read_text())
            if (d["schema"]!="invo-v7.6-monthly-frozen-historical-1" or
                d["evidence"]!="RETROSPECTIVE_ONLY_NOT_FORWARD" or
                d["symbol"]!=market or d["month"]!=month or
                len(d["results"])!=14):
                raise ValueError(f"Unverified/incompatible result {p}")
            sources[market+"/"+month]={"sha256":d["source_sha256"],"candles":d["bars"]}
            for q in d["results"]:
                if q["engine"] not in ENGINES or q["cost_bps"] not in (8,16) or len(q["folds"])!=3:
                    raise ValueError("Unexpected strategy, cost or fold")
                x=q["folds"][-1]
                rows.append({"market":market,"month":month,"engine":q["engine"],"cost_bps":q["cost_bps"],
                    "last_fold_n":x["closed"],"last_fold_mean_pct":x["net_expectancy_pct"],
                    "screen":q["screen"]})
    if len(rows)!=252:raise ValueError("Expected all 252 market-month-cost-engine results")
    summary=[]
    for market in SYMBOLS:
        for engine in ENGINES:
            for cost in (8,16):
                grp=[x for x in rows if x["market"]==market and x["engine"]==engine and x["cost_bps"]==cost]
                if len(grp)!=6:raise ValueError("Missing monthly strategy result")
                valid=[x for x in grp if x["last_fold_n"]>0 and x["last_fold_mean_pct"] is not None]
                total=sum(x["last_fold_n"] for x in valid)
                mean=sum(x["last_fold_n"]*x["last_fold_mean_pct"] for x in valid)/total if total else None
                summary.append({"market":market,"engine":engine,"cost_bps":cost,"last_fold_trades":total,
                    "months_positive":sum(x["last_fold_mean_pct"]>0 for x in valid),
                    "months_with_trades":len(valid),"weighted_monthly_last_fold_mean_pct":mean,
                    "monthly_screen_passes":sum(x["screen"]=="HISTORICAL_SCREEN_ONLY_NOT_FORWARD_VALIDATED" for x in grp)})
    return {"schema":"invo-v7.6-six-month-retrospective-summary-1",
        "period":"2026-04-01 through 2026-09-30 UTC (six complete months, per-month folds)",
        "sample_design":"Month-local 50/25/25 chronological historical folds; weighted final folds are NOT a single six-month chronological holdout.",
        "research_only":True,"data_coverage":sources,"market_engine_summary":summary,
        "warning":["Not new prospective observations, executable returns, exchange fills or portfolio PnL.",
            "Market-month trades and signals can be correlated, and monthly warm-ups may exclude early monthly bars.",
            "Costs 8/16 bps are hypothetical; funding, variable spread/slippage and liquidation not modeled.",
            "Do not pick the best-performing venue/month/engine and label that an independently validated edge."]}
def main():
    result=aggregate(sys.argv[1])
    pathlib.Path("v76-summary.json").write_text(json.dumps(result,indent=2)+"\n")
    print(json.dumps({"period":result["period"],"covered":len(result["data_coverage"]),
        "candles_total":sum(x["candles"] for x in result["data_coverage"].values()),
        "summary":result["market_engine_summary"]},indent=2))
if __name__=="__main__":
    try:main()
    except Exception as e:print("V76_AGGREGATE_REJECTED:",e,file=sys.stderr);sys.exit(1)
