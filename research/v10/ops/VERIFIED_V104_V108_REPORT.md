# MAHORAGA v10.4–v10.8 — Verified Sequential Research Upgrade

**As of:** 2026-11-18 UTC. **Repository:** Elikers/invo-ultimate. **Branch:** research/v10.8-operations-safety. **Production strategy, risk files and website:** unchanged. **Live order placement:** blocked.

## Evidence — actual GitHub Actions results (not simulated tests of profit)
| Phase | Branch | GitHub run | Result |
|---|---|---|---|
| v10.4 — archive and source integrity | research/v10.4-evidence-archive | [44287529021](https://github.com/Elikers/invo-ultimate/actions/runs/44287529021) | Unit tests and local source archive PASS; **workflow FAIL** only in GitHub Releases publication (HTTP 401 Bad credentials) |
| v10.5 — predecision-versus-matured outcome reconciliation | research/v10.5-causal-outcomes | [44287884027](https://github.com/Elikers/invo-ultimate/actions/runs/44287884027) | SUCCESS |
| v10.6 — evidence-gated challenger learner | research/v10.6-challenger-learning | [44288335803](https://github.com/Elikers/invo-ultimate/actions/runs/44288335803) | SUCCESS |
| v10.7 — standalone read-only dashboard artifact | research/v10.7-readonly-dashboard | [44288861413](https://github.com/Elikers/invo-ultimate/actions/runs/44288861413) | SUCCESS |
| v10.8 — risk and operations watchdog | research/v10.8-operations-safety | [44289162870](https://github.com/Elikers/invo-ultimate/actions/runs/44289162870) | SUCCESS |
| v10.8 — end-to-end public feed capture via revision trigger | research/v10.8-operations-safety | [44289947950](https://github.com/Elikers/invo-ultimate/actions/runs/44289947950) | SUCCESS: 12 public frames; 0 errors; 0 pre-registration predictions; BTC/ETH/SOL gap receipts as expected |

## v10.4 — durable provenance / backup
- Code \`research/v10/ops/archive.cjs\` verifies exact original GitHub capture run ID, capture SHA256 and raw public source hashes, then constructs a no-overwrite research manifest. Tamper and duplicate tests passed.
- Release publication using the GitHub Actions \`GH_TOKEN\` fails with **HTTP 401**, first on artifact download, then on release access. Accordingly GitHub Releases publication has **not been verified**. This is an operational blocker, not a claim of a successful release.
- An alternative **off-GitHub backup was actually completed** using the connected GitHub and Google Drive connectors. The exact, checksum-verified v10.4 capture ZIP from run 44287529021 (ZIP SHA256 \`a499e5ea73bbf4f9981c6cbfeedb60ad69c5b9c8eacfb9de4baff3bf43e8feaf\`, 2,161 bytes) was uploaded to a new **private** Google Drive research backup folder. Google Drive metadata readback confirmed size, parent and non-shared status.
- The v10.8 public-feed smoke-test capture ZIP from run 44289947950 (1,199 bytes, original capture SHA256 verified inside ZIP) was also uploaded separately to that Drive folder, with verified metadata readback.
- **Important:** Two manually verified off-GitHub backups are not an independently signed immutable ledger, nor proof that future hourly backups will work. Folder and file IDs are deliberately not recorded in this public repository.

## v10.5 — causal matured-outcome checks
- \`outcomes.cjs\` recomputes a quote-based paper outcome using frozen predecision source frames, the subsequently observed exit frame and recorded maturity time. Rejects mismatch, missing exit source, duplicate IDs, unsupported funding claims and premature labels.
- Tests used explicitly synthetic examples. **Actual new, matured post-registration labels available: 0.** No funding-inclusive or account-profit inference permitted.

## v10.6 — controlled research challenger learner
- \`challenger.cjs\` implements bounded per-market/per-direction Beta-prior updates with immutable processed IDs and checkpoint fingerprints.
- A real update requires a strictly later matured outcome, previously committed prediction, verified original source, **full** venue fee/slippage/funding evidence, external time/source attestation and independently approved training eligibility. No independent verifier is connected by default, so **real accepted updates = 0**, challenger revision = 0, production champion unchanged.
- Synthetic gated positive examples in the unit test demonstrate mechanics only; they are **not** market evidence or accepted profitability.

## v10.7 — read-only economic analytics / dashboard
- \`analytics.cjs\` validates complete market accounting (observations = pending + missing + no-trade + reference-only labels), and \`dashboard.cjs\` safely renders a self-contained HTML view.
- Dashboard artifact is published **as a GitHub Actions downloadable research artifact** — not deployed into the live trading website. Since zero independent forward reports have been loaded, profit metrics remain **null / NOT VERIFIED**, rather than zero or positive.

## v10.8 — monitoring and actual hourly collection trigger
- \`monitor.cjs\` records blocking status for unscheduled collection, missing independent backup, missing external attestation, no observations, stale last prediction, missing maturity labels, failed workflows, suspicious profit claims and unauthorized production changes.
- [Operations watchdog workflow](https://github.com/Elikers/invo-ultimate/actions/runs/44289162870) passed full v10.4–v10.8 code-level regression; blockers are deliberately visible.
- \`.github/workflows/v108-capture-request.yml\` runs on **revision changes** to \`research/v10/forward/capture-request.json\` in the v10.8 research branch. It validates no-trading tests, captures a bounded public BTC/ETH/SOL feed, verifies provenance and uploads an expiring 30-day artifact. Its first pre-registration smoke test succeeded.
- A separate user-authorized **hourly ChatGPT task** was **created and enabled** at 2026-11-19 **08:10 Asia/Manila** (00:10 UTC), running once per hour. It is instructed to increment the v10.8 research capture revision through the connected GitHub app, check the actual run, and attempt to copy its verified artifact to private Drive, failing closed when tools/credentials are missing. **Future action execution and future backup have not yet been observed**; treat it as a scheduled *attempt*, not proven durable unattended collection.
- A GitHub \`schedule:\` cron defined only in a non-default research branch would not run as a reliable GitHub-native schedule. No production/default-branch scheduler was added.

## Current evidence and hard blockers
1. Genuine post-registration independently anchored forward predictions: **0** as of this report. Registration begins 2026-11-19 00:00 UTC.
2. Matched matured post-registration paper labels: **0**. Existing maturity evaluator is research-only, and GitHub Actions cross-run artifact fetch via its token returned HTTP 401 in v10.4; automatic reliable maturity orchestration **not proven**.
3. Independent signed provenance and full venue fee, funding and slippage reconstruction: **not established**.
4. Off-GitHub Drive copies: **2 verified pre-registration/connection smoke samples**, but recurring offsite backup not yet verified; release publication blocked.
5. Automated trained and validated MAHORAGA champion: **NO**. Real accepted challenger updates = **0**.
6. Forward net profitability, live trading capability, risk or production website changes: **NOT verified / NOT authorized**.

## Verdict
**Five research modules built and core tests passed, two actual private off-GitHub smoke-evidence backups verified, and a future hourly collector-trigger task enabled.** GitHub Releases publication failed; future scheduled execution, actual future labels, durable ongoing backup and true profitability remain unverified. All production trading strategy and risk settings remain frozen. Never infer alpha, real profits, continuous learning or actual trading from these tests.
