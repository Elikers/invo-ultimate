#!/usr/bin/env python3
"""MAHORAGA historical-only Binance USD-M futures 1m archive acquisition.

No exchange credentials, trading, lookahead prediction claims, or model updates.
Archived monthly ZIP bytes retained; every file SHA-256 checked against Binance.
Does not silently interpolate absent candles. Request bounded to 60 months.
"""
import argparse
import calendar
import csv
import datetime as dt
import hashlib
import io
import json
import math
import pathlib
import re
import shutil
import sys
import time
import urllib.error
import urllib.request
import zipfile

BASE = "https://data.binance.vision/data/futures/um/monthly/klines"
SYMBOLS = ("BTCUSDT", "ETHUSDT", "SOLUSDT")
FIRST = (2021, 11)
LAST = (2026, 10)
MS = 60_000
UTC = dt.timezone.utc


def months(year, requested):
    items = [(year, m) for m in requested]
    return [(y, m) for y, m in items if FIRST <= (y, m) <= LAST]


def fetch(url, destination, limit=75_000_000, retries=3):
    """Network errors must not become successful fake archives."""
    destination = pathlib.Path(destination)
    last_error = None
    for attempt in range(retries):
        temp = destination.with_suffix(destination.suffix + ".partial")
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "MAHORAGA-Research-History/1.0"})
            with urllib.request.urlopen(request, timeout=40) as response, temp.open("wb") as stream:
                if response.status != 200:
                    raise RuntimeError("Unexpected HTTP status " + str(response.status))
                size = 0
                while True:
                    block = response.read(1024 * 512)
                    if not block:
                        break
                    size += len(block)
                    if size > limit:
                        raise RuntimeError("Source exceeds bounded file size")
                    stream.write(block)
            temp.replace(destination)
            return
        except (OSError, urllib.error.URLError, RuntimeError) as exc:
            last_error = str(exc)
            try:
                temp.unlink()
            except FileNotFoundError:
                pass
            if attempt + 1 < retries:
                time.sleep(min(6, 2 ** attempt))
    raise RuntimeError("Download failed: " + str(last_error))


def sha256_file(p):
    h = hashlib.sha256()
    with pathlib.Path(p).open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def month_bounds(year, month):
    start = int(dt.datetime(year, month, 1, tzinfo=UTC).timestamp() * 1000)
    days = calendar.monthrange(year, month)[1]
    return start, start + days * 86_400_000, days * 1440


def parse_time(raw):
    n = int(raw)
    if n > 10**15:
        n //= 1000  # explicit microsecond normalization if archive ever changes units
    return n


def validate_archive(p, year, month):
    start, end, expected = month_bounds(year, month)
    previous = None
    rows = missing = duplicated = 0
    gaps = []
    first = last = None
    with zipfile.ZipFile(p) as z:
        names = [x for x in z.namelist() if x.endswith(".csv") and "/" not in x]
        if len(names) != 1:
            raise ValueError("Expected exactly one flat CSV member")
        item = z.getinfo(names[0])
        if item.file_size > 75_000_000:
            raise ValueError("Uncompressed CSV exceeds safe bound")
        with z.open(item, "r") as raw:
            table = csv.reader(io.TextIOWrapper(raw, encoding="utf-8-sig", newline=""))
            for line, row in enumerate(table, 1):
                if line == 1 and row and row[0].strip().lower().startswith("open"):
                    continue
                if len(row) < 11:
                    raise ValueError("CSV missing kline columns on row " + str(line))
                stamp = parse_time(row[0])
                if stamp < start or stamp >= end or stamp % MS:
                    raise ValueError("Timestamp outside month/alignment")
                o, h, l, c, volume = (float(v) for v in row[1:6])
                if not all(map(math.isfinite, (o, h, l, c, volume))):
                    raise ValueError("Nonfinite OHLCV")
                if min(o, h, l, c) <= 0 or volume < 0 or h < max(o, c, l) or l > min(o, c, h):
                    raise ValueError("Invalid OHLCV candle")
                if previous is None:
                    if stamp > start:
                        n = (stamp - start) // MS
                        missing += n
                        gaps.append({"from_ms": start, "to_ms": stamp - MS, "missing_minutes": n})
                    first = stamp
                else:
                    if stamp <= previous:
                        duplicated += 1
                        raise ValueError("Duplicate or unsorted timestamp")
                    if stamp > previous + MS:
                        n = (stamp - previous) // MS - 1
                        missing += n
                        if len(gaps) < 200:
                            gaps.append({"from_ms": previous + MS, "to_ms": stamp - MS, "missing_minutes": n})
                previous = stamp
                last = stamp
                rows += 1
    if rows == 0:
        raise ValueError("No candles")
    if last < end - MS:
        n = (end - MS - last) // MS
        missing += n
        if len(gaps) < 200:
            gaps.append({"from_ms": last + MS, "to_ms": end - MS, "missing_minutes": n})
    if rows + missing != expected:
        raise ValueError("Row coverage arithmetic mismatch")
    return {"rows": rows, "expected_minutes": expected, "missing_minutes": missing,
            "duplicate_minutes": duplicated, "first_ms": first, "last_ms": last,
            "gaps_first_200": gaps, "complete": missing == 0, "training_approved": False}


