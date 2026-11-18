import pathlib,sys,unittest
HERE=pathlib.Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
import discovery as D
def synthetic(n=120, start=D.E.START, drift=.001):
    price=100.
    for i in range(n):
        o=price;price=o*(1+drift)
        yield (start+i*D.HOUR,o,max(o,price)*1.0001,min(o,price)*.9999,price,10.)
class TestDiscovery(unittest.TestCase):
    def test_unregistered(self):
        with self.assertRaises(ValueError):D.decision(list(synthetic(49)),'future_predictor')
    def test_no_trade_control(self):
        x=D.simulate(list(synthetic()),'flat_control',D.E.START,D.E.START+120*D.HOUR)
        self.assertFalse(x['trades'])
    def test_next_open_and_cost(self):
        x=D.simulate(list(synthetic()),'trend_12_48',D.E.START,D.E.START+120*D.HOUR)
        self.assertTrue(x['trades'])
        self.assertTrue(all(r['entry_ms']>=r['decision_ms'] and r['execution_cost']==.0012 for r in x['trades']))
    def test_reject_hour_gap(self):
        b=list(synthetic(80));del b[60]
        with self.assertRaisesRegex(ValueError,'missing hour'):
            D.simulate(b,'trend_12_48',D.E.START,D.E.START+80*D.HOUR)
    def test_minute_aggregation_integrity(self):
        b=[(D.E.START+i*60000,1.,1.,1.,1.,1.) for i in range(60)]
        self.assertEqual(len(list(D.aggregate(b))),1)
        with self.assertRaisesRegex(ValueError,'incomplete'):
            list(D.aggregate(b[:-1]))
        with self.assertRaisesRegex(ValueError,'missing'):
            list(D.aggregate(b[:30]+b[31:]))
    def test_stop_first(self):
        b=list(synthetic(70,drift=.003))
        for i in range(49,70):
            t,o,h,l,c,v=b[i];b[i]=(t,o,o*1.1,o*.9,c,v)
        x=D.simulate(b,'trend_12_48',D.E.START,D.E.START+70*D.HOUR)
        self.assertTrue(x['trades'])
        self.assertTrue(all(r['reason']=='STOP_FIRST_OR_GAP' for r in x['trades']))
    def test_no_future_scope(self):
        with self.assertRaisesRegex(ValueError,'funding'):
            D.simulate([], 'flat_control',D.E.START,D.E.END)
    def test_funding_direction(self):
        t=D.E.START;events=[(t+2*D.HOUR,.0001),(t+4*D.HOUR,-.0002)]
        ts=[r[0] for r in events]
        self.assertAlmostEqual(D.signed_funding(t,t+5*D.HOUR,'LONG',events,ts),-.0001)
        self.assertAlmostEqual(D.signed_funding(t,t+5*D.HOUR,'SHORT',events,ts),.0001)
    def test_reject_incomplete_years(self):
        with self.assertRaisesRegex(ValueError,'five-year'):
            D.evaluate(list(synthetic()),'BTCUSDT',[])
    def test_no_synthetic_profit(self):
        s=D.metrics([])
        self.assertIsNone(s['mean_net']);self.assertIsNone(s['profit_factor'])
if __name__=='__main__':unittest.main()
