# MAHORAGA × Gemini — Research-only independent peer review

**Branch:** research/v10.9-gemini-peer-review. **Default:** OFFLINE_MOCK. **Live trading:** NEVER. **No secrets required for tests.**

## Architecture
- \`contracts.cjs\`: requests contain a bounded question and 1–4 **curated public research code** excerpts only (paths under \`research/v10/\`), source SHA256, registration timestamp and request hash. Rejects likely API keys and private keys in source snippets. No raw trading account/order/personal data or automatic source imports.
- \`provider.cjs\`: no-key mock by default. A separately enabled live path uses Google's Gemini generateContent REST API, key in \`x-goog-api-key\` header, constrained JSON response, no tool/function calls and explicit 20-second timeout. This is a preparation adapter, **not a connected Gemini account**. Google now recommends the newer Interactions API for new features; this bounded generateContent endpoint remains a supported integration at the time of authoring, but should be periodically reviewed.
- \`budget.cjs\`: one API request per invocation, maximum 3 reserved calls/day, 1024 reserved output tokens, approximately 3,000 estimated input tokens, and **$0.25/month reserved estimate** using caller-supplied published model prices. Approximate character-based token estimate is not a provider-guaranteed billing limit. Live mode is rejected unless both explicit opt-in and a separately verified **persistent, cross-run budget** are provided. GitHub Actions runner storage is ephemeral, so the included workflow is MOCK ONLY.
- \`gemini.test.cjs\`: deterministic mock and fake transport tests. Fake responses are NOT actual calls to Google.
- \`run-mock.cjs\`: writes \`mock-peer-review.json\`; mock must declare zero external reviews, zero API requests and no model/trading authorizations.
- \`.github/workflows/v109-gemini-mock.yml\`: validates prior MAHORAGA safety regressions and uploads a mock artifact with read-only \`contents: read\` permission. It does **not** reference \`GEMINI_API_KEY\`, change the website, invoke production trading, push branches, or schedule paid usage.

The model's text is **untrusted research advice**. Every response is rejected unless it references original request ID and hash, has allowed verdict/severity and evidence paths, and explicitly says \`trading_authorized=false\`, \`model_promoted=false\`, \`profitability_verified=false\`. Human or deterministic tests decide whether suggested changes deserve implementation; NO prompt or external model can authorize strategy promotion.

## Exact secure account connection setup (user action needed)
1. Open **https://aistudio.google.com/apikey**, sign in, and create a **dedicated Google Cloud project / Gemini API key** for this experiment. Review Google API key restrictions and permit only the **Generative Language API**. Never send the key to ChatGPT, Gemini chat, GitHub Issues, a commit, a screenshot, or logs.
2. In Google AI Studio / Cloud Billing, check the exact model's **current free-tier eligibility, available rate limits and published input/output prices**. If billing is enabled, configure a **provider-enforced project spending cap** (suggested first trial: **US$1/month or less**) and alerts if available. This cap is separate from the code's preliminary $0.25 estimated spend reservation. Actual billing and limits are determined by Google.
3. In GitHub, open **Elikers/invo-ultimate → Settings → Secrets and variables → Actions → New repository secret**. Set **Name:** \`GEMINI_API_KEY\`; **Secret:** paste the key **in the GitHub secret form only**. If on Android/iPhone and this menu is hidden, use a desktop browser view. The current mock workflow does not read this secret or make external calls.
4. Choose a currently supported model ID in your Google project, such as a Flash-class model you have access to. Record its exact model ID and current input/output token prices **without publishing any secret**. No model access or price assumptions have yet been independently tested from your account.
5. Tell the assistant only **"Gemini key stored as a GitHub Actions secret; ready for a controlled test"**, **not the key value**. We can then design a **separate, manually authorized one-shot research workflow** with minimum permissions, persistent budget ledger, fixed provider pricing checks, no triggers from untrusted PRs and no default-branch production changes. Do not enable the live adapter or recurring external API calls in this no-key phase.

## What remains unverified
No live Google API key has been connected or tested, no actual Gemini response has been obtained, no API cost has been incurred by this module, no automated multi-model collaboration is operating, and there is no evidence of improved trading returns. The budget source-code guard has passed unit tests, but **cross-run persistent reservation, actual token billing, provider cap and key permissions have not been verified**.

Useful official references:
- https://ai.google.dev/gemini-api/docs/api-key
- https://ai.google.dev/gemini-api/docs/billing
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/rate-limits
- https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets

**Production champion, trading strategies, risk parameters, accounts and website are unchanged.**
