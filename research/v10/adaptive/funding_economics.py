#!/usr/bin/env python3
"""Reconcile signed actual Binance funding settlement records to candidate fills.
Strictly evaluates intervals WITH complete monthly funding coverage, never
credits missing November 2026 funding as zero. Historical only.
"""
import argparse,bisect,json,math,pathlib
from collections import defaultdict
SYMBOLS=("BTCUSDT","ETHUSDT","SOLUSDT")
COVERAGE_END_MS=1793491200000 # 2026-11-01 00:00 UTC
def load(funding_root,symbol):
    manifest=json.loads((funding_root/symbol/"funding-provenance.json").read_text())
    if not manifest.get("verified") or manifest.get("count")!=60 or manifest.get("expected")!=60:
        raise ValueError("incomplete funding provenance")
    archive_months={x["month"] for x in manifest["records"]}
    expected=set()
    y,m=2021,11
    while (y,m)<=(2026,10):
        expected.add(f"{y:04d}-{m:02d}");m+=1
        if m==13:m=1;y+=1
    if archive_months!=expected:raise ValueError("missing monthly funding archive")
    events=[]
    for month in sorted(archive_months):
        rec=json.loads((funding_root/symbol/f"{symbol}-{month}.json").read_text())
        events.extend((int(x["funding_time_ms"]),float(x["rate"])) for x in rec)
    events.sort()
    if len(set(t for t,r in events))!=len(events):raise ValueError("overlapping funding timestamps")
    if not all(math.isfinite(r) and abs(r)<=.1 for _,r in events):raise ValueError("invalid funding")
    return events
def apply(records,events):
    times=[x[0] for x in events]
    values=[x[1] for x in events]
    eligible=[]
    unknown=0
    for x in records:
        if x["exit_time_ms"]>=COVERAGE_END_MS or x["entry_time_ms"]>=COVERAGE_END_MS:
            unknown+=1;continue
        a=bisect.bisect_right(times,x["entry_time_ms"])
        b=bisect.bisect_right(times,x["exit_time_ms"])
        direction=1 if x["side"]=="LONG" else -1
        signed=sum(values[a:b])*direction
        net=x["net_return"]-signed
        eligible.append({"trade":x,"signed_funding_cost":signed,"funding_adjusted_net":net,
                         "settlement_count":b-a})
    return eligible,unknown
def report(reconciled,unknown):
    ret=[x["funding_adjusted_net"] for x in reconciled]
    gains=sum(x for x in ret if x>0)
    losses=-sum(x for x in ret if x<0)
    return {"reconciled_trades":len(ret),"unknown_funding_trades_excluded":unknown,
        "mean_funding_adjusted_return":sum(ret)/len(ret) if ret else None,
        "profit_factor":gains/losses if losses>0 else None,
        "retrospective_only":True,"full_period_economics_verified":False,
        "order_book_execution_verified":False,"approved_for_live":False}
if __name__=="__main__":
    a=argparse.ArgumentParser();a.add_argument("--funding-root",required=True,type=pathlib.Path)
    a.add_argument("--results-root",required=True,type=pathlib.Path)
    a.add_argument("--output",required=True,type=pathlib.Path)
    x=a.parse_args();combined={}
    for symbol in SYMBOLS:
        events=load(x.funding_root,symbol)
        source=x.results_root/symbol/"test-ledger.jsonl"
        records=[json.loads(line) for line in source.read_text().splitlines() if line.strip()]
        reconciled,unknown=apply(records,events)
        combined[symbol]=report(reconciled,unknown)
    x.output.write_text(json.dumps({"schema":"mahoraga-v101-funding-economics-v1",
        "coverage_end_exclusive_ms":COVERAGE_END_MS,
        "trading_cost_model":"signed actual Binance historical settlement rates on simulated positions; execution fees/slippage remain assumptions",
        "research_only":True,"markets":combined},indent=2)+"\n")
    print(json.dumps(combined))
