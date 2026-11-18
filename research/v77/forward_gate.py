#!/usr/bin/env python3
"""Research-only forward evidence gate. No trades, writes to main, or strategy approval.
Processes a checked-out MAIN snapshot, never retrospective v7.6 artifacts.
"""
import json, pathlib, sys
from datetime import datetime, timezone

def iso(s):
    if not isinstance(s,str): raise ValueError("missing ISO timestamp")
    t=datetime.fromisoformat(s.replace("Z","+00:00"))
    if t.tzinfo is None: raise ValueError("unqualified timestamp")
    return t.astimezone(timezone.utc)

def analyze(root, now):
    root=pathlib.Path(root)
    forward=json.loads((root/"research/forward-intelligence.json").read_text())
    registration=json.loads((root/"research/v7-registration.json").read_text())
    shadow=json.loads((root/"research/v7-paper-summary.json").read_text())
    if forward.get("schema")!="invo-v6.8-forward-intelligence-1" or registration.get("schema")!="invo-v7.3-prospective-registration-1" or shadow.get("schema")!="invo-v7.3-candidate-paper-summary-1":
        raise ValueError("Unexpected report schema")
    regtime=iso(registration["registered_utc"])
    last=iso(forward["forward_updated_utc"])
    updated=iso(shadow["updated_utc"])
    if iso(shadow["registered_utc"]) != regtime:raise ValueError("Candidate registration mismatch")
    if last>now or updated>now:raise ValueError("Future report timestamp")
    age_hours=round((now-last).total_seconds()/3600,2)
    if age_hours<0:raise ValueError("Invalid report age")
    closed=forward["aggregate"]["closed"]
    if not isinstance(closed,int) or closed<0:raise ValueError("Invalid forward closed count")
    required=forward["required_samples"]["min_closed_total"]
    if not isinstance(required,int) or required<100:raise ValueError("Sample floor lowered")
    sample_gate=closed>=required
    variants=("BASELINE_FROZEN","CANDIDATE_SHORTER_TIME_EXIT","CANDIDATE_TIGHTER_STOP")
    counts={}
    for name in variants:
        count=shadow["by_candidate"][name]["closed"]
        if not isinstance(count,int) or count<0:raise ValueError("Invalid candidate count")
        counts[name]=count
    # Summary does not supply independent per-pair candidate evidence; hence no approval.
    min_each=registration["minimums"]["closed_per_market_strategy_candidate"]
    min_total=registration["minimums"]["closed_overall"]
    if min_each<30 or min_total<100:raise ValueError("Candidate thresholds weakened")
    return {"schema":"invo-v7.7-forward-research-gate-1","source":"MAIN_REPO_REPORTS_NOT_HISTORICAL_V76",
        "forward_closed":closed,"forward_required":required,
        "forward_updated_utc":forward["forward_updated_utc"],"forward_age_hours":age_hours,
        "forward_sample_sufficient":sample_gate,
        "shadow_candidate_closed":counts,
        "shadow_required_overall":min_total,"shadow_required_per_pair":min_each,
        "status":"INSUFFICIENT_FORWARD_SAMPLE" if not sample_gate else "MANUAL_EVIDENCE_REVIEW_REQUIRED",
        "production_approval":False,
        "warnings":["Research-only snapshot assessment; sample size alone is not proof of edge.",
          "Candidate summary lacks independent per-market/per-strategy sample evidence and real execution costs.",
          "Existing historical negative v7.6 results must not be counted as new forward trades.",
          "No automated candidate promotion, strategy changes, orders or risk adjustments."]}

def main():
    if len(sys.argv)!=2:raise ValueError("Usage: forward_gate.py /path/to/main-checkout")
    result=analyze(sys.argv[1],datetime.now(timezone.utc))
    print(json.dumps(result,indent=2))
if __name__=="__main__":
    try:main()
    except Exception as e:
        print("FORWARD_GATE_REJECTED:",e,file=sys.stderr)
        sys.exit(1)
