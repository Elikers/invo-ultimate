#!/usr/bin/env python3
"""MAHORAGA v10 historical experience research ONLY. No execution or live integration.
Input: chronological normalized Binance 1m CSV/CSV.GZ with open_time_ms,open,high,low,close,base_volume.
Signal: causally computed at closed bar i; fill at next bar open. One position at a time.
"""
import argparse, csv, gzip, hashlib, json, math, pathlib, statistics
from datetime import datetime, timezone

SYMBOLS = {"BTCUSDT", "ETHUSDT", "SOLUSDT"}
START = 1637193600000  # 2021-11-18 UTC
END = 1794960000000    # 2026-11-18 UTC exclusive
TRAIN_END = 1731888000000 # 2024-11-18
VALID_END = 1763424000000 # 2025-11-18
ONE_MIN = 60000

def split_of(t):
    if not START <= t < END: raise ValueError("out of five year dataset scope")
    return "train" if t < TRAIN_END else ("validation" if t < VALID_END else "test")

def read_bars(file, expected_symbol):
    if expected_symbol not in SYMBOLS: raise ValueError("unknown symbol")
    opener = gzip.open if str(file).endswith(".gz") else open
    prev = None
    with opener(file, "rt", encoding="utf-8", newline="") as handle:
        rd = csv.DictReader(handle)
        if not {"open_time_ms", "open", "high", "low", "close", "base_volume"} <= set(rd.fieldnames or []):
            raise ValueError("missing normalized OHLCV columns")
        for row in rd:
            t = int(row["open_time_ms"])
            if prev is not None and t != prev + ONE_MIN:
                raise ValueError("missing, duplicated or disordered minute at " + str(t))
            o,h,l,c,v = (float(row[k]) for k in ("open","high","low","close","base_volume"))
            if not all(math.isfinite(x) for x in (o,h,l,c,v)) or min(o,h,l,c)<=0 or v<0 or h<max(o,c) or l>min(o,c):
                raise ValueError("invalid OHLCV")
            if t % ONE_MIN: raise ValueError("unaligned timestamp")
            if not START <= t < END: raise ValueError("timestamp out of five-year scope")
            prev=t
            yield (t,o,h,l,c,v)

def strategy(window):
    """Frozen illustrative MOMENTUM BASELINE, not an existing MAHORAGA live strategy."""
    if len(window)<61: return "FLAT"
    last=window[-1][4]
    older=window[-61][4]
    change=last/older-1
    return "LONG" if change>0.003 else ("SHORT" if change < -0.003 else "FLAT")

def replay(rows, symbol, fee_bps=4.0, slippage_bps=2.0, funding_bps_8h=0.0, max_hold=60,
           stop_pct=0.008, take_pct=0.012, min_history=61):
    """Return append-only conceptual experience ledger. Costs per side, funding a disclosed proxy.
    Decisions use completed bars; intrabar SL/TP is conservatively resolved stop-first.
    Split transition flattens position; no trade crosses data split boundaries.
    """
    for x in (fee_bps,slippage_bps,funding_bps_8h,stop_pct,take_pct):
        if not math.isfinite(x) or x < 0: raise ValueError("negative or nonfinite cost/risk")
    if max_hold<1 or min_history<61: raise ValueError("invalid horizon/lookback")
    from collections import deque
    history=deque(maxlen=max(min_history,61))
    pending=None;active=None;ledger=[];previous=None;observations=0
    def close(pos,bar,price,reason):
        side=1 if pos["side"]=="LONG" else -1
        gross=side*(price/pos["entry_price"]-1)
        # Charge entry/exit taker fees + adverse fill slippage; funding proxy as absolute carrying cost.
        friction=(2*(fee_bps+slippage_bps))/10000
        carry=abs(funding_bps_8h)*(pos["minutes_held"]/480)/10000
        net=gross-friction-carry
        entry_t=pos["entry_time"];exit_t=bar[0]
        ledger.append({"symbol":symbol,"split":pos["split"],"side":pos["side"],
            "decision_time_ms":pos["decision_time"],"entry_time_ms":entry_t,"exit_time_ms":exit_t,
            "entry_price":pos["entry_price"],"exit_price":price,"minutes_held":pos["minutes_held"],
            "gross_return":round(gross,10),"cost_return":round(friction+carry,10),
            "net_return":round(net,10),"outcome":"WIN" if net>0 else "LOSS",
            "exit_reason":reason,"causality":"closed_bar_signal_next_open_fill",
            "source":"BINANCE_HISTORICAL_SIMULATED_NOT_LIVE"})
    for bar in rows:
        t,o,h,l,c,v=bar
        current_split=split_of(t)
        if previous is not None and t!=previous+ONE_MIN: raise ValueError("noncontiguous replay stream")
        previous=t;observations+=1
        if active is not None and active["split"] != current_split:
            raise ValueError("position crossed split boundary: add explicit flattening data")
        if pending is not None:
            if pending["split"]==current_split and active is None:
                active={"side":pending["side"],"entry_price":o,"entry_time":t,
                    "decision_time":pending["decision_time"],"split":current_split,"minutes_held":0}
            pending=None
        if active:
            active["minutes_held"]+=1
            side=1 if active["side"]=="LONG" else -1
            entry=active["entry_price"]
            stop=entry*(1-side*stop_pct);take=entry*(1+side*take_pct)
            stop_hit=(l<=stop if side==1 else h>=stop)
            take_hit=(h>=take if side==1 else l<=take)
            # No price improvement beyond stop on gaps; conservative stop-first if both touched.
            if stop_hit:
                close(active,bar,(min(o,stop) if side==1 else max(o,stop)),"STOP_OR_GAP");active=None
            elif take_hit:
                close(active,bar,take,"TAKE");active=None
            elif active["minutes_held"]>=max_hold:
                close(active,bar,c,"TIME");active=None
        history.append(bar)
        if len(history)>=min_history and active is None and pending is None:
            # Do not borrow lookback from another split.
            if split_of(history[0][0]) == current_split:
                side=strategy(list(history))
                if side!="FLAT": pending={"side":side,"decision_time":t+ONE_MIN,"split":current_split}
    # Incomplete final position not passed off as a realized trade.
    return {"schema":"mahoraga-historical-experience-v1","symbol":symbol,
        "source_observations":observations,"ledger":ledger,
        "open_position_discarded":active is not None or pending is not None,
        "assumptions":{"fee_bps_per_side":fee_bps,"slippage_bps_per_side":slippage_bps,
          "funding_bps_per_8h_absolute_proxy":funding_bps_8h,"stop_pct":stop_pct,
          "take_pct":take_pct,"max_hold_minutes":max_hold},
        "training_data_only":True,"live_orders":False,"profitability_verified":False}

