#!/usr/bin/env python3
"""Frozen historical break-even-cost audit from the 18 verified v7.6 archives.
Uses only the 8bps weighted month-local FINAL fold means; no trading/backfill.
"""
import json,sys,math
from pathlib import Path
MARKETS=("BTCUSDT","ETHUSDT","SOLUSDT")
ENGINES=("fusion","sweep","auction","pullback","volbreak","mean","strict")
def study(data):
 if data.get("schema")!="invo-v7.6-six-month-retrospective-summary-1" or data.get("research_only") is not True:
  raise ValueError("Unrecognized historical evidence")
 source=data.get("market_engine_summary")
 if not isinstance(source,list) or len(source)!=42:raise ValueError("Missing 42 historical cells")
 groups={}
 for r in source:
  key=(r["market"],r["engine"],r["cost_bps"])
  if r["market"] not in MARKETS or r["engine"] not in ENGINES or r["cost_bps"] not in (8,16) or key in groups:
   raise ValueError("Unexpected or duplicated historical record")
  if not isinstance(r["last_fold_trades"],int) or r["last_fold_trades"]<1 or not isinstance(r["weighted_monthly_last_fold_mean_pct"],(float,int)) or not math.isfinite(r["weighted_monthly_last_fold_mean_pct"]):
   raise ValueError("Bad evidence cell")
  groups[key]=r
 rows=[]
 for m in MARKETS:
  for e in ENGINES:
   a,b=(groups[(m,e,c)] for c in (8,16))
   if a["last_fold_trades"]!=b["last_fold_trades"] or abs(a["weighted_monthly_last_fold_mean_pct"]-b["weighted_monthly_last_fold_mean_pct"]-.08)>1e-7:
    raise ValueError("Cost consistency check failed")
   net=a["weighted_monthly_last_fold_mean_pct"]
   gross=net+.08
   rows.append({"market":m,"engine":e,"last_fold_trades":a["last_fold_trades"],
    "net_mean_pct_at_8bps":round(net,7),
    "gross_mean_pct_inferred_from_frozen_same_trades":round(gross,7),
    "break_even_round_trip_cost_bps":round(gross*100,4),
    "diagnosis":"NEGATIVE_GROSS_SIMULATED_EDGE" if gross<=0 else "GROSS_POSITIVE_BUT_BELOW_8BPS_COST"})
 return {"schema":"invo-v9.0-six-month-loss-economics-audit-1",
  "records":rows,"count":len(rows),
  "negative_even_at_zero_cost":sum(x["gross_mean_pct_inferred_from_frozen_same_trades"]<=0 for x in rows),
  "positive_gross_but_below_8bps":sum(0<x["gross_mean_pct_inferred_from_frozen_same_trades"]<.08 for x in rows),
  "positive_net_at_8bps":sum(x["net_mean_pct_at_8bps"]>0 for x in rows),
  "caveats":["Gross means inferred algebraically from historical hypothetical net returns at constant 8bps.",
   "Month-local final folds are retrospective, not one independently untouched six-month holdout.",
   "Break-even values are not venue fees, portfolio returns or proof of executable fills.",
   "No per-trade reason and market regime attribution is possible from summary-only artifact."] }
if __name__=="__main__":
 if len(sys.argv)!=2:raise SystemExit("Usage: historical_break_even.py v76-summary.json")
 report=study(json.loads(Path(sys.argv[1]).read_text()))
 Path("v90-real-historical-break-even.json").write_text(json.dumps(report,indent=2)+"\n")
 print(json.dumps({"count":report["count"],"negative_even_at_zero_cost":report["negative_even_at_zero_cost"],
 "gross_positive_but_under_8bps":report["positive_gross_but_below_8bps"],"positive_net_at_8bps":report["positive_net_at_8bps"],
 "examples":report["records"][:3]},indent=2))
