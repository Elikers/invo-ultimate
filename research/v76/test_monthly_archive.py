import unittest,io,zipfile,hashlib,csv
from datetime import datetime,timezone
from calendar import monthrange
from monthly_archive import audit,archive_url
class MonthlyTests(unittest.TestCase):
 def fake(self,month="2026-04",symbol="BTCUSDT",corrupt=False):
  y,m=map(int,month.split("-"))
  n=monthrange(y,m)[1]*288
  start=int(datetime(y,m,1,tzinfo=timezone.utc).timestamp()*1000)
  text=io.StringIO()
  writer=csv.writer(text)
  for i in range(n):
   t=start+i*300000
   if corrupt and i==900:t+=300000
   writer.writerow((t,100,102,99,101,10))
  buf=io.BytesIO()
  with zipfile.ZipFile(buf,"w",zipfile.ZIP_DEFLATED) as z:
   z.writestr(f"{symbol}-5m-{month}.csv",text.getvalue())
  raw=buf.getvalue()
  return raw,hashlib.sha256(raw).hexdigest()
 def test_valid_month(self):
  raw,sha=self.fake()
  x=audit("BTCUSDT","2026-04",raw,sha)
  self.assertEqual(x["candles"],8640)
  self.assertEqual(x["bars"][0]["o"],100)
 def test_reject_gap(self):
  raw,sha=self.fake(corrupt=True)
  with self.assertRaisesRegex(ValueError,"continuity"):audit("BTCUSDT","2026-04",raw,sha)
 def test_reject_checksum(self):
  raw,sha=self.fake()
  with self.assertRaisesRegex(ValueError,"checksum"):audit("BTCUSDT","2026-04",raw,"0"*64)
 def test_reject_unsupported(self):
  with self.assertRaises(ValueError):archive_url("JUPUSDT","2026-04")
  with self.assertRaises(ValueError):archive_url("BTCUSDT","2026-10")
if __name__=="__main__":unittest.main()
