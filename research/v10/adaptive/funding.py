#!/usr/bin/env python3
"""Research-only official Binance Vision monthly funding settlements (no inferred rates).
Fail closed if source files, checksums or settlement schema are unavailable.
"""
import argparse,csv,datetime as dt,hashlib,io,json,math,pathlib,re,urllib.request,zipfile
SYMBOLS=("BTCUSDT","ETHUSDT","SOLUSDT")
BASE="https://data.binance.vision/data/futures/um/monthly/fundingRate"
def monthly(start,end):
    y,m=start.year,start.month
    while (y,m)<=(end.year,end.month):
        yield f"{y:04d}-{m:02d}"
        m+=1
        if m>12:y+=1;m=1
def get(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"MAHORAGA-research-funding-v10.1"}),timeout=40) as r:
        if r.status!=200:raise RuntimeError("HTTP status")
        value=r.read(10_000_001)
        if len(value)>10_000_000:raise ValueError("funding archive exceeds 10MB")
        return value
def verify(blob,checksum,filename):
    match=re.fullmatch(r"([a-fA-F0-9]{64})\s+\*?([^\s]+)",checksum.decode("ascii").strip())
    if not match or pathlib.PurePosixPath(match.group(2)).name!=filename or hashlib.sha256(blob).hexdigest().lower()!=match.group(1).lower():
        raise ValueError("invalid publisher funding SHA256")
def parse(blob,month):
    with zipfile.ZipFile(io.BytesIO(blob)) as z:
        files=[n for n in z.namelist() if not n.endswith("/")]
        if len(files)!=1 or not files[0].endswith(".csv"):raise ValueError("bad ZIP contents")
        reader=csv.DictReader(io.TextIOWrapper(z.open(files[0]),encoding="utf-8-sig",newline=""))
        fields=set(reader.fieldnames or [])
        tfield=next((s for s in ("calc_time","calcTime","fundingTime") if s in fields),None)
        rfield=next((s for s in ("last_funding_rate","lastFundingRate","fundingRate") if s in fields),None)
        if not tfield or not rfield:raise ValueError("unrecognized funding CSV header "+repr(sorted(fields)))
        records=[];prev=None
        for row in reader:
            t=int(row[tfield]);rate=float(row[rfield])
            if t>10**15:t//=1000
            stamp=dt.datetime.fromtimestamp(t/1000,dt.timezone.utc)
            if not math.isfinite(rate) or abs(rate)>0.1 or stamp.strftime("%Y-%m")!=month:
                raise ValueError("invalid or out-of-month funding row")
            if prev is not None and t<=prev:raise ValueError("duplicate/disordered funding events")
            prev=t;records.append({"funding_time_ms":t,"rate":rate})
        if not records:raise ValueError("empty funding")
        return records
def collect(out,start=dt.date(2021,11,1),end=dt.date(2026,10,1),symbols=SYMBOLS):
    out.mkdir(parents=True,exist_ok=True)
    summary=[]
    for symbol in symbols:
        for month in monthly(start,end):
            name=f"{symbol}-fundingRate-{month}.zip"
            url=f"{BASE}/{symbol}/{name}"
            blob=get(url);verify(blob,get(url+".CHECKSUM"),name)
            records=parse(blob,month)
            data_path=out/f"{symbol}-{month}.json"
            data_path.write_text(json.dumps(records,separators=(",",":"))+"\n")
            summary.append({"symbol":symbol,"month":month,"url":url,
                "publisher_sha256":hashlib.sha256(blob).hexdigest(),"events":len(records),
                "first_ms":records[0]["funding_time_ms"],"last_ms":records[-1]["funding_time_ms"]})
    report={"schema":"mahoraga-funding-monthly-v1","count":len(summary),
        "expected":len(symbols)*len(list(monthly(start,end))),
        "source":BASE,"verified":True,"events":sum(z["events"] for z in summary),
        "records":summary,"historical_only":True,"not_valid_execution_price":True}
    (out/"funding-provenance.json").write_text(json.dumps(report,indent=2)+"\n")
    return report
if __name__=="__main__":
    a=argparse.ArgumentParser()
    a.add_argument("--out",required=True,type=pathlib.Path)
    a.add_argument("--start",default="2021-11-01")
    a.add_argument("--end",default="2026-10-01")
    a.add_argument("--symbols",nargs="+",choices=SYMBOLS,default=list(SYMBOLS))
    x=a.parse_args()
    r=collect(x.out,dt.date.fromisoformat(x.start),dt.date.fromisoformat(x.end),x.symbols)
    print(json.dumps({"verified":r["verified"],"archives":r["count"],"events":r["events"]}))
