#!/usr/bin/env python3
"""Verify five original publisher-checksum-checked yearly manifests form a complete five-year 1m history."""
import argparse,datetime as dt,json,pathlib,sys
import collect
def audit(files):
    ranges=[("2021-11-18","2022-11-18"),("2022-11-18","2023-11-18"),("2023-11-18","2024-11-18"),
        ("2024-11-18","2025-11-18"),("2025-11-18","2026-11-18")]
    data=[json.loads(pathlib.Path(f).read_text()) for f in files];count=0;seen=set();issues=[]
    for a,b in ranges:
        found=[d for d in data if d.get("requested_start")==a and d.get("requested_end_exclusive")==b]
        if len(found)!=1:issues.append("MISSING_ANNUAL_SHARD_"+a);continue
        d=found[0]
        if d.get("interval")!="1m" or set(d.get("symbols",[]))!=set(collect.SYMBOLS) or not d.get("requested_slice_complete"):
            issues.append("INCOMPLETE_ANNUAL_SHARD_"+a)
        for e in d.get("entries",[]):
            identity=(e.get("symbol"),e.get("frequency"),e.get("period"))
            if identity in seen:issues.append("DUPLICATED_ARCHIVE_"+str(identity))
            seen.add(identity)
            if e.get("status")!="CHECKSUM_VERIFIED" or not e.get("coverage",{}).get("complete_interval"):
                issues.append("UNVERIFIED_ARCHIVE_"+str(identity))
            count+=e.get("coverage",{}).get("rows",0)
    target=(collect.END_EXCLUSIVE-collect.START).days*1440*len(collect.SYMBOLS)
    if count!=target:issues.append("INCOMPLETE_EXPECTED_CANDLE_COUNT")
    return {"schema":"mahoraga-five-year-cross-shard-audit-1","target_candles":target,
        "verified_candles":count,"archive_count":len(seen),"five_years_verified":not issues,
        "issues":issues,"historical_only":True,"forward_performance_not_proven":True}
if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("manifests",nargs="+");p.add_argument("--output")
    x=p.parse_args();report=audit(x.manifests)
    if x.output:pathlib.Path(x.output).write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps(report,indent=2))
    if report["issues"]:sys.exit(2)
