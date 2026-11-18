#!/usr/bin/env python3
"""MAHORAGA v10.2 research ONLY. Fixed strategy registry, chronological train-only selection.
1-minute source compressed to strictly continuous completed 1h bars; fills next hour open.
Binance funding settlement is approximated from verified signed rates; no orders or promotion.
"""
import argparse,bisect,json,math,pathlib,statistics,sys
from collections import deque
HERE=pathlib.Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'experience'))
sys.path.insert(0,str(HERE.parent/'adaptive'))
import engine as E
import funding_economics as FE
HOUR=3600000
FUNDING_END=FE.COVERAGE_END_MS
REGISTRY=('trend_12_48','breakout_24','revert_24','trend_vol','flat_control')
FOLDS=((1672531200000,1688169600000),(1688169600000,1704067200000),
       (1704067200000,1719792000000),(1719792000000,E.TRAIN_END))
VALID=(E.TRAIN_END,E.VALID_END)
EXPOSED=(E.VALID_END,FUNDING_END)
FEE_BPS=4
SLIPPAGE_BPS=2
STOP=.015
TAKE=.025
HOLD_HOURS=8

def aggregate(source):
    chunk=[];prev=None
    for bar in source:
        t=bar[0]
        if prev is not None and t!=prev+E.ONE_MIN:raise ValueError('missing or repeated minute')
        prev=t
        if chunk and t//HOUR!=chunk[0][0]//HOUR:
            if len(chunk)!=60 or chunk[0][0]%HOUR:raise ValueError('incomplete hourly bar')
            yield (chunk[0][0],chunk[0][1],max(z[2] for z in chunk),
                   min(z[3] for z in chunk),chunk[-1][4],sum(z[5] for z in chunk))
            chunk=[]
        chunk.append(bar)
    if chunk:
        if len(chunk)!=60 or chunk[0][0]%HOUR:raise ValueError('incomplete last hour')
        yield (chunk[0][0],chunk[0][1],max(z[2] for z in chunk),
               min(z[3] for z in chunk),chunk[-1][4],sum(z[5] for z in chunk))

def decision(window,name):
    if name not in REGISTRY:raise ValueError('unregistered strategy')
    if name=='flat_control' or len(window)<49:return 'FLAT'
    past=window[-49:];price=past[-1][4]
    fast=sum(x[4] for x in past[-12:])/12
    slow=sum(x[4] for x in past[-48:])/48
    if name in ('trend_12_48','trend_vol'):
        if name=='trend_vol':
            scope=past[-24:]
            if (max(x[2] for x in scope)-min(x[3] for x in scope))/price>0.07:return 'FLAT'
        trend=fast/slow-1
        return 'LONG' if trend>0.003 else ('SHORT' if trend< -0.003 else 'FLAT')
    if name=='breakout_24':
        prior=past[-25:-1]
        if price>max(x[2] for x in prior)*1.001:return 'LONG'
        if price<min(x[3] for x in prior)*.999:return 'SHORT'
        return 'FLAT'
    if name=='revert_24':
        close=[x[4] for x in past[-24:]]
        sigma=statistics.pstdev(close)
        if sigma<=0:return 'FLAT'
        z=(price-statistics.mean(close))/sigma
        return 'LONG' if z < -1.75 else ('SHORT' if z>1.75 else 'FLAT')
    raise AssertionError('unknown registry')

def signed_funding(start,end,side,events,times):
    # Strictly between timestamps to avoid assuming exact same-hour settlement/fill ordering.
    i=bisect.bisect_right(times,start);j=bisect.bisect_left(times,end)
    return (1 if side=='LONG' else -1)*sum(rate for _,rate in events[i:j])

