#!/usr/bin/env python3
"""Historical-only 14-day Binance Vision source with checksum and continuity guardrails."""
import io, json, sys, zipfile
from datetime import date, timedelta
from archive_audit import archive_url, load, audit_zip, MAX_ZIP_BYTES, MAX_CHECKSUM_BYTES
import csv

def export(symbol, start_day, days=14):
    start = date.fromisoformat(start_day)
    if days != 14: raise ValueError("Only predeclared 14-day period supported")
    if (start+timedelta(days=days)) > date(2026,11,18):
        raise ValueError("No incomplete or future historical window")
    hashes=[]
    bars=[]
    for n in range(days):
        day=(start+timedelta(days=n)).isoformat()
        url=archive_url(symbol,day)
        raw=load(url,MAX_ZIP_BYTES)
        sha=load(url+".CHECKSUM",MAX_CHECKSUM_BYTES).decode("ascii","strict").strip()
        proof=audit_zip(symbol,day,raw,sha)
        hashes.append({"day":day,"sha256":proof["sha256"]})
        with zipfile.ZipFile(io.BytesIO(raw)) as z:
            with z.open(f"{symbol}-5m-{day}.csv") as file:
                rows=list(csv.reader(io.TextIOWrapper(file,encoding="utf-8-sig",newline="")))
                if rows and rows[0][0] in ("open_time","Open time","Open Time"):rows=rows[1:]
                for r in rows:
                    bars.append(dict(t=int(r[0]),o=float(r[1]),h=float(r[2]),l=float(r[3]),c=float(r[4]),v=float(r[5])))
    if len(bars) != 4032 or any(bars[i]["t"]-bars[i-1]["t"] != 300000 for i in range(1,len(bars))):
        raise ValueError("14-day continuity/count failure")
    return {"source":"BINANCE_VISION_USDM_HISTORICAL_ARCHIVE","symbol":symbol,"start_day":start_day,
            "end_day":(start+timedelta(days=days-1)).isoformat(),"hashes":hashes,
            "bars":bars,"kind":"RETROSPECTIVE_ONLY_NOT_FORWARD"}
if __name__ == "__main__":
    try:
        symbol=sys.argv[1] if len(sys.argv)>1 else "BTCUSDT"
        start=sys.argv[2] if len(sys.argv)>2 else "2026-09-01"
        print(json.dumps(export(symbol,start),separators=(",",":")))
    except Exception as e:
        print("Historical archive input rejected:",str(e),file=sys.stderr)
        sys.exit(1)
