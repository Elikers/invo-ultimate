#!/usr/bin/env python3
"""Research-only five-year Binance USD-M perpetual historical 1m downloader.

No wallet, orders, strategy changes, or backfilling of forward observations.
Uses official monthly/daily ZIP archives and sidecar SHA-256 CHECKSUMs.
Stores original ZIP files and independently generated provenance/coverage manifests.
"""
import argparse, calendar, csv, datetime as dt, hashlib, io, json, pathlib, re, sys, time, urllib.error, urllib.request, zipfile

UTC=dt.timezone.utc
SYMBOLS=("BTCUSDT","ETHUSDT","SOLUSDT")
SOURCE="https://data.binance.vision/data/futures/um"
START=dt.date(2021,11,18)
END_EXCLUSIVE=dt.date(2026,11,18)
MAX_BYTES=55_000_000
def sha(b):return hashlib.sha256(b).hexdigest()
def url_for(symbol,day,frequency="monthly"):
    if symbol not in SYMBOLS:raise ValueError("Symbol not approved")
    suffix=day.strftime("%Y-%m" if frequency=="monthly" else "%Y-%m-%d")
    fname=f"{symbol}-1m-{suffix}.zip"
    return f"{SOURCE}/{frequency}/klines/{symbol}/1m/{fname}"
def plan(start=START,end_exclusive=END_EXCLUSIVE):
    if start<START or end_exclusive>END_EXCLUSIVE or start>=end_exclusive:raise ValueError("Range out of five-year scope")
    result=[];d=dt.date(start.year,start.month,1)
    while d<end_exclusive:
        next_month=(d.replace(day=28)+dt.timedelta(days=4)).replace(day=1)
        left=max(start,d);right=min(end_exclusive,next_month)
        if left==d and right==next_month:result.append(("monthly",d,left,right))
        else:
            for n in range((right-left).days):
                item=left+dt.timedelta(days=n);result.append(("daily",item,item,item+dt.timedelta(days=1)))
        d=next_month
    return result
def fetch(url):
    req=urllib.request.Request(url,headers={"User-Agent":"MAHORAGA-research-only-public-history/1.0"})
    with urllib.request.urlopen(req,timeout=45) as resp:
        if getattr(resp,"status",200)!=200:raise OSError("Unexpected HTTP status")
        b=resp.read(MAX_BYTES+1)
        if len(b)>MAX_BYTES:raise ValueError("Archive byte cap exceeded")
        return b
def validate_checksum(archive,sidecar,name):
    data=sidecar.decode("ascii").strip().splitlines()
    if len(data)!=1:raise ValueError("Ambiguous publisher checksum")
    match=re.fullmatch(r"([a-fA-F0-9]{64})\s+\*?(.+)",data[0].strip())
    if not match or pathlib.PurePosixPath(match.group(2)).name!=name:
        raise ValueError("Publisher checksum filename/hash invalid")
    if sha(archive).lower()!=match.group(1).lower():
        raise ValueError("Publisher SHA256 mismatch")
def inspect_kline_archive(blob,expected_name,lo,hi):
    if not zipfile.is_zipfile(io.BytesIO(blob)):raise ValueError("Not ZIP")
    count=0;first=last=None;duplicate=0;gaps=0;bad=0
    prev=None
    with zipfile.ZipFile(io.BytesIO(blob)) as z:
        names=[x for x in z.infolist() if not x.is_dir()]
        if len(names)!=1 or names[0].file_size>25_000_000:
            raise ValueError("Unsupported archive structure or size")
        if not names[0].filename.endswith(".csv"):
            raise ValueError("ZIP is not CSV")
        with z.open(names[0]) as stream:
            rows=csv.reader(io.TextIOWrapper(stream,encoding="utf8",newline=""))
            for fields in rows:
                if not fields:continue
                if fields[0].lower()=="open_time":continue
                if len(fields)<6:raise ValueError("Invalid candle column count")
                try:
                    timestamp=int(fields[0])
                    if timestamp>10**15:timestamp=timestamp//1000  # never silently permit nanosecond times
                    price=[float(x) for x in fields[1:5]]
                    volume=float(fields[5])
                except (ValueError,OverflowError):raise ValueError("Unparseable candle data")
                if any(x<=0 or x!=x or x==float('inf') for x in price) or volume<0 or volume!=volume:
                    bad+=1;raise ValueError("Invalid price or volume")
                if price[1]<max(price[0],price[3]) or price[2]>min(price[0],price[3]):
                    raise ValueError("OHLC contradiction")
                if prev is not None:
                    if timestamp<=prev:duplicate+=1
                    if timestamp>prev+60000:gaps+=(timestamp-prev)//60000-1
                if first is None:first=timestamp
                last=timestamp;prev=timestamp;count+=1
    expected_lo=int(dt.datetime.combine(lo,dt.time(0),UTC).timestamp()*1000)
    expected_hi=int(dt.datetime.combine(hi,dt.time(0),UTC).timestamp()*1000)
    if not count or first is None or last is None or last>=expected_hi or first<expected_lo:
        raise ValueError("Archive contains candles outside its specified date")
    return {"rows":count,"first_open_ms":first,"last_open_ms":last,
            "within_file_gaps":gaps,"duplicate_or_disordered":duplicate,"invalid_values":bad,
            "expected_interval_ms":60000}
