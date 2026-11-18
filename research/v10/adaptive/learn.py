#!/usr/bin/env python3
"""MAHORAGA v10.1 research-only: causal filtering of a frozen replay baseline.

Fits empirical trade expectancy by (side, UTC hour) on TRAIN only, selecting
one of preregistered thresholds using forward developmental folds. Each
evaluation is an entire replay with filtered signals, not a cherry-picked
subset of baseline trades. Past 2025-11 data has already been examined and
is NOT a pristine holdout. Never authorizes trading.
"""
import argparse, csv, gzip, hashlib, json, pathlib, statistics, sys
from collections import defaultdict
from datetime import datetime, timezone
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent.parent/"experience"))
import engine as E

CANDIDATE_THRESHOLDS=(-0.001,-0.0005,0.0,0.00025)
SHRINK=40
MIN_OBSERVATIONS=80

def group(side, decision_ms):
    return side, datetime.fromtimestamp(decision_ms/1000,timezone.utc).hour

def fit(records, cutoff_ms):
    groups=defaultdict(list)
    for r in records:
        if r["exit_time_ms"]>=cutoff_ms: continue
        if r["entry_time_ms"]>=cutoff_ms: raise ValueError("future training entry")
        groups[group(r["side"],r["decision_time_ms"])].append(r["net_return"])
    global_returns=[r for values in groups.values() for r in values]
    global_mean=statistics.mean(global_returns) if global_returns else -1.0
    scores={}
    for k,values in groups.items():
        n=len(values)
        scores[k]=(sum(values)+SHRINK*global_mean)/(n+SHRINK) if n>=MIN_OBSERVATIONS else None
    return scores,{"trades_matured":len(global_returns),"groups":sum(x is not None for x in scores.values()),
                   "global_mean":global_mean,"cutoff_ms":cutoff_ms}

def predict(scores,threshold):
    if threshold not in CANDIDATE_THRESHOLDS:raise ValueError("unregistered threshold")
    def accept(side,decision_ms):
        val=scores.get(group(side,decision_ms))
        return val is not None and val>=threshold
    return accept

def run_split(bars, symbol, scores, threshold, lo, hi, **kwargs):
    # Restrict samples to one split; new data never feeds back into trained scores.
    scope=(x for x in bars if lo<=x[0]<hi)
    res=E.replay(scope,symbol,signal_filter=predict(scores,threshold),**kwargs)
    ledger=res["ledger"]
    return {"trades":len(ledger),"metrics":E.summarize(ledger)[E.split_of(lo)],
            "ledger":ledger}

def select_threshold(baseline_train, bars, symbol, **kwargs):
    # TWO forward folds wholly inside TRAIN (never VALIDATION or previously inspected TEST).
    folds=[(1704067200000,1719792000000),  # Jan–Jun 2024
           (1719792000000,E.TRAIN_END)]   # Jul–Nov 2024
    trials=[]
    for threshold in CANDIDATE_THRESHOLDS:
        fold_reports=[]
        for lo,hi in folds:
            scores,diag=fit(baseline_train,lo)
            res=run_split(bars,symbol,scores,threshold,lo,hi,**kwargs)
            metric=res["metrics"]
            fold_reports.append({"start_ms":lo,"end_ms":hi,"training":diag,
               "trades":res["trades"],"profit_factor":metric["profit_factor"],
               "mean_net_return":metric["mean_net_return"]})
        # No multiple testing on final test; reject positive-mean claims if either fold fails.
        valid=all(f["trades"]>=30 and f["mean_net_return"] is not None for f in fold_reports)
        score=min(f["mean_net_return"] for f in fold_reports) if valid else float("-inf")
        trials.append({"threshold":threshold,"score":score,"folds":fold_reports})
    ranked=sorted(trials,key=lambda x:(x["score"],-abs(x["threshold"])),reverse=True)
    best=ranked[0]
    return best["threshold"],trials

def research(bars,symbol,**kwargs):
    if len(bars)!=(E.END-E.START)//E.ONE_MIN or bars[0][0]!=E.START or bars[-1][0]!=E.END-E.ONE_MIN:
        raise ValueError("five year verified chronological input required")
    # Baseline replicated without tuning. Existing published test numbers can be compared.
    base=E.replay(iter(bars),symbol,**kwargs)
    train=[r for r in base["ledger"] if r["split"]=="train"]
    chosen,folds=select_threshold(train,bars,symbol,**kwargs)
    model,diag=fit(train,E.TRAIN_END)
    dev=run_split(bars,symbol,model,chosen,E.TRAIN_END,E.VALID_END,**kwargs)
    test=run_split(bars,symbol,model,chosen,E.VALID_END,E.END,**kwargs)
    result={"schema":"mahoraga-adaptive-filter-v1","symbol":symbol,
       "strategy":"60m momentum baseline + TRAIN-only shrunk side/hour NO-TRADE filter",
       "selection":"two chronological TRAIN-only walk-forward folds",
       "thresholds_pre_registered":CANDIDATE_THRESHOLDS,"selected_threshold":chosen,
       "training":diag,"development_folds":folds,
       "validation":{k:v for k,v in dev.items() if k!="ledger"},
       "previously_exposed_test":{k:v for k,v in test.items() if k!="ledger"},
       "baseline_test":E.summarize(base["ledger"])["test"],
       "test_status":"PREVIOUSLY_EXAMINED_RETROSPECTIVE_NOT_INDEPENDENT_FORWARD",
       "cost_warning":"Default engine zero-funding proxy understates trading costs; no market depth model",
       "model_promotable":False,"live_orders":False,"production_strategy_modified":False}
    return result,dev["ledger"],test["ledger"]

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--symbol",required=True,choices=sorted(E.SYMBOLS))
    p.add_argument("--csv",required=True,type=pathlib.Path)
    p.add_argument("--out",required=True,type=pathlib.Path)
    p.add_argument("--fee-bps",type=float,default=4.0)
    p.add_argument("--slippage-bps",type=float,default=2.0)
    x=p.parse_args()
    bars=list(E.read_bars(x.csv,x.symbol))
    result,validation,test=research(bars,x.symbol,fee_bps=x.fee_bps,slippage_bps=x.slippage_bps)
    x.out.mkdir(parents=True,exist_ok=True)
    (x.out/"model-report.json").write_text(json.dumps(result,indent=2,allow_nan=False)+"\n")
    for name,items in (("validation-ledger.jsonl",validation),("test-ledger.jsonl",test)):
        (x.out/name).write_text("".join(json.dumps(z,sort_keys=True)+"\n" for z in items))
    print(json.dumps({"symbol":x.symbol,"candidate_threshold":result["selected_threshold"],
        "validation":result["validation"],"previously_exposed_test":result["previously_exposed_test"],
        "baseline_test":result["baseline_test"],"model_promotable":False},allow_nan=False))
if __name__=="__main__":main()
