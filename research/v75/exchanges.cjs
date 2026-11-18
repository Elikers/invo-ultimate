/*
 * INVO v7.5 independent read-only exchange candle adapters.
 * Never sends orders, changes production engines, or labels historical observations as forward trades.
 */
'use strict';
const PERIOD_MS = 5 * 60 * 1000;
const SOURCES = Object.freeze({
  binance: {venue:'Binance USD-M perpetual', endpoint:'https://fapi.binance.com/fapi/v1/klines', symbols:['BTCUSDT','ETHUSDT','SOLUSDT']},
  bybit: {venue:'Bybit linear perpetual', endpoint:'https://api.bybit.com/v5/market/kline', symbols:['BTCUSDT','ETHUSDT','SOLUSDT']}
});
function normalizeRows(source, payload, nowMs = Date.now()) {
  if (!Object.hasOwn(SOURCES, source)) throw new Error('Unsupported venue');
  const rows = source === 'binance' ? payload : payload?.result?.list;
  if (!Array.isArray(rows)) throw new Error('Missing candle rows');
  const byTime = new Map();
  for (const r of rows) {
    if (!Array.isArray(r) || r.length < 6) throw new Error('Invalid candle row');
    const [rawTime,rawOpen,rawHigh,rawLow,rawClose,rawVolume] = r;
    const t = Number(rawTime), open=Number(rawOpen), high=Number(rawHigh), low=Number(rawLow), close=Number(rawClose), volume=Number(rawVolume);
    if (![t,open,high,low,close,volume].every(Number.isFinite) || !Number.isSafeInteger(t) ||
        t%PERIOD_MS!==0 || open<=0 || high<=0 || low<=0 || close<=0 || volume<0 ||
        low>Math.min(open,close) || high<Math.max(open,close) || high<low) throw new Error('Malformed OHLCV candle');
    if (t+PERIOD_MS>nowMs) continue; // never incorporate an incomplete candle
    if (byTime.has(t)) throw new Error('Duplicate candle timestamp');
    byTime.set(t,{t,open,high,low,close,volume});
  }
  const candles=[...byTime.values()].sort((a,b)=>a.t-b.t);
  const gaps=[];
  for(let i=1;i<candles.length;i++){
    const dt=candles[i].t-candles[i-1].t;
    if(dt!==PERIOD_MS) gaps.push({from:candles[i-1].t,to:candles[i].t,missing:dt/PERIOD_MS-1});
  }
  return {candles,gaps,complete:candles.length>0 && gaps.length===0};
}
function urlFor(source,symbol,endMs,limit=200) {
  const s=SOURCES[source];
  if(!s || !s.symbols.includes(symbol)) throw new Error('Unsupported venue or contract');
  if(!Number.isSafeInteger(endMs) || endMs<=0) throw new Error('Invalid end time');
  if(!Number.isInteger(limit)||limit<1||limit>200) throw new Error('Out-of-range page size');
  const u=new URL(s.endpoint);
  if(source==='binance') {
    u.searchParams.set('symbol',symbol);u.searchParams.set('interval','5m');u.searchParams.set('limit',String(limit));
    u.searchParams.set('endTime',String(endMs-1));
  } else {
    u.searchParams.set('category','linear');u.searchParams.set('symbol',symbol);u.searchParams.set('interval','5');
    u.searchParams.set('limit',String(limit));u.searchParams.set('end',String(endMs-1));
  }
  return u.toString();
}
async function fetchSnapshot(source,symbol,{nowMs=Date.now(),limit=200,fetchImpl=globalThis.fetch}={}) {
  const endMs=Math.floor(nowMs/PERIOD_MS)*PERIOD_MS;
  const u=urlFor(source,symbol,endMs,limit);
  const ctrl=new AbortController(), timer=setTimeout(()=>ctrl.abort(),12000);
  try {
    const res=await fetchImpl(u,{signal:ctrl.signal,headers:{accept:'application/json'}});
    if(!res.ok) throw new Error(source+' HTTP '+res.status);
    const body=await res.json();
    if(source==='bybit' && body.retCode!==0) throw new Error('Bybit API returned error '+body.retCode);
    const parsed=normalizeRows(source,body,nowMs);
    if(parsed.candles.length<2 || !parsed.complete) throw new Error('Incomplete or gapped venue series');
    return {schema:'invo-v7.5-external-source-1',kind:'HISTORICAL_READ_ONLY_NOT_FORWARD',
      source,venue:SOURCES[source].venue,symbol,interval:'5m',contract_type:'linear_usdt_perpetual',
      captured_utc:new Date(nowMs).toISOString(),last_candle_utc:new Date(parsed.candles.at(-1).t).toISOString(),
      candles:parsed.candles,gaps:parsed.gaps};
  } finally {clearTimeout(timer);}
}
function compare(a,b) {
  if(a.symbol!==b.symbol || a.interval!==b.interval || a.contract_type!==b.contract_type) throw new Error('Incompatible instruments');
  const map=new Map(b.candles.map(c=>[c.t,c]));
  const aligned=a.candles.filter(c=>map.has(c.t)).map(c=>{
    const other=map.get(c.t);
    return {t:c.t,close_diff_bps:10000*(c.close/other.close-1)};
  });
  return {symbol:a.symbol,overlap:aligned.length,
    max_abs_close_diff_bps:aligned.length?Math.max(...aligned.map(x=>Math.abs(x.close_diff_bps))):null,
    warning:'Cross-venue observations are correlated, not independent trials; this is NOT a performance backtest.'};
}
module.exports={PERIOD_MS,SOURCES,normalizeRows,urlFor,fetchSnapshot,compare};
if(require.main===module){
  (async()=>{
    const source=process.argv[2], symbol=process.argv[3];
    if(!SOURCES[source]||!SOURCES[source].symbols.includes(symbol)) throw new Error('Usage: node research/v75/exchanges.cjs binance|bybit BTCUSDT|ETHUSDT|SOLUSDT');
    const result=await fetchSnapshot(source,symbol);
    const {candles,...metadata}=result;
    console.log(JSON.stringify({...metadata,count:candles.length,first_candle_utc:new Date(candles[0].t).toISOString()},null,2));
  })().catch(e=>{console.error('External feed unavailable/invalid:',e.message);process.exitCode=1;});
}
