#!/usr/bin/env python3
"""Six predeclared complete months of verified Binance USD-M 5m data, read-only.
Archive bytes are verified with official .CHECKSUM and validated before JSON output.
"""
import csv, hashlib, io, json, math, re, sys, urllib.error, urllib.request, zipfile
from calendar import monthrange
from datetime import datetime, timezone
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'v75'))
from archive_audit import load
SYMBOLS=("BTCUSDT","ETHUSDT","SOLUSDT")
MONTHS=("2026-04","2026-05","2026-06","2026-07","2026-08","2026-09")
BAR=300000
MAX_ARCHIVE=12_000_000
MAX_UNCOMPRESSED=20_000_000

def archive_url(symbol, month):
    if symbol not in SYMBOLS or month not in MONTHS:
        raise ValueError("Instrument or month not predeclared")
    name=f"{symbol}-5m-{month}.zip"
    return f"https://data.binance.vision/data/futures/um/monthly/klines/{symbol}/5m/{name}"

def audit(symbol,month,compressed,checksum):
    if symbol not in SYMBOLS or month not in MONTHS: raise ValueError("Unexpected instrument/month")
    parts=checksum.split()
    if not parts or not re.fullmatch("[a-fA-F0-9]{64}",parts[0]):
        raise ValueError("Missing SHA-256 checksum")
    digest=hashlib.sha256(compressed).hexdigest()
    if digest != parts[0].lower(): raise ValueError("Official checksum mismatch")
    target=f"{symbol}-5m-{month}.csv"
    with zipfile.ZipFile(io.BytesIO(compressed)) as z:
        if z.namelist()!=[target]:raise ValueError("Unexpected archive layout")
        info=z.infolist()[0]
        if info.file_size>MAX_UNCOMPRESSED or info.compress_size>MAX_ARCHIVE:
            raise ValueError("Archive decompression limit exceeded")
        with z.open(info) as f:
            rows=list(csv.reader(io.TextIOWrapper(f,encoding="utf-8-sig",newline="")))
    if rows and rows[0] and rows[0][0] in ("open_time","Open time","Open Time"):rows=rows[1:]
    year,mo=map(int,month.split("-"))
    n=monthrange(year,mo)[1]*288
    if len(rows)!=n:raise ValueError(f"Incomplete month expected {n} candles, got {len(rows)}")
    start=int(datetime(year,mo,1,tzinfo=timezone.utc).timestamp()*1000)
    bars=[]
    for i,row in enumerate(rows):
        if len(row)<6:raise ValueError("Missing OHLCV columns")
        try:
            t=int(row[0]); o,h,l,c,v=map(float,row[1:6])
        except (TypeError,ValueError,OverflowError) as e:raise ValueError("Invalid candle field") from e
        if t!=start+i*BAR or not all(map(math.isfinite,(o,h,l,c,v))) or min(o,h,l,c)<=0 or v<0 or l>min(o,c) or h<max(o,c):
            raise ValueError(f"Candle continuity/OHLCV rejected at {i}")
        bars.append({"t":t,"o":o,"h":h,"l":l,"c":c,"v":v})
    return {"kind":"RETROSPECTIVE_ONLY_NOT_FORWARD","source":"BINANCE_VISION_USDM_HISTORICAL_ARCHIVE",
            "symbol":symbol,"month":month,"sha256":digest,"candles":len(bars),"bars":bars}

def retrieve(symbol,month):
    url=archive_url(symbol,month)
    raw=load(url,MAX_ARCHIVE)
    checksum=load(url+".CHECKSUM",512).decode("ascii","strict")
    return audit(symbol,month,raw,checksum)

def main():
    if len(sys.argv)!=3:raise ValueError("Usage: monthly_archive.py BTCUSDT 2026-04")
    result=retrieve(sys.argv[1],sys.argv[2])
    print(json.dumps(result,separators=(",",":"),allow_nan=False))

if __name__=="__main__":
    try:main()
    except Exception as e:
        print("MONTHLY_ARCHIVE_REJECTED:",str(e),file=sys.stderr)
        sys.exit(1)
