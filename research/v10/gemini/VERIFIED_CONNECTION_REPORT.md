# MAHORAGA × Gemini — Actual Connection Verification (2026-11-18 UTC)

**Research branch:** `research/v10.9-gemini-peer-review`. **Production trading, website and risk:** unchanged.

## Verified evidence
- [Mock + one-shot fake-transport tests](https://github.com/Elikers/invo-ultimate/actions/runs/44303001860) — **SUCCESS**. Source-hash consistency, no-secret output, one request per opt-in invocation, budget threshold and non-trading gates passed.
- [First one-shot run](https://github.com/Elikers/invo-ultimate/actions/runs/44302892458) — FAILED **before any network call** because the local test used nondeterministic request timestamps. Fixed with a frozen test request timestamp. Do not count as any Gemini contact.
- [Real one-shot Gemini generation request](https://github.com/Elikers/invo-ultimate/actions/runs/44303098944) — **HTTP 404** for `gemini-2.5-flash-lite`, so **no successful external review**. The request ran once, its secret came through GitHub Actions' masked `GEMINI_API_KEY` field, and error handling did not publish raw server body, credential or prompt.
- [Protected, read-only model catalog](https://github.com/Elikers/invo-ultimate/actions/runs/44303417357) — **SUCCESS / HTTP 200**. Using the same stored GitHub secret, `GET /v1beta/models` returned an authenticated model catalog advertising `generateContent` methods. Listed among others: `gemini-3.5-flash-lite`, `gemini-3.8-flash`. **0 model inference calls** in this check, and no generation/model eligibility claim inferred from listing alone.
- All posted statuses represent real CI evidence, **not** simulated profits or model performance.

## Root cause / next permitted action
Google's official models documentation says **Gemini 2.5 models have limited access for new projects**, and recommends the newer **3.5 Flash-Lite or 3.8 Flash** models. This is a plausible explanation for the generation 404, but we did not expose or parse Google's raw error details and therefore cannot claim a fully verified root cause.

The future (still research-gated) peer-review adapter's default model is prepared as `gemini-3.5-flash-lite`. No automatic retry or extra inference was authorized or run. **Before a new paid/model-generation test**, validate current model pricing and costs, obtain a fresh one-shot explicit authorization, run non-secret deterministic tests, then attempt at most one new generation request. The previous 2.5 request must never be relabeled successful.

## Security and scientific limitations
- GitHub secret was masked in logged workflow environment and is not committed in repo files. The connector cannot view/change GitHub Actions secret value.
- Current active model review mode is still mock-only unless separately authorized live controls and persistent budget monitoring are configured.
- The authenticated model listing establishes **API credential availability for metadata** but not working text-generation billing entitlement.
- No model output, trading orders, profitable strategy evidence, live account access, production modification, model promotion or background Gemini auto-learning occurred.

## References
- https://ai.google.dev/gemini-api/docs/models
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/api-key
- https://github.com/Elikers/invo-ultimate/actions/runs/44303417357