def collect(symbol, year, month, target):
    if symbol not in SYMBOLS or not (FIRST <= (year, month) <= LAST):
        raise ValueError("Outside registered historical research scope")
    basename = f"{symbol}-1m-{year:04d}-{month:02d}.zip"
    url = f"{BASE}/{symbol}/1m/{basename}"
    target.mkdir(parents=True, exist_ok=True)
    dest = target / basename
    checksum_file = target / (basename + ".CHECKSUM")
    manifest_file = target / (basename + ".manifest.json")
    try:
        if not dest.exists():
            fetch(url, dest)
        fetch(url + ".CHECKSUM", checksum_file, limit=10_000)
        expected = checksum_file.read_text(encoding="utf-8").strip().split()[0].lower()
        if not re.fullmatch(r"[0-9a-f]{64}", expected):
            raise ValueError("Malformed official SHA256 checksum")
        actual = sha256_file(dest)
        if expected != actual:
            raise ValueError("Official source SHA256 mismatch")
        quality = validate_archive(dest, year, month)
        record = {
            "schema": "mahoraga-history-month-1",
            "source": "Binance USD-M perpetual futures public monthly 1m klines",
            "original_url": url,
            "official_checksum_url": url + ".CHECKSUM",
            "venue": "BINANCE_USDM_NOT_HYPERLIQUID",
            "market": symbol, "month": f"{year:04d}-{month:02d}",
            "interval": "1m", "raw_zip_sha256": actual,
            "official_checksum_verified": True,
            "exchange_execution_history": False,
            "actual_mahoraga_trades": 0,
            "forward_evidence": False, "market_data_only": True, **quality
        }
        manifest_file.write_text(json.dumps(record, sort_keys=True, indent=2) + "\n")
        print("HISTORY_MONTH_OK " + json.dumps({k: record[k] for k in
              ("market", "month", "rows", "missing_minutes", "official_checksum_verified")}), flush=True)
        return record
    except Exception as exc:
        # Explicit failure report; never imply a missing file is a zero-trading month.
        record = {"schema": "mahoraga-history-month-1", "source_url": url,
                  "market": symbol, "month": f"{year:04d}-{month:02d}",
                  "status": "SOURCE_FAILED_OR_INVALID", "error": str(exc),
                  "training_approved": False}
        manifest_file.write_text(json.dumps(record, sort_keys=True, indent=2) + "\n")
        print("HISTORY_MONTH_FAILED " + json.dumps(record), flush=True)
        return record


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--year", type=int, required=True)
    p.add_argument("--months", default="1,2,3,4,5,6,7,8,9,10,11,12")
    p.add_argument("--symbols", default="BTCUSDT,ETHUSDT,SOLUSDT")
    p.add_argument("--out", required=True)
    args = p.parse_args()
    requested = [int(m) for m in args.months.split(",")]
    symbols = args.symbols.split(",")
    if len(requested) != len(set(requested)) or any(m < 1 or m > 12 for m in requested):
        raise ValueError("Bad or duplicate month")
    if len(symbols) != len(set(symbols)) or any(s not in SYMBOLS for s in symbols):
        raise ValueError("Unregistered or duplicate market")
    dates = months(args.year, requested)
    if not dates:
        raise ValueError("No dates in registered five-year scope")
    if not pathlib.Path(args.out).is_absolute():
        raise ValueError("Absolute output path required")
    dest = pathlib.Path(args.out)
    records = [collect(sym, y, m, dest) for sym in symbols for y, m in dates]
    success = sum(r.get("official_checksum_verified", False) for r in records)
    summary = {
        "schema": "mahoraga-five-year-archive-shard-1",
        "research_only": True, "actual_experience_trades": 0,
        "target_window": "2021-11-01_to_2026-10-31",
        "source_venue": "BINANCE_USDM_NOT_HYPERLIQUID",
        "year": args.year, "requested_months": [f"{y:04d}-{m:02d}" for y,m in dates],
        "symbols": symbols, "expected_archive_count": len(records),
        "verified_archive_count": success, "failed_archive_count": len(records)-success,
        "candles": sum(r.get("rows", 0) for r in records),
        "gaps_minutes": sum(r.get("missing_minutes", 0) for r in records),
        "all_months_complete": success == len(records) and all(r.get("complete") for r in records),
        "archives_retained_at": str(dest),
        "validation_only": True, "training_approved": False
    }
    (dest / "shard-summary.json").write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n")
    print("HISTORY_SHARD_SUMMARY " + json.dumps(summary), flush=True)
    return 0 if success == len(records) else 2


if __name__ == "__main__":
    sys.exit(main())
