#!/usr/bin/env python3
"""INVO v7.5 independent, public archive validation ONLY. No trading or performance claims."""
import csv, hashlib, io, json, re, sys, urllib.error, urllib.request, zipfile
from datetime import datetime, timezone
from urllib.parse import urlparse

ALLOWED = {"BTCUSDT", "ETHUSDT", "SOLUSDT"}
MAX_ZIP_BYTES = 2_000_000
MAX_CHECKSUM_BYTES = 512
INTERVAL_MS = 300000
def archive_url(symbol, day):
    if symbol not in ALLOWED or not re.fullmatch(r"20\d\d-\d\d-\d\d", day):
        raise ValueError("Unsupported symbol/date")
    datetime.strptime(day, "%Y-%m-%d")
    name = f"{symbol}-5m-{day}.zip"
    return f"https://data.binance.vision/data/futures/um/daily/klines/{symbol}/5m/{name}"

def load(url, limit):
    if urlparse(url).hostname != "data.binance.vision" or not url.startswith("https://"):
        raise ValueError("Unapproved archive domain")
    request = urllib.request.Request(url, headers={"User-Agent":"INVO-v75-historical-archive-audit/1.0"})
    with urllib.request.urlopen(request, timeout=18) as response:
        if response.status != 200:
            raise ValueError("Archive HTTP " + str(response.status))
        content = response.read(limit+1)
    if len(content) > limit:
        raise ValueError("Response exceeds safety limit")
    return content

def audit_zip(symbol, day, raw, checksum):
    filename = f"{symbol}-5m-{day}.zip"
    digest = hashlib.sha256(raw).hexdigest()
    if not re.fullmatch(r"[0-9a-fA-F]{64}", checksum.split()[0]) or checksum.split()[0].lower() != digest:
        raise ValueError("Official SHA256 CHECKSUM mismatch")
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        if z.namelist() != [filename.replace(".zip",".csv")]:
            raise ValueError("Unexpected archive file layout")
        info=z.infolist()[0]
        if info.file_size > 750000 or info.compress_size > MAX_ZIP_BYTES:
            raise ValueError("Archive decompression safety limit exceeded")
        with z.open(info) as stream:
            text=io.TextIOWrapper(stream, encoding="utf-8-sig", newline="")
            rows=list(csv.reader(text))
    if rows and rows[0][0] in ("open_time","Open time","Open Time"):
        rows=rows[1:]
    if len(rows)!=288:
        raise ValueError("Unexpected 5m candles for complete UTC day: "+str(len(rows)))
    start=int(datetime.strptime(day,"%Y-%m-%d").replace(tzinfo=timezone.utc).timestamp()*1000)
    for i,row in enumerate(rows):
        if len(row)<6:
            raise ValueError("Missing OHLCV fields")
        time=int(row[0])
        # We do not silently re-scale a mixed timestamp series.
        if time!=start+i*INTERVAL_MS:
            raise ValueError("UTC timestamp discontinuity / unsupported epoch unit")
        op,hi,lo,cl,volume=map(float,row[1:6])
        if min(op,hi,lo,cl)<=0 or volume<0 or lo>min(op,cl) or hi<max(op,cl):
            raise ValueError("Invalid OHLCV row")
    return {"schema":"invo-v7.5-archive-audit-1","source":"binance_vision_usdm_perpetual",
            "symbol":symbol,"day":day,"interval":"5m","candles":len(rows),
            "sha256":digest,"first_open_ms":start,"last_open_ms":start+287*INTERVAL_MS,
            "status":"VERIFIED_ARCHIVED_HISTORICAL_ONLY",
            "caveat":"Not a forward observation; archived Binance prices are not Hyperliquid execution prices."}

def main():
    symbol=sys.argv[1] if len(sys.argv)>1 else "BTCUSDT"
    day=sys.argv[2] if len(sys.argv)>2 else "2026-09-15"
    url=archive_url(symbol,day)
    raw=load(url,MAX_ZIP_BYTES)
    checksum=load(url+".CHECKSUM",MAX_CHECKSUM_BYTES).decode("ascii","strict").strip()
    print(json.dumps(audit_zip(symbol,day,raw,checksum),indent=2))

if __name__ == "__main__":
    try: main()
    except (ValueError,OSError,zipfile.BadZipFile,urllib.error.URLError) as e:
        print("ARCHIVE_SOURCE_REJECTED:",str(e),file=sys.stderr)
        sys.exit(1)
