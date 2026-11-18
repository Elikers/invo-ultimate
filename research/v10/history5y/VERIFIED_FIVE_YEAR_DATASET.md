# MAHORAGA — Five Years of Verified Historical BTC / ETH / SOL 1-Minute Candles

**Research-only collection finished and independently assembled:** November 18, 2026 (UTC).

## Verified actual records, not generated data

- **BTCUSDT USD-M perpetual:** 2,629,440 observed 1-minute OHLCV candles
- **ETHUSDT USD-M perpetual:** 2,629,440 observed 1-minute OHLCV candles
- **SOLUSDT USD-M perpetual:** 2,629,440 observed 1-minute OHLCV candles
- **Total verified:** **7,888,320 real market candles** with continuous 1-minute UTC timestamps after five official daily supplement files.
- **Exact UTC range:** 2021-11-18 00:00 inclusive to 2026-11-18 00:00 exclusive (five years, 1,826 days).
- **Source:** official Binance USD-M futures public monthly and daily historical candle ZIP archives, with accompanying publisher SHA-256 CHECKSUMs.
- **Original publisher files checked:** 620 archives; 615 in the five original year-batch outputs, plus 5 gap-recovery daily archives.
- **Important data-quality finding:** SOLUSDT monthly February 2022 omitted Feb 26–28, 2022; monthly April 2022 omitted Apr 1–2, 2022. These 7,200 1-minute observations were obtained from separately published, checksum-verified **daily** Binance archives. **No interpolation** or invented candles used.
- **Final cross-archive audit:** missing/overlapping timestamps = 0, expected records = observed records = 7,888,320, original downloaded ZIP SHA-256s rechecked against batch manifests.

## Repository and test evidence

- [Five independent full-year historical data jobs](https://github.com/Elikers/invo-ultimate/actions/runs/44272402703): SUCCESS for all 5 annual shards.
- [Official SOLUSDT daily gap recovery](https://github.com/Elikers/invo-ultimate/actions/runs/44273320971): SUCCESS for 5 requested daily archives (4,320 February candles + 2,880 April candles).
- [Three-market June 2023 1m acquisition pilot](https://github.com/Elikers/invo-ultimate/actions/runs/44272154678): 129,600 candles, checksum-verified.
- `history5y/collect.py`: reproducible original archive downloader, SHA-256 validation, interval completeness flags, optional 1-hour mode and date bounds.

The original archive files are held in short-retention GitHub Actions artifacts (seven days) and were also downloaded into the current ChatGPT conversation artifact workspace. **GitHub Actions artifacts are not permanent training storage**; the user must retain the delivered dataset or approve a durable research storage destination.

Three compact normalized gzip CSV datasets were produced and independently chronological-replayed in the conversation workspace. Fields: `open_time_ms,open,high,low,close,base_volume`. The three contain 2,629,440 records each. The normalized files and a combined ~133 MB ZIP are deliverables in that conversation, not committed to the source repository.

## Strict limitations

These are **five years of market OHLCV history**, not five years of MAHORAGA live trades, exchange order-book history, realized trading outcomes or experience reports. This historical market feed comes from Binance; current MAHORAGA forward source uses Hyperliquid, so venue microstructure and funding/execution cannot be assumed identical. Separate future-only timestamped predictions, trade labeling, realistic economic costs and held-out validation are required to support an actual profitable-learning claim. No production website, automated trading, risk parameters or approved champion model was changed.
