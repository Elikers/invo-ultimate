#!/usr/bin/env python3
"""Independent report audit: never promote on retrospective or previously inspected tests."""
import argparse,json,pathlib,math
MARKETS=("BTCUSDT","ETHUSDT","SOLUSDT")
def metrics(obj):
    for key in ("trades","metrics"):
        if key not in obj:raise ValueError("incomplete report "+key)
    return obj["metrics"]
def audit(root):
    items={}
    for sym in MARKETS:
        data=json.loads((root/sym/"model-report.json").read_text())
        assert data["symbol"]==sym and data["model_promotable"] is False
        assert data["test_status"]=="PREVIOUSLY_EXAMINED_RETROSPECTIVE_NOT_INDEPENDENT_FORWARD"
        bm=data["baseline_test"];ad=metrics(data["previously_exposed_test"])
        tests=[{"scenario":"published-costs-baseline","profit_factor":bm["profit_factor"],
                "mean_net_return":bm["mean_net_return"],"trades":bm["trades"]},
               {"scenario":"published-costs-adaptive","profit_factor":ad["profit_factor"],
                "mean_net_return":ad["mean_net_return"],"trades":data["previously_exposed_test"]["trades"]}]
        # Incremental adverse execution cost stress on existing candidate trade net returns.
        ledger=[]
        with (root/sym/"test-ledger.jsonl").open() as f:
            for line in f: ledger.append(json.loads(line))
        if len(ledger)!=data["previously_exposed_test"]["trades"]:raise ValueError("ledger count mismatch")
        for bps in (4,10,20):
            adjusted=[x["net_return"]-2*bps/10000 for x in ledger]
            plus=sum(z for z in adjusted if z>0)
            minus=-sum(z for z in adjusted if z<0)
            tests.append({"scenario":f"additional_{bps}bps_per_side",
                "trades":len(adjusted),
                "mean_net_return":sum(adjusted)/len(adjusted) if adjusted else None,
                "profit_factor":plus/minus if minus>0 else None})
        items[sym]={"selected_threshold":data["selected_threshold"],"training":data["training"],
             "validation":data["validation"],"test":data["previously_exposed_test"],
             "economics":tests}
    return {"schema":"mahoraga-v101-audit-v1","markets":items,
       "funding_historical_full_coverage_verified":False,
       "historical_funding_reconciled_with_replay":False,
       "orderbook_execution_verified":False,"fresh_forward_evidence":0,
       "pristine_final_holdout_available":False,
       "reason":"previously examined 2025-2026 holdout cannot be relabeled independent",
       "live_strategy_frozen":True,"risk_parameters_frozen":True,
       "candidate_auto_promotion":False,"approved_for_live":False,
       "profitability_verified":False}
if __name__=="__main__":
    a=argparse.ArgumentParser();a.add_argument("--results",type=pathlib.Path,required=True)
    a.add_argument("--out",type=pathlib.Path,required=True);x=a.parse_args()
    result=audit(x.results)
    x.out.parent.mkdir(parents=True,exist_ok=True)
    x.out.write_text(json.dumps(result,indent=2,allow_nan=False)+"\n")
    print(json.dumps({"approved_for_live":result["approved_for_live"],
        "markets":{s:r["economics"] for s,r in result["markets"].items()}},allow_nan=False))
