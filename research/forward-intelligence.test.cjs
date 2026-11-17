const assert=require('node:assert/strict'),F=require('./forward-intelligence.cjs');
const p=F.wilson(0,0);assert.equal(p,null);
const a=F.wilson(5,10);assert.ok(a.lower<.5&&a.upper>.5);
assert.throws(()=>F.wilson(12,4));
const j={schema:'invo-v6.3-forward-1',started_utc:'2026-11-17T00:00:00Z',updated_utc:'2026-11-18T00:00:00Z',markets:{
 BTC:{observations:[{id:'BTC|sweep|1',strategy:'sweep',status:'CLOSED',net_pct:{'8':.12,'16':.04}},
 {id:'BTC|sweep|2',strategy:'sweep',status:'CLOSED',net_pct:{'8':-.3,'16':-.38}},
 {id:'BTC|fusion|3',strategy:'fusion',status:'PENDING'}]}}};
const h={schema:'invo-v6.2-research-1',created_utc:'2026-11-17T00:00:00Z',markets:{BTC:{status:'ANALYZED',results:[
 {strategy:'sweep',cost_bps_round_trip:8,folds:[{},{},{count:40,expectancyPct:.02}]},
 {strategy:'sweep',cost_bps_round_trip:16,folds:[{},{},{count:40,expectancyPct:-.06}]}
]}}};
const x=F.build(j,h);assert.equal(x.aggregate.closed,2);assert.equal(x.aggregate.pending,1);
assert.equal(x.overall_assessment,'FORWARD_SAMPLE_INSUFFICIENT');
const s=x.markets.BTC.groups.sweep.costs['8'];assert.equal(s.forward.count,2);
assert.equal(s.forward.net_expectancy_pct,-.09);
assert.ok(Math.abs(s.difference_pct+.11)<1e-9);
assert.equal(s.assessment,'INSUFFICIENT_FORWARD_GROUP_SAMPLE');
assert.equal(x.markets.JUP.status,'NOT_INITIALIZED');
assert.throws(()=>F.build({...j,markets:{BTC:{observations:[j.markets.BTC.observations[0],j.markets.BTC.observations[0]]}}},h),/Duplicate/);
assert.throws(()=>F.build(j,{}),/Unrecognized historical/);
assert.throws(()=>F.summarize([{status:'CLOSED',net_pct:{'8':.2}}],16),/Missing verified/);

const metrics=F.descriptiveReturns([1,-2,3]);
assert.equal(metrics.sum_net_pct,2);
assert.equal(metrics.median_net_pct,1);
assert.equal(metrics.worst_net_pct,-2);
assert.ok(metrics.sample_max_drawdown_pct>0);
assert.equal(F.descriptiveReturns([]).sample_equity_compounded_pct,null);
assert.equal(x.pooled_paper_cost_scenarios['8'].count,2);
assert.equal(x.pooled_paper_cost_scenarios['16'].count,2);
assert.ok(x.warnings.some(z=>z.includes('simultaneous')));
console.log('INVO v6.9 Phase 2 descriptive net profitability and cost-sensitivity tests passed');
