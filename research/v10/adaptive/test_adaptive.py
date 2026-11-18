import importlib.util,pathlib,sys,unittest,io,zipfile,hashlib
HERE=pathlib.Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
import learn,funding
E=learn.E
def bars(n=500,start=E.START,drift=.0003):
    p=100.0
    for i in range(n):
        o=p;p=o*(1+drift)
        yield (start+i*E.ONE_MIN,o,max(o,p)*1.0001,min(o,p)*.9999,p,100.0)
class AdaptiveTests(unittest.TestCase):
    def test_fits_only_matured(self):
        t=E.START+10000000
        rows=[dict(entry_time_ms=t-10000,exit_time_ms=t-5000,decision_time_ms=t-20000,net_return=.03,side="LONG"),
              dict(entry_time_ms=t-10000,exit_time_ms=t+1000,decision_time_ms=t-20000,net_return=100,side="LONG")]
        model,diag=learn.fit(rows,t)
        self.assertEqual(diag["trades_matured"],1)
        self.assertEqual(diag["groups"],0)
    def test_no_trades_on_untrained_group(self):
        f=learn.predict({},0)
        self.assertFalse(f("LONG",E.START))
        self.assertFalse(f("SHORT",E.START))
    def test_trained_filter_changes_actual_replay_not_posthoc_subset(self):
        x=list(bars())
        baseline=E.replay(iter(x),"BTCUSDT")
        disabled=E.replay(iter(x),"BTCUSDT",signal_filter=lambda side,t:False)
        self.assertGreater(len(baseline["ledger"]),0)
        self.assertEqual(len(disabled["ledger"]),0)
    def test_unregistered_threshold_fails(self):
        with self.assertRaises(ValueError):learn.predict({},.03)
    def test_funding_checksum_and_schema(self):
        data=b'calc_time,funding_interval_hours,last_funding_rate\n1685577600000,8,0.0001\n'
        buf=io.BytesIO()
        with zipfile.ZipFile(buf,"w") as z:z.writestr("BTCUSDT-fundingRate-2023-06.csv",data)
        blob=buf.getvalue();fn="BTCUSDT-fundingRate-2023-06.zip"
        funding.verify(blob,(hashlib.sha256(blob).hexdigest()+"  "+fn).encode(),fn)
        self.assertEqual(len(funding.parse(blob,"2023-06")),1)
        with self.assertRaises(ValueError):
            funding.verify(blob,(("0"*64)+"  "+fn).encode(),fn)
        with self.assertRaises(ValueError):funding.parse(blob,"2023-05")
    def test_promotion_remains_blocked(self):
        self.assertFalse(E.gate(E.summarize([]),True,True)["approved_for_live"])
if __name__=="__main__":unittest.main()
