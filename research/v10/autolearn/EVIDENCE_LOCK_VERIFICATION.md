# MAHORAGA v10 — Automatic Learning Evidence-Lock Upgrade

**Date:** 2026-11-18  
**Branch:** `research/v10-autolearn-evidence-lock`  
**Status:** Tested research-only hardening. **Not an always-on self-learning deployment.**

## Why this change matters

The previous auto-learning loop checked the SHA-256 hash of a proposed training-row feature payload, but the training-row author could recompute that hash **after** observing whether a trade won or lost. That defeats the purpose of locking pre-trade information. A model could therefore learn from ex post features rather than information genuinely available at prediction time.

The new implementation requires every trainable forward observation to include both `training_feature_snapshot` and `training_feature_sha256` **in the pre-outcome shadow observation itself**. Its recorded hash-chain is validated before outcomes are admitted. A training row must match this pre-outcome commitment exactly; mismatched or missing snapshots are rejected with `FEATURES_NOT_LOCKED_IN_PRE_OUTCOME_OBSERVATION`.

## Tested safeguards

- The same synthetic forward-paper fixture yields **35** versioned challenger updates in its registered TRAIN window; the frozen champion remains identical.
- Replaying the same 35 training rows produces **zero new updates** (idempotent processing).
- A post-outcome attempt to change a market feature and recompute the training-row hash is rejected.
- Missing/modified pre-outcome journal evidence is rejected by the hash-chain verifier.
- Wrong registration, incomplete feature mask, holdout contamination, duplicated rows and immature outcomes are rejected.
- Atomic local checkpoint and single-writer tests remain passing.
- No live order, website activation, or model promotion path exists in this branch.

## Tests and production verification

- [Pre-outcome feature lock tests](https://github.com/Elikers/invo-ultimate/actions/runs/44237074710): **PASS**.
- [Final production source isolation and evidence-lock audit](https://github.com/Elikers/invo-ultimate/actions/runs/44237187044): **PASS**, compares `index.html`, `v61-core.js`, `research/run.cjs`, `research/v7-registration.json` and production research workflow against a separately checked-out `main`.
- The audit reports **no new eligible v10 forward-closed trade sample verified by this run** and release status **BLOCKED**.

## Limits that must not be misrepresented

The result is **software test success, not trading profitability or real-world autonomous learning**. Synthetic observations in tests are not exchange evidence. A hash-chain can be rewritten by someone controlling the full file; external time anchoring and immutable storage are still needed. The current pre-outcome snapshot guard prevents a particular form of train-row after-the-fact modification but does not establish third-party source authenticity or that the market features were correct.

Real operation still requires approved, reliable public-data runtime/storage, prediction-time feature materialization, immutable model checkpoints, independently matured paper-outcome labeling, real economic cost assessment, and prospective matched evaluation against the unchanged baseline. Training must remain isolated from held-out forward evidence.

**No production website change, paid infrastructure, live trading or automatic challenger promotion authorized or performed.**
