import io,hashlib,zipfile,unittest
from datetime import datetime,timezone
from archive_audit import archive_url,audit_zip
class ArchiveAuditTests(unittest.TestCase):
 def fake(self):
  day="2026-09-15"; sym="BTCUSDT"; start=int(datetime(2026,9,15,tzinfo=timezone.utc).timestamp()*1000)
  output=io.StringIO()
  for i in range(288):
   output.write(f"{start+i*300000},100,102,99,101,123,0,0,0,0,0,0\n")
  buffer=io.BytesIO()
  with zipfile.ZipFile(buffer,"w",zipfile.ZIP_DEFLATED) as z:z.writestr(f"{sym}-5m-{day}.csv",output.getvalue())
  raw=buffer.getvalue()
  return sym,day,raw,hashlib.sha256(raw).hexdigest()
 def test_valid(self):
  s,d,r,h=self.fake()
  self.assertEqual(audit_zip(s,d,r,h)["candles"],288)
 def test_bad_hash(self):
  s,d,r,h=self.fake()
  with self.assertRaisesRegex(ValueError,"CHECKSUM"):audit_zip(s,d,r,"0"*64)
 def test_invalid_market(self):
  with self.assertRaises(ValueError):archive_url("JUPUSDT","2026-09-15")
 def test_bad_date(self):
  with self.assertRaises(ValueError):archive_url("BTCUSDT","2026-02-31")
if __name__=="__main__":unittest.main()
