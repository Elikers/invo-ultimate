import unittest,tempfile,json,pathlib
from datetime import datetime,timezone
from forward_gate import analyze
NOW=datetime(2026,11,18,2,0,tzinfo=timezone.utc)
class GateTest(unittest.TestCase):
 def snapshot(self,closed=19):
  d=tempfile.TemporaryDirectory(); root=pathlib.Path(d.name)/"research";root.mkdir()
  forward={"schema":"invo-v6.8-forward-intelligence-1","forward_updated_utc":"2026-11-18T00:30:05Z","aggregate":{"closed":closed},"required_samples":{"min_closed_total":100}}
  reg={"schema":"invo-v7.3-prospective-registration-1","registered_utc":"2026-11-17T23:57:00Z","minimums":{"closed_overall":100,"closed_per_market_strategy_candidate":30}}
  shadow={"schema":"invo-v7.3-candidate-paper-summary-1","registered_utc":"2026-11-17T23:57:00Z","updated_utc":"2026-11-18T00:30:06Z","by_candidate":{x:{"closed":0} for x in ("BASELINE_FROZEN","CANDIDATE_SHORTER_TIME_EXIT","CANDIDATE_TIGHTER_STOP")}}
  for name,obj in (("forward-intelligence.json",forward),("v7-registration.json",reg),("v7-paper-summary.json",shadow)):
   (root/name).write_text(json.dumps(obj))
  return d
 def test_insufficient(self):
  with self.snapshot() as d:
   r=analyze(d,NOW)
   self.assertEqual(r["status"],"INSUFFICIENT_FORWARD_SAMPLE")
   self.assertFalse(r["production_approval"])
 def test_threshold_not_approval(self):
  with self.snapshot(130) as d:
   r=analyze(d,NOW)
   self.assertEqual(r["status"],"MANUAL_EVIDENCE_REVIEW_REQUIRED")
   self.assertFalse(r["production_approval"])
 def test_future_date_rejected(self):
  with self.snapshot() as d:
   with self.assertRaisesRegex(ValueError,"Future"):analyze(d,datetime(2026,11,18,0,0,tzinfo=timezone.utc))
 def test_corrupt_report_rejected(self):
  with self.snapshot() as d:
   p=pathlib.Path(d)/"research/v7-paper-summary.json"
   x=json.loads(p.read_text());x["registered_utc"]="2026-11-16T00:00:00Z";p.write_text(json.dumps(x))
   with self.assertRaisesRegex(ValueError,"mismatch"):analyze(d,NOW)
if __name__=="__main__":unittest.main()