def collect(symbol,start,end,out,limit=None):
    out.mkdir(parents=True,exist_ok=True)
    entries=[];requested=plan(start,end)
    for frequency,period,lo,hi in requested[:limit]:
        url=url_for(symbol,period,frequency);name=url.rsplit("/",1)[-1]
        dest=out/symbol/name
        dest.parent.mkdir(parents=True,exist_ok=True)
        print(f"FETCH {symbol} {frequency} {period.isoformat()}",flush=True)
        item={"symbol":symbol,"frequency":frequency,"period":period.isoformat(),
              "source_url":url,"publisher_checksum_url":url+".CHECKSUM",
              "scope_start_utc":lo.isoformat(),"scope_end_exclusive_utc":hi.isoformat(),
              "source_exchange":"Binance USD-M futures","market":"USDT-margined perpetual",
              "forward_eligible":False,"trading_experience_labels":False}
        try:
            # Always refetch sidecar to detect changed publisher archives.
            check=fetch(url+".CHECKSUM")
            if dest.exists():
                blob=dest.read_bytes()
            else:
                blob=fetch(url)
            validate_checksum(blob,check,name)
            coverage=inspect_kline_archive(blob,name,period,period+dt.timedelta(days=1) if frequency=="daily" else
                 (period.replace(day=28)+dt.timedelta(days=4)).replace(day=1))
            if not dest.exists():dest.write_bytes(blob)
            item.update({"status":"CHECKSUM_VERIFIED","zip_sha256":sha(blob),"bytes":len(blob),"coverage":coverage})
        except (urllib.error.HTTPError,urllib.error.URLError,ValueError,OSError,zipfile.BadZipFile) as e:
            item.update({"status":"UNAVAILABLE_OR_INVALID","error":str(e)[:170]})
            print(f"WARNING {symbol} {period}: {e}",file=sys.stderr,flush=True)
        entries.append(item)
    return entries
def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--symbols",nargs="+",default=list(SYMBOLS),choices=SYMBOLS)
    ap.add_argument("--from-date",default=START.isoformat())
    ap.add_argument("--through-date",default=(END_EXCLUSIVE-dt.timedelta(days=1)).isoformat())
    ap.add_argument("--out",required=True)
    ap.add_argument("--limit-periods",type=int)
    x=ap.parse_args()
    begin=dt.date.fromisoformat(x.from_date);end=dt.date.fromisoformat(x.through_date)+dt.timedelta(days=1)
    if x.limit_periods is not None and not 1<=x.limit_periods<=60:raise ValueError("Invalid bounded limit")
    root=pathlib.Path(x.out).resolve()
    if root==pathlib.Path("/") or len(str(root))<10:raise ValueError("Unsafe storage location")
    entries=[]
    for sym in x.symbols:
        entries.extend(collect(sym,begin,end,root,x.limit_periods))
    result={"schema":"mahoraga-five-year-binance-perp-history-v1",
        "requested_start":begin.isoformat(),"requested_end_exclusive":end.isoformat(),
        "created_at_utc":dt.datetime.now(UTC).isoformat(),"source":"https://data.binance.vision",
        "symbols":x.symbols,"entries":entries,
        "verified_archives":sum(y["status"]=="CHECKSUM_VERIFIED" for y in entries),
        "unavailable_archives":sum(y["status"]!="CHECKSUM_VERIFIED" for y in entries),
        "verified_candles":sum(y.get("coverage",{}).get("rows",0) for y in entries),
        "five_years_complete":False,"source_is_historical_not_forward":True,
        "no_trading_orders":True,"not_training_approved":True}
    # Never claim full five-year completion without all planned archives and continuous candles.
    full=len(x.symbols)*len(plan(begin,end))
    result["five_years_complete"]=len(entries)==full and all(e["status"]=="CHECKSUM_VERIFIED" and
      e["coverage"]["within_file_gaps"]==0 and e["coverage"]["duplicate_or_disordered"]==0 for e in entries)
    (root/"coverage-manifest.json").write_text(json.dumps(result,indent=2)+"\n",encoding="utf8")
    print(json.dumps({k:v for k,v in result.items() if k!="entries"}),flush=True)
    if result["unavailable_archives"]:sys.exit(2)
if __name__=="__main__":main()
