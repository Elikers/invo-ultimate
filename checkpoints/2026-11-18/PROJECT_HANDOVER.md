# INVO Ultimate + MAHORAGA — Save Point / Project Handover
**Checkpoint date:** 2026-11-18 (Asia/Manila)
**Repository:** https://github.com/Elikers/invo-ultimate
**Source of truth:** GitHub tracked branches, immutable commit hashes, GitHub Actions evidence, and private Google Drive research backups.

## What has been built
- INVO Ultimate website is in `main`. Latest verified main SHA at checkpoint initiation: `abb215a908780a9a759e92bbd0fcff264ffe96e1`; GitHub Pages deploy run `44307015651` completed SUCCESS. Main backup-restore run `44307015481` completed SUCCESS; backup health run `44307054216` completed SUCCESS.
- Historical INVO research branches: v7.5, v8.2–8.8 verification gates, v9.0–9.4 profitability studies, v10 data collection and historical discovery.
- MAHORAGA research includes several years of retrospective candles and data experiments, source-bound public market observation, 60-minute maturity evaluation, no-trade and missing-data handling, synthetic/testing proof, independent reviewer gates and nonpromotion controls. **No independently established net-profitable production trading engine**.
- `research/v10.8-operations-safety` SHA `2b6ce868a4d7326b2ede75292ed412116d8cfc97`: same-run forward capture+maturity, integrity checks and audit backup. Registered forward observation starts 2026-11-19T00:00:00Z; its future execution has NOT been confirmed as of this checkpoint.
- `research/v10.9-gemini-peer-review` SHA `9bb5266529c18925f83584d894e8e2a9a7358464`: independent Gemini 3.5 Flash-Lite **real API** JSON review proven with bounded one-off research request; previous Gemini 2.5 generation returned 404; no recurring billable AI calls configured.
- `research/v11-gemini-deliberation` SHA `c5caea188261d553267e988a332b2ccb1401b4fc`: two genuine Gemini code-review discussion rounds. A deterministic challenger uncovered forged paper-outcome label acceptance in the mutable maturity state; fixed inside isolated research branch. Final integrity regression `44306600016` SUCCESS. **Not merged into production or the existing scheduled v10.8 branch**.
- Future concept only: MetaTrader 5 integration and multi-asset gold/crypto scalper research. Nothing MT5-specific has been connected; no live EA, broker account or trading has been authorized.

## Frozen protections
- Live trading, automated orders, wallets and broker credentials: **not authorized** for MAHORAGA.
- Trading strategies and risk parameters: preserve existing versions, no speculative modifications.
- Research-only labels are not real fills or realized account profit. Missing actual funding prevents fully verified trade-level net profitability.
- LLM critique is advisory; actual reproducible code/evidence validation is required.
- No access to actual Google API keys, repository secrets or wallet credentials in checkpoint artifacts. Do **not** embed secrets into archives.

## Scheduled activities — preserve separately
- ChatGPT automation **MAHORAGA Forward Capture** ID `6afd83f5bc308191a6ed1cff5388dcbe`, enabled. Its next observed run: 2026-11-19 08:10 Manila (2026-11-19T00:10Z). GitHub research capture/action fulfillment is NOT proven simply by a scheduled task.
- ChatGPT automation **INVO Daily Research Report** ID `6afc93c022888191acf3e286a567803d`, enabled; next observed run 2026-11-19 10:00 Manila.
- These automations are stored outside Git. Restoring a Git bundle does **not** recreate schedules, GitHub Secrets, Google billing configuration, connected apps or external accounts. Neither automation is paused by this checkpoint.

## Critical evidence links
- https://github.com/Elikers/invo-ultimate/actions/runs/44307015651 — website deployment successful.
- https://github.com/Elikers/invo-ultimate/actions/runs/44307015481 — INVO backup restore successful.
- https://github.com/Elikers/invo-ultimate/actions/runs/44292139386 — research capture+maturity pre-registration smoke.
- https://github.com/Elikers/invo-ultimate/actions/runs/44304586946 — real Gemini 3.5 structured generation success.
- https://github.com/Elikers/invo-ultimate/actions/runs/44305666900 — Gemini debate round 1.
- https://github.com/Elikers/invo-ultimate/actions/runs/44306016464 — Gemini debate round 2.
- https://github.com/Elikers/invo-ultimate/actions/runs/44306281705 — reproduced forged paper outcome vulnerability in isolated research test.
- https://github.com/Elikers/invo-ultimate/actions/runs/44306600016 — repaired research-only maturity suite passes.
- https://github.com/Elikers/invo-ultimate/blob/research/v11-gemini-deliberation/research/v10/gemini/VERIFIED_TWO_ROUND_DISCUSSION.md
- Private Google Drive evidence folder: `MAHORAGA Research Evidence Backup`, ID `1wSVgfipc16pYPRFNbKOydcnkb1GDESxG`. Separate Gemini and maturity evidence archives were previously verified there.

## How to resume without destroying previous work
1. Select exact preserved branch and compare its SHA to this checkpoint and bundle manifest.
2. Verify the Git bundle SHA256 and GitHub Actions restore test before using a restored clone.
3. Keep main/live code frozen. Create **a fresh isolated research branch** from the desired baseline.
4. If implementing future MT5, create new read-only market-data and indicator research first; seek an independent broker/feed/licensing decision, demo validation, and permission before any order execution.
5. Never claim auto-learning/profitability or scheduled capture success without complete causal forward evidence.

## Scope and limitations of the archive
The Git bundle captures **Git-tracked objects and all fetched branch refs**, not GitHub Actions artifacts, external market APIs, private Google Drive assets, remote secrets, connected service accounts or scheduled task state. This separate handover document and the preexisting private evidence backups provide the missing context. The checkpoint workflow should verify a fresh mirror clone from its bundle, list included refs, compute SHA-256 hashes and store a private offsite copy.
