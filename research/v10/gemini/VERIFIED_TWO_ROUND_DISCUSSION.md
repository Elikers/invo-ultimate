# MAHORAGA × Gemini: First Real Adversarial Research Discussion

**Date:** 2026-11-18 UTC. **Branch:** `research/v11-gemini-deliberation`. **Production / website / risk / wallet:** no changes.

## Question: Can the 60-minute paper maturity evaluator silently accept unsupported paper returns?

### Round 1: ChatGPT hypothesis → real Gemini response
ChatGPT's review proposition was that raw source replay plus mature exit windows and the auditor establish source-grounded paper outcomes.
- GitHub run **44305666900**: https://github.com/Elikers/invo-ultimate/actions/runs/44305666900
- Gemini 3.5 Flash-Lite **HTTP 200**, validated JSON, **1 actual API call**, 1560 prompt tokens, 254 candidate output tokens (provider report; total 1814).
- Gemini answer: `no_blocking_issues_found`, **0 findings**, concluding that the maturity evaluator looked source-grounded and missing-data-safe.
- No account profit was measured; the answer was **a review opinion**, not proven validation.

### Round 2: ChatGPT challenges Gemini with a falsifiable counterexample
We observed that `init()` exposes `labels: new Map()`; `finalize()` previously trusted an already populated `state.labels` entry when its ID matched an observation. The basic auditor checked outcome metadata, numeric paper return and source SHA field **but did not independently reconstruct that return from `exitSources`**.
- GitHub run **44306016464**: https://github.com/Elikers/invo-ultimate/actions/runs/44306016464
- Gemini **HTTP 200**, validated JSON, **1 actual API call**, 2262 prompt tokens and 552 candidate output tokens (total 2814). It still reported `no_blocking_issues_found`, but also raised a **low-severity mutable-state exposure** finding.
- Gemini claimed a forged label would be overwritten if its ID were unknown or rejected. The counterexample explicitly used a **known valid observation ID**, not an unknown ID. This showed that the model's text was potentially mistaken even though its JSON was well-formed.

### Independent executable check: code decides
A deterministic, no-market, no-account test constructed a registered long observation, called `M.init`, then injected into the returned Map a synthetic `PAPER_OUTCOME_WITH_FUNDING_UNKNOWN` label using **the existing observation ID** and an arbitrary `paper_net_ex_funding=123`, a placeholder exit SHA field, **without any exit frame**.

- **Before fix:** [red-team reproduction, run 44306281705](https://github.com/Elikers/invo-ultimate/actions/runs/44306281705) **SUCCESS**, because the test confirmed that `finalize()` accepted the forged output and the basic auditor reported one matched label. This reproduced a caller-trust **research integrity gap**, not a demonstrated attacker path through our current GitHub capture workflow.
- **Fix:** `research/v10/ops/maturity.cjs` now validates every preexisting accepted trade label against its original actual exit frame, SHA256, market, receipt timestamp and a fresh `F.mature` computation; rejects unexpected labels, source-less and unmatched exit frames; seals completed state **only after** all checks and audit succeed.
- **After fix:** [repaired red-team CI, run 44306415641](https://github.com/Elikers/invo-ultimate/actions/runs/44306415641) **SUCCESS**: same forged existing-ID label now rejected and state stays unsealed for safe failure.
- [Full research integrity regression, run 44306600016](https://github.com/Elikers/invo-ultimate/actions/runs/44306600016) **SUCCESS**, including existing maturity, outcomes, forward auditing, challenger trust, Gemini mock and adversarial tests. An intermediate CI failure on run 44306501108 came from intentionally pinned pre-fix Gemini snapshot tests reading the new longer source file; the CI was corrected to preserve the historical model-input snapshot rather than falsify the original review.

### Provenance, spending and limits
- First round private Drive backup: https://drive.google.com/file/d/1Ozf9cIDORNXDXdPIvxm3ayUuTtZ1EJ-d/view?usp=drivesdk (1079 bytes, verified private metadata).
- Second round private Drive backup: https://drive.google.com/file/d/1jCM9yilqd830iZJ629C7MHOlgK6-ZSEI/view?usp=drivesdk (1593 bytes, verified private metadata).
- Each separate external model request used a bounded **$0.005 estimated maximum**, at most 900 response tokens, a 20-second timeout, no auto retry, no tools, and a read-only GitHub Actions token. **Actual Google charges are not confirmed**; the software cap is an estimate, not a Google account billing guarantee.
- All changed files relative to `research/v10.9-gemini-peer-review` are within `research/v10/ops/maturity.cjs`, `research/v10/gemini/`, and `.github/workflows/v11-*`; the live trading system, risk settings, main branch and website were not modified.

### Next guardrails
1. Preserve honest disagreement: never accept an AI claim, including Gemini's, without a reproducible assertion against the actual source.
2. Complete another independent end-to-end capture/maturity test using the hardened branch before merging any source changes into the currently scheduled research capture branch.
3. Add a **durable cross-run provider budget and offsite model-reply provenance** before recurring debate rounds. Do not automate open-ended AI conversation or trading.
4. These tests do not prove independent timestamps, venue fills, funding reconciliation, positive net profitability or production model readiness.

**Conclusion:** This first real multi-AI discussion was valuable **because a disagreement produced a failing red-team proof, a narrow research fix and passing regression**, not because either model declared the system safe.
