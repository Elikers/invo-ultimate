import unittest
from stress_summary import reprice
class Tests(unittest.TestCase):
 def sample(self):
  a=[]
  for m in ('BTCUSDT','ETHUSDT','SOLUSDT'):
   for e in ('fusion','sweep','auction','pullback','volbreak','mean','strict'):
    a.extend([{"market":m,"engine":e,"cost_bps":b,"last_fold_trades":60,
     "weighted_monthly_last_fold_mean_pct":-0.02-(b-8)/100} for b in (8,16)])
  return {"schema":"invo-v7.6-six-month-retrospective-summary-1","research_only":True,"market_engine_summary":a}
 def test_counts(self):
  x=reprice(self.sample());self.assertEqual(x["pairs"],21)
  self.assertEqual(x["positive_weighted_means_by_cost_bps"]["8"],0)
  self.assertAlmostEqual(x["results"][0]["expected_net_pct_by_total_assumed_cost_bps"]["40"],-.34)
 def test_mismatched_origins(self):
  d=self.sample();d["market_engine_summary"][1]["weighted_monthly_last_fold_mean_pct"]=2
  with self.assertRaisesRegex(ValueError,"inconsistent"):reprice(d)
 def test_duplicate(self):
  d=self.sample();d["market_engine_summary"][1]=d["market_engine_summary"][0]
  with self.assertRaisesRegex(ValueError,"duplicate"):reprice(d)
if __name__=="__main__":unittest.main()
