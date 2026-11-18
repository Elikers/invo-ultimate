#!/usr/bin/env python3
"""Compact audit-only summary from 6-month retrospective CI result.json.
No trade decisions, no fitting, no return aggregation across months.
"""
import json,sys
if len(sys.argv)!=2: raise SystemExit("Usage: report_summary.py result.json")
with open(sys.argv[1],encoding="utf-8") as f: report=json.load(f)
if report.get("schema")!="invo-v7.6-monthly-frozen-historical-1" or report.get("evidence")!="RETROSPECTIVE_ONLY_NOT_FORWARD": raise SystemExit("Unexpected provenance")
assert len(report["results"])==14
print("V76_SUMMARY_START")
print(json.dumps({"symbol":report["symbol"],"month":report["month"],"sha256":report["source_sha256"],"bars":report["bars"],"records":[{"engine":r["engine"],"cost_bps":r["cost_bps"],"screen":r["screen"],"folds":r["folds"]} for r in report["results"]]},separators=(",",":"),allow_nan=False))
print("V76_SUMMARY_END")
