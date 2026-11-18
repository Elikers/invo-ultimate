# MAHORAGA Research — 60-minute Same-Run Maturity Evaluator

**Implementation branch:** \`research/v10.8-operations-safety\`.
**Verification date:** 2026-11-18 UTC, *before* registered prospective capture start on 2026-11-19T00:00:00Z.
**No live trading or production changes.**

## Why the architecture changed

An earlier cross-run workflow tried to download a prior GitHub Actions artifact with \`gh run download\` but failed under the available GitHub Actions credential. A separate evaluator which depends upon that operation cannot honestly be called reliable. The updated \`.github/workflows/v108-capture-request.yml\` retains its original public capture inputs **on the same GitHub runner** and invokes \`research/v10/ops/settle-same-run.cjs\` immediately after the initial public snapshot was committed. No cross-run artifact download is needed for maturity evaluation.

## Frozen research contract

1. Hourly ChatGPT automation is **enabled** and scheduled to attempt triggering the GitHub research-branch workflow starting 2026-11-19 08:10 Asia/Manila. As of this report, the first future execution has **not** happened; scheduling does not establish actual reliability.
2. \`capture.cjs\` collects a bounded fresh 20-second public Hyperliquid BTC/ETH/SOL L2 snapshot and writes hashes, public source evidence, original decision timestamps, and explicit gaps. The frozen v10.3 registration starts 2026-11-19 00:00 UTC; no before-start market snapshot counts as forward evidence.
3. In a single GitHub Actions job (80 minute timeout), \`settle-same-run.cjs\` holds only the research runner until each observation has passed its fixed **60-minute maturity**. It attempts public WebSocket reception from 10 seconds before the horizon, accepts exit quotes only at or after each observation's exact maturity and within the original **five-minute tolerance**, and rejects missing/stale/future or mismatched market sources. Its bounded exponential reconnect attempts never backdate or synthesize quotes.
4. \`maturity.cjs\` enforces exactly one label per observation. **NONE** becomes NO_TRADE after maturity. LONG/SHORT with a newly observed usable quote becomes PAPER_OUTCOME_WITH_FUNDING_UNKNOWN, with a disclosed assumed 4bps fee + 2bps additional slippage per side, *excluding unverified funding and without verified actual fills*. If no source quote is usable by the deadline, the label is **MISSING_MATURITY_QUOTE**, explicitly **not a win/loss or zero-return trade**.
5. Outputs include \`outcomes.json\`, \`maturity-exit-frames.json\`, \`maturity-audit.json\` and \`maturity-SHA256SUMS.txt\`. The workflow verifies all file digests, then uses the *independent* \`outcomes.cjs\` causal evaluator to recompute outcomes from original entry and exit public raw sources. The upload step runs even after failures where files exist, but a failed job or absent completed ledger is **not** reliable evidence.
6. The enabled hourly automation was updated to inspect *previously completed* jobs (a job may run ~60–65 min), rather than incorrectly expecting the newly triggered job to have finished. It will attempt to download an exact successful artifact and upload a unique ZIP to the private connected Google Drive folder; must verify file metadata and report any connector denial. **Its future action and backup are still unverified.**

## Verified engineering and artifact evidence

- [End-to-end pre-registration run 44291709174](https://github.com/Elikers/invo-ultimate/actions/runs/44291709174): SUCCESS. Initial 9 public frames, zero errors, zero registered predictions; same-run evaluator completed the empty ledger correctly. All raw SHA256 and maturity digests matched. One actual ZIP copy was uploaded to private Drive and confirmed via readback.
- [Final independent-audit run 44292139386](https://github.com/Elikers/invo-ultimate/actions/runs/44292139386): SUCCESS. Initial **12 received public frames**, zero invalid frames, **0 correctly registered predictions**, three pre-registration market gap receipts. Same-run maturity step completed 0 labels, reported zero profits and no promotions; its independent final reprice and SHA256 checks passed.
- The downloaded final-run ZIP was separately inspected programmatically: ZIP CRC checks passed, original receipt SHA256 and three maturity file SHA256 digests all matched, source run ID was 44292139386, the empty ledger was correct, and explicit live authorization remained false. The exact ZIP (2,793 bytes) was uploaded to private Google Drive. Drive metadata readback verified size, non-shared status and expected folder parent.
- [Operations regression workflow](https://github.com/Elikers/invo-ultimate/actions/runs/44292100725): SUCCESS, including future quote timing, duplicate and tamper cases, missing-source outcomes, no-trade maturity and nonpromotion guards.
- All new changes remain isolated under \`research/v10/ops/\`, \`.github/workflows/v108-capture-request.yml\`, \`.github/workflows/v108-watchdog.yml\` and the pre-registration research-only capture trigger JSON.

## Reliability and scientific blockers

**Proven:** A same-run bounded collector, full source provenance verification, strict maturity and missing quote semantics, controlled reconnect **code and synthetic tests**, end-to-end zero-observation smoke CI, and one verified private Drive copy of a smoke artifact.

**Not yet proven:** Continuous hourly ChatGPT/GitHub delivery after the registered start; a genuine post-registration source observation with a real one-hour delayed exit quote; actual reconnect recovery under a live outage; uninterrupted 60–65 minute GitHub runner availability or GitHub Actions minute budget; recurring Google Drive archival; externally anchored immutable timestamps; verified venue funding/slippage/fees; real or positive strategy profit; independent model training eligibility.

**Production:** \`approved_for_live=false\`, \`training_eligible=false\`, no exchange orders, no model champion promotion, no edits to production strategies/risk/website.

The next sound verification is the first *completed* post-registration GitHub run with source timestamps and actual matured labels. Until then, this is a **tested research implementation, not a proven operational learning system**.
