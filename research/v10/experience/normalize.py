#!/usr/bin/env python3
"""Rebuild normalized per-symbol chronological 1m streams from preserved release bundles.
Use after extracting six mahoraga-1m-* release bundles under a common root.
No imputation and no use of future candles. File-backed streaming, checksum validation.
"""
import argparse, csv, gzip, hashlib, heapq, io, json, pathlib, zipfile
from contextlib import ExitStack
from engine import START, END, ONE_MIN, SYMBOLS

def sha_file(p):
    h=hashlib.sha256()
    with p.open("rb") as f:
        for b in iter(lambda:f.read(1024*1024),b""):h.update(b)
    return h.hexdigest()

def files(root):
    found=[]
    for folder in [*(f"year-{i}" for i in range(1,6)),"sol-daily-repair/feb","sol-daily-repair/apr"]:
        base=root/folder
        manifest=json.loads((base/"coverage-manifest.json").read_text())
        for item in manifest["entries"]:
            if item["status"]!="CHECKSUM_VERIFIED":raise ValueError("unverified archive")
            p=base/"1m"/item["symbol"]/item["source_url"].rsplit("/",1)[-1]
            if not p.is_file() or sha_file(p)!=item["zip_sha256"]:raise ValueError("archive hash mismatch: "+str(p))
            found.append((item["symbol"],int(item["coverage"]["first_open_ms"]),p,item["coverage"]["rows"]))
    if len(found)!=620:raise ValueError(f"expected 620 verified files, found {len(found)}")
    return found

def rows(p):
    with zipfile.ZipFile(p) as archive:
        members=[x for x in archive.infolist() if not x.is_dir()]
        if len(members)!=1 or not members[0].filename.endswith(".csv"):
            raise ValueError("unsafe publisher ZIP layout: "+str(p))
        with archive.open(members[0]) as handle:
            reader=csv.reader(io.TextIOWrapper(handle,encoding="utf8",newline=""))
            for v in reader:
                if not v or v[0].strip().lower()=="open_time":continue
                if len(v)<6:raise ValueError("malformed candle")
                t=int(v[0])
                if t>10**15:t//=1000
                yield [str(t),*v[1:6]]

def normalize(root,out):
    archives=files(root)
    out.mkdir(parents=True,exist_ok=True)
    summary={}
    for symbol in sorted(SYMBOLS):
        parts=sorted((x for x in archives if x[0]==symbol),key=lambda x:x[1])
        total=0;previous=None
        target=out/(symbol+"-1m.csv.gz")
        with gzip.open(target,"wt",encoding="utf8",newline="") as f:
            writer=csv.writer(f)
            writer.writerow(("open_time_ms","open","high","low","close","base_volume"))
            for _,first,archive,expected_rows in parts:
                observed=0
                for values in rows(archive):
                    t=int(values[0])
                    if total==0 and t!=START:raise ValueError("missing first timestamp: "+symbol)
                    if previous is not None and t!=previous+ONE_MIN:
                        raise ValueError("gap/overlap in "+symbol+" at "+str(t))
                    previous=t;total+=1;observed+=1
                    writer.writerow(values)
                if observed!=expected_rows:raise ValueError("manifest row mismatch: "+str(archive))
        if total!=(END-START)//ONE_MIN or previous!=END-ONE_MIN:
            raise ValueError("wrong total five-year coverage: "+symbol)
        summary[symbol]={"rows":total,"sha256":sha_file(target),"path":str(target)}
    (out/"normalized-provenance.json").write_text(json.dumps(
        {"schema":"mahoraga-normalized-v1","historical_only":True,
         "provenance":"checksum-verified Binance USD-M original monthly/daily 1m ZIPs",
         "source_archive_count":len(archives),"symbols":summary},indent=2)+"\n")
    return summary

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--extracted-release-root",required=True,type=pathlib.Path)
    p.add_argument("--out",required=True,type=pathlib.Path)
    x=p.parse_args()
    if x.out.resolve()==x.extracted_release_root.resolve():p.error("output must be separate")
    print(json.dumps(normalize(x.extracted_release_root,x.out),indent=2))