def summarize(trades):
    out={}
    for split in ("train","validation","test"):
        records=[r for r in trades if r["split"]==split]
        returns=[r["net_return"] for r in records]
        positives=sum(r for r in returns if r>0)
        negatives=-sum(r for r in returns if r<0)
        equity=1.0;peak=1.0;max_dd=0.0
        for r in returns:
            equity*=max(0,1+r);peak=max(peak,equity);max_dd=max(max_dd,1-equity/peak)
        out[split]={"trades":len(records),"win_rate":sum(r>0 for r in returns)/len(returns) if returns else None,
            "compounded_net_return":equity-1 if returns else None,
            "profit_factor":positives/negatives if negatives>0 else None,
            "max_drawdown":max_dd if records else None,
            "mean_net_return":statistics.mean(returns) if returns else None}
    return out

def gate(summary, coverage_verified=False, future_verified=False):
    # A retrospectively simulated strategy NEVER automatically promotes into trading.
    test=summary["test"]
    return {"approved_for_live":False,"requires_human_approval":True,
        "retrospective_only":True,"coverage_verified":bool(coverage_verified),
        "forward_verified":bool(future_verified),
        "test_positive":test["compounded_net_return"] is not None and test["compounded_net_return"]>0,
        "reason":"HISTORICAL_RESULTS_CANNOT_AUTHORIZE_LIVE_STRATEGY"}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--symbol",required=True,choices=sorted(SYMBOLS))
    p.add_argument("--csv",required=True,type=pathlib.Path)
    p.add_argument("--out",required=True,type=pathlib.Path)
    p.add_argument("--fee-bps",type=float,default=4)
    p.add_argument("--slippage-bps",type=float,default=2)
    p.add_argument("--funding-bps-8h",type=float,default=0)
    p.add_argument("--require-full-coverage",action="store_true")
    a=p.parse_args()
    if a.csv.resolve()==a.out.resolve(): p.error("input and output must differ")
    source_hash=hashlib.sha256()
    with a.csv.open("rb") as handle:
        for block in iter(lambda:handle.read(1048576),b""): source_hash.update(block)
    rows=list(read_bars(a.csv,a.symbol))
    full=len(rows)==(END-START)//ONE_MIN and rows[0][0]==START and rows[-1][0]==END-ONE_MIN if rows else False
    if a.require_full_coverage and not full: p.error("full five-year coverage required")
    result=replay(rows,a.symbol,a.fee_bps,a.slippage_bps,a.funding_bps_8h)
    report={"schema":"mahoraga-experience-report-v1","symbol":a.symbol,
        "input_sha256":source_hash.hexdigest(),"start_ms":rows[0][0] if rows else None,
        "end_ms":rows[-1][0] if rows else None,"complete_five_years":full,
        "trades":len(result["ledger"]),"metrics":summarize(result["ledger"]),
        "release_gate":gate(summarize(result["ledger"]),full),
        "caveats":["illustrative fixed momentum baseline only","Binance not Hyperliquid",
          "funding is a fixed absolute proxy, not real settlement history",
          "OHLCV does not reproduce order book fills","no profitability claims without unseen forward evidence"]}
    a.out.mkdir(parents=True,exist_ok=True)
    (a.out/"experience.jsonl").write_text("".join(json.dumps(r,sort_keys=True)+"\n" for r in result["ledger"]))
    (a.out/"report.json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps({k:v for k,v in report.items() if k!="metrics"}))
if __name__=="__main__":main()