def simulate(bars,name,lo,hi,events=(),extra_slippage_bps=0):
    if name not in REGISTRY:raise ValueError('unregistered')
    if not E.START<=lo<hi<=FUNDING_END:raise ValueError('unverified funding range')
    if not math.isfinite(extra_slippage_bps) or extra_slippage_bps<0:raise ValueError('invalid cost')
    events=sorted(events);times=[a for a,b in events]
    history=deque(maxlen=49);open_pos=None;pending=None;trades=[];prev=None;count=0
    for t,o,h,l,c,v in bars:
        if not lo<=t<hi:continue
        if prev is not None and t!=prev+HOUR:raise ValueError('missing hour')
        prev=t;count+=1
        if pending:
            open_pos={'side':pending[0],'decision_ms':pending[1],
                      'entry_ms':t,'entry':o,'age':0}
            pending=None
        if open_pos:
            pos=open_pos;pos['age']+=1
            direction=1 if pos['side']=='LONG' else -1
            stop=pos['entry']*(1-direction*STOP)
            take=pos['entry']*(1+direction*TAKE)
            stop_hit=(l<=stop if direction==1 else h>=stop)
            take_hit=(h>=take if direction==1 else l<=take)
            if stop_hit:price=min(o,stop) if direction==1 else max(o,stop);reason='STOP_FIRST_OR_GAP'
            elif take_hit:price=take;reason='TAKE'
            elif pos['age']>=HOLD_HOURS:price=c;reason='TIME'
            else:price=None
            if price is not None:
                gross=direction*(price/pos['entry']-1)
                cost=2*(FEE_BPS+SLIPPAGE_BPS+extra_slippage_bps)/10000
                funding=signed_funding(pos['entry_ms'],t+HOUR,pos['side'],events,times)
                trades.append({'entry_ms':pos['entry_ms'],'decision_ms':pos['decision_ms'],
                  'exit_ms':t+HOUR,'side':pos['side'],'gross':gross,
                  'execution_cost':cost,'funding_cost':funding,
                  'net':gross-cost-funding,'reason':reason})
                open_pos=None
        history.append((t,o,h,l,c,v))
        if open_pos is None and pending is None and len(history)==49:
            side=decision(list(history),name)
            if side!='FLAT':pending=(side,t+HOUR)
    return {'trades':trades,'hours':count,'discarded_open':bool(open_pos or pending)}

def metrics(trades):
    vals=[x['net'] for x in trades]
    win=sum(z for z in vals if z>0);loss=-sum(z for z in vals if z<0)
    return {'trades':len(vals),'mean_net':sum(vals)/len(vals) if vals else None,
      'profit_factor':win/loss if loss>0 else None,
      'win_rate':sum(z>0 for z in vals)/len(vals) if vals else None,
      'sum_trade_returns_not_portfolio_pnl':sum(vals)}

def select(bars,events):
    dev={}
    for family in REGISTRY:
        dev[family]=[{'from_ms':lo,'to_ms':hi,
          **metrics(simulate(bars,family,lo,hi,events)['trades'])} for lo,hi in FOLDS]
    eligible=[]
    for family,folds in dev.items():
        if all(x['trades']>=30 and x['mean_net'] is not None
               and x['mean_net']>0 and x['profit_factor'] is not None
               and x['profit_factor']>1.05 for x in folds):
            eligible.append((min(x['mean_net'] for x in folds),family))
    return max(eligible)[1] if eligible else None,dev

def evaluate(bars,symbol,events):
    if symbol not in E.SYMBOLS:raise ValueError('bad symbol')
    if len(bars)!=(E.END-E.START)//HOUR or bars[0][0]!=E.START or bars[-1][0]!=E.END-HOUR:
        raise ValueError('complete five-year hourly input required')
    selected,development=select(bars,events)
    validation={family:metrics(simulate(bars,family,*VALID,events)['trades']) for family in REGISTRY}
    exposed=None
    if selected:
        exposed={'selected':selected,
            'existing_examined_test':metrics(simulate(bars,selected,*EXPOSED,events)['trades']),
            'extra_10bps_slippage_each_side':metrics(simulate(bars,selected,*EXPOSED,events,10)['trades'])}
    return {'schema':'mahoraga-v102-frozen-family-comparison-v1','symbol':symbol,
      'registered_families':REGISTRY,'development_folds':development,
      'selected_training_only':selected,'validation_diagnostic':validation,
      'previously_exposed_test':exposed,
      'training_rule':'all 4 earlier folds must each have >=30 trades, mean_net >0 and PF >1.05',
      'real_funding_source':'verified Binance monthly settlements until 2026-10-31',
      'execution_limits':'hourly stop-first, modeled slippage and fees, approximate settlement timing',
      'forward_evidence':0,'test_is_not_blind':True,'auto_promotion':False,
      'approved_for_live':False,'production_changed':False}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--symbol',required=True,choices=sorted(E.SYMBOLS))
    ap.add_argument('--csv',required=True,type=pathlib.Path)
    ap.add_argument('--funding-root',required=True,type=pathlib.Path)
    ap.add_argument('--out',required=True,type=pathlib.Path)
    x=ap.parse_args()
    bars=list(aggregate(E.read_bars(x.csv,x.symbol)))
    rates=FE.load(x.funding_root,x.symbol)
    result=evaluate(bars,x.symbol,rates)
    x.out.parent.mkdir(parents=True,exist_ok=True)
    x.out.write_text(json.dumps(result,indent=2,allow_nan=False)+'\n')
    print(json.dumps({'symbol':x.symbol,'selected':result['selected_training_only'],
      'validation':result['validation_diagnostic'],'exposed':result['previously_exposed_test'],
      'approved_for_live':False},allow_nan=False))
if __name__=='__main__':main()
