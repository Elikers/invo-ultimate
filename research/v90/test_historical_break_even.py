import unittest
from historical_break_even import study
class Tests(unittest.TestCase):
 def sample(self):
  a=[]
  for m in ("BTCUSDT","ETHUSDT","SOLUSDT"):
   for e in ("fusion","sweep","auction","pullback","volbreak","mean","strict"):
    for cost in (8,16):
     a.append({"market":m,"engine":e,"cost_bps":cost,"last_fold_trades":23,
      "weighted_monthly_last_fold_mean_pct":-.1-(cost-8)/100})
  return {"schema":"invo-v7.6-six-month-retrospective-summary-1","research_only":True,"market_engine_summary":a}
 def test_all_negative_gross(self):
  x=study(self.sample());self.assertEqual(x["count"],21)
  self.assertEqual(x["negative_even_at_zero_cost"],21)
  self.assertEqual(x["positive_net_at_8bps"],0)
 def test_positive_gross_below_cost(self):
  a=self.sample()
  for row in a['market_engine_summary'][:2]:row["weighted_monthly_last_fold_mean_pct"]=-.02-(row["cost_bps"]-8)/100
  x=study(a);self.assertEqual(x["positive_gross_but_below_8bps"],1)
 def test_inconsistent_stress(self):
  a=self.sample();a["market_engine_summary"][1]["weighted_monthly_last_fold_mean_pct"]=100
  with self.assertRaisesRegex(ValueError,"consistency"):study(a)
if __name__=="__main__":unittest.main()
