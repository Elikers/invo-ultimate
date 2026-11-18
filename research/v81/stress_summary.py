#!/usr/bin/env python3
"""Reprice verified v7.6 summary expectancy only: static 8-bps original replay.
This does NOT rerun trades, recompute fill paths, or infer an actual funding rate.
"""
import json,sys
from pathlib import Path
COSTS=(8,16,40,78)
ENGINES={"fusion","sweep","auction","pullback","volbreak","mean","strict"}
MARKETS={"BTCUSDT","ETHUSDT","SOLUSDT"}
def reprice(summary):
    if summary.get("schema")!="invo-v7.6-six-month-retrospective-summary-1" or summary.get("research_only") is not True:
        raise ValueError("Incompatible source summary")
    src=summary.get("market_engine_summary")
    if not isinstance(src,list) or len(src)!=42:raise ValueError("Expected 42 original records (3 markets x 7 engines x 2 costs)")
    original={}
    for row in src:
        k=(row["market"],row["engine"],row["cost_bps"])
        if row["market"] not in MARKETS or row["engine"] not in ENGINES or row["cost_bps"] not in (8,16) or k in original:
            raise ValueError("Malformed or duplicate evidence record")
        if not isinstance(row["last_fold_trades"],int) or row["last_fold_trades"]<1:
            raise ValueError("Missing sample count")
        if not isinstance(row["weighted_monthly_last_fold_mean_pct"],(int,float)):
            raise ValueError("Missing original mean")
        original[k]=row
    output=[]
    for market in sorted(MARKETS):
        for engine in sorted(ENGINES):
            a=original[(market,engine,8)]
            b=original[(market,engine,16)]
            if a["last_fold_trades"]!=b["last_fold_trades"] or abs((a["weighted_monthly_last_fold_mean_pct"]-b["weighted_monthly_last_fold_mean_pct"])-.08)>1e-8:
                raise ValueError("Original 8/16 bps cost translation inconsistent")
            orig=a["weighted_monthly_last_fold_mean_pct"]
            output.append({"market":market,"engine":engine,"trades_in_monthly_last_folds":a["last_fold_trades"],
                "expected_net_pct_by_total_assumed_cost_bps":{str(cost):round(orig-(cost-8)/100,8) for cost in COSTS},
                "method":"CONSTANT_COST_REPRICE_OF_V76_WEIGHTED_HISTORICAL_MEAN_ONLY"})
    return {"schema":"invo-v8.1-retrospective-stress-1",
      "provenance":"INVO_V76_VERIFIED_MONTHLY_RETROSPECTIVE_SUMMARY",
      "pairs":len(output),
      "costs_assumed_bps":list(COSTS),
      "positive_weighted_means_by_cost_bps":{str(c):sum(x["expected_net_pct_by_total_assumed_cost_bps"][str(c)]>0 for x in output) for c in COSTS},
      "results":output,
      "warnings":["Historical summary re-priced algebraically from the *same* simulated trades, not new independent sample.",
       "Not a full execution backtest; price-dependent stops, funding time, slippage variations and liquidation are not modeled.",
       "Cost buckets are speculative, not exchange fee schedules. No forward/live profitability evidence.",
       "v7.6 monthly final folds are not a continuous six-month held-out portfolio."] }
def main():
    if len(sys.argv)!=2:raise ValueError("Usage: stress_summary.py /path/to/v76-summary.json")
    source=json.loads(Path(sys.argv[1]).read_text())
    report=reprice(source)
    Path("v81-cost-stress.json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps({"schema":report["schema"],"pairs":report["pairs"],
      "positive_weighted_means_by_cost_bps":report["positive_weighted_means_by_cost_bps"]},indent=2))
if __name__=="__main__":
    try:main()
    except Exception as e:print("COST_STRESS_REJECTED:",e,file=sys.stderr);sys.exit(1)
