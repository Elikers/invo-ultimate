import importlib.util, pathlib, tempfile, csv, unittest
HERE=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("experience",HERE/"engine.py")
e=importlib.util.module_from_spec(spec);spec.loader.exec_module(e)
def bars(n=180,start=e.START,drift=0.0002):
    p=100.0
    for i in range(n):
        o=p;p=o*(1+drift)
        yield (start+i*60000,o,max(o,p)*1.0001,min(o,p)*0.9999,p,100.0)
class ExperienceTests(unittest.TestCase):
    def test_causal_next_open_and_costs(self):
        x=e.replay(iter(bars()),"BTCUSDT",max_hold=4,take_pct=0.5,stop_pct=0.5)
        self.assertGreater(len(x["ledger"]),0)
        for row in x["ledger"]:
            self.assertGreaterEqual(row["entry_time_ms"],row["decision_time_ms"])
            self.assertGreater(row["exit_time_ms"],row["entry_time_ms"]-1)
            self.assertAlmostEqual(row["cost_return"],0.0012,places=9)
            self.assertLess(row["net_return"],row["gross_return"])
            self.assertEqual(row["source"],"BINANCE_HISTORICAL_SIMULATED_NOT_LIVE")
    def test_stop_first_on_ambiguous_bar(self):
        v=list(bars(80,drift=.001))
        # Forced large highs/lows on next fill candle, should stop instead of take
        for i in range(62,len(v)):
            t,o,h,l,c,volume=v[i];v[i]=(t,o,max(h,o*1.1),min(l,o*.9),c,volume)
        out=e.replay(v,"ETHUSDT",stop_pct=.01,take_pct=.01)
        self.assertTrue(any(r["exit_reason"]=="STOP_OR_GAP" for r in out["ledger"]))
    def test_bad_input_missing_minutes_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            f=pathlib.Path(d)/"bars.csv"
            with f.open("w",newline="") as h:
                w=csv.writer(h);w.writerow(("open_time_ms","open","high","low","close","base_volume"))
                w.writerow((e.START,1,1,1,1,1))
                w.writerow((e.START+120000,1,1,1,1,1))
            with self.assertRaisesRegex(ValueError,"missing"):list(e.read_bars(f,"BTCUSDT"))
    def test_isolated_splits_and_hard_gate(self):
        b=list(bars(100,start=e.TRAIN_END-75*60000,drift=.001))
        x=e.replay(b,"SOLUSDT",stop_pct=.5,take_pct=.5,max_hold=200)
        for r in x["ledger"]:
            self.assertEqual(r["split"],e.split_of(r["entry_time_ms"]))
            self.assertEqual(r["split"],e.split_of(r["exit_time_ms"]))
        summary=e.summarize(x["ledger"]);self.assertFalse(e.gate(summary,True,True)["approved_for_live"])
    def test_out_of_scope_and_invalid_risk(self):
        with self.assertRaises(ValueError):e.split_of(e.END)
        with self.assertRaises(ValueError):e.replay([], "BTCUSDT", fee_bps=-1)
    def test_empty_does_not_invent_profit(self):
        s=e.summarize([])
        self.assertIsNone(s["test"]["compounded_net_return"])
        self.assertIsNone(s["test"]["win_rate"])
if __name__=="__main__":unittest.main()
