import datetime as dt, hashlib, io, pathlib, sys, unittest, zipfile
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent))
import collect as C
class HistoricalSourceTests(unittest.TestCase):
 def test_plan_exact_five_years(self):
  items=C.plan()
  self.assertEqual(items[0][0],"daily")
  self.assertEqual(items[0][1],dt.date(2021,11,18))
  self.assertEqual(items[-1][1],dt.date(2026,11,17))
  covered=sum((end-start).days for _,_,start,end in items)
  self.assertEqual(covered,(C.END_EXCLUSIVE-C.START).days)
  self.assertEqual(len(items),89)
 def test_public_url_is_precisely_scoped(self):
  self.assertEqual(C.url_for("BTCUSDT",dt.date(2022,2,1)),
    "https://data.binance.vision/data/futures/um/monthly/klines/BTCUSDT/1m/BTCUSDT-1m-2022-02.zip")
  with self.assertRaises(ValueError):C.url_for("FAKEUSDT",dt.date(2022,2,1))
 def test_checksum_and_gap(self):
  b=io.BytesIO()
  dates=[dt.datetime(2022,1,1,tzinfo=dt.timezone.utc).timestamp()*1000+n*60000 for n in [0,1,3]]
  with zipfile.ZipFile(b,"w",zipfile.ZIP_DEFLATED) as z:
   z.writestr("BTCUSDT-1m-2022-01.csv",
     "".join(f"{int(t)},10,11,9,10,3,0,0,0,0,0,0\n" for t in dates))
  payload=b.getvalue()
  name="BTCUSDT-1m-2022-01.zip"
  C.validate_checksum(payload,(hashlib.sha256(payload).hexdigest()+"  "+name).encode(),name)
  result=C.inspect_kline_archive(payload,name,dt.date(2022,1,1),dt.date(2022,2,1))
  self.assertEqual(result["rows"],3)
  self.assertEqual(result["within_file_gaps"],1)
  with self.assertRaises(ValueError):
   C.validate_checksum(payload,("f"*64+" "+name).encode(),name)
 def test_no_future_or_pre_history_scope(self):
  with self.assertRaises(ValueError):C.plan(dt.date(2020,1,1),C.END_EXCLUSIVE)
  with self.assertRaises(ValueError):C.plan(C.START,dt.date(2027,1,1))
if __name__=="__main__":unittest.main()
