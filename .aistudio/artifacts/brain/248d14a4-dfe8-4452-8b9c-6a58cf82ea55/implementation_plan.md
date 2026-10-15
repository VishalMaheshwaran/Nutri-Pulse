# Gemini API Quota & Usage Intelligence Platform

A dedicated developer command center and interactive playground that explains, monitors, calculates, and simulates Google AI Studio limits, rate quotas (RPM, RPD, TPM), token usage, and pricing across all Gemini models.

### User Review & Critical Decisions

> [!IMPORTANT]
> The platform is configured as a full-featured Quota & Token Intelligence Hub. It provides clear, transparent visibility into the non-unlimited nature of Google AI Studio and Gemini API tiers, with live interactive testing.

- **Confirmed Decision 1 (Model Engine)**: Default to `gemini-3.8-flash` for the live playground and token counting with server-side proxy security via `@google/genai`.
- **Confirmed Decision 2 (Tier Coverage)**: Side-by-side breakdown of the **Free Tier** (rate limits, request caps, zero cost) vs. **Pay-as-you-go Tier** (scaled throughput, token-based pricing, billing thresholds).
- **Confirmed Decision 3 (Interactive Utilities)**: Live token calculator with tokenizer breakdown, prompt cost estimator, simulated rate-limit throttling monitor, and sample workload tester.

---

## 1. Overview & Core Concept

- **What It Does**: Answers the fundamental question *"Do I have unlimited use?"* through an interactive developer cockpit. It provides real-time rate limit guides, an interactive token counter and cost calculator, a live Gemini playground with server-side token attribution, and a simulated quota load tester.
- **Target Audience / Persona**: Developers, creators, and engineers building on Google AI Studio who need to understand their quotas, avoid 429 rate limit errors, plan token budgets, and compare Free vs. Pay-As-You-Go pricing.
- **Key Value**: Eliminates quota confusion, visualizes real-world token economics, and provides instant practical tools to test prompts and estimate costs before deploying.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Quota Matrix & Tier Explorer**:
   - Compare Free Tier vs. Paid Tier limits across `gemini-3.8-flash`, `gemini-3.1-pro-preview`, and other multimodal models.
   - View explicit constraints: Requests Per Minute (RPM), Requests Per Day (RPD), Tokens Per Minute (TPM), and Context Window caps (1M+ tokens).
2. **Interactive Token & Cost Calculator**:
   - Paste or type text, code, or document content to see instant token approximations and character-to-token ratios.
   - Select model and adjust simulated monthly volume (e.g., 500 requests/day at 1,200 input / 300 output tokens) to calculate total Free Tier feasibility vs. Paid Tier monthly bill.
3. **Live Gemini Playground with Token Telemetry**:
   - Submit real prompts to `gemini-3.8-flash` through a server-side endpoint.
   - Inspect actual returned response, exact prompt tokens, candidate tokens, total tokens, latency (ms), and cost attribution ($0.000000).
4. **Rate Limit Simulator & Safeguard Sandbox**:
   - Test client-side exponential backoff, retry logic, and request queue throttling to prevent `429 RESOURCE_EXHAUSTED` errors.

### Visual Identity & Theme

- **Aesthetic Direction**: High-density engineering console with clean dark slate canvas (`#090D16`), cool charcoal cards (`#111827`), subtle hairline borders (`border-slate-800`), and crisp high-contrast data typography.
- **Color Palette & Discipline (60-30-10)**:
  - 60% Canvas: Slate/Navy `#090D16` & `#0B0F19`
  - 30% Structural: Slate borders `#1E293B`, elevated surfaces `#131C2E`, muted slate text `#94A3B8`
  - 10% Accent: Vivid Indigo/Cyan `#38BDF8` & `#6366F1` for primary actions, Emerald `#10B981` for active quotas, Amber `#F59E0B` for approaching limits
- **Typography**: Clean sans (`Plus Jakarta Sans` / `Outfit`) for headers and controls, strictly paired with tabular figures (`font-mono tabular-nums`) for numeric quotas, token counts, and cost displays.
- **Zero-Pill Discipline**: Metadata displayed with clean inline separators (`·` or `/`), never surrounded by clunky pill badges.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Server-Side Gemini API Execution**:
  - *Chosen Approach*: Route playground and token-counting requests through an internal server middleware endpoint (`/api/gemini/generate`) with `GoogleGenAI` initialized on the server using `process.env.GEMINI_API_KEY`.
  - *Why*: Complies with security requirements (never exposing API keys to the browser) and ensures authentic token count metrics directly from the Google GenAI SDK.
- **Decision 2: Client-Side Heuristic Tokenizer + SDK Validation**:
  - *Chosen Approach*: Combine an instant client-side tokenizer heuristic (~4 chars/token with whitespace and code weighting) for instant feedback while typing, backed by server SDK validation upon generation.
  - *Why*: Zero typing lag with verified exact accuracy upon API execution.
- **Decision 3: Multi-Tab Workspace Architecture**:
  - *Chosen Approach*: A focused, tabbed workspace layout:
    1. *Quota Limits Matrix* (Free vs Paid tier constraints)
    2. *Interactive Token & Cost Estimator* (Real-time sliders & calculators)
    3. *Live Prompt Tester & Token Monitor* (Working execution with telemetry)
    4. *Rate-Limit & Best Practices Guide* (Error handling, caching, 429 backoff)

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Viewport                       │
│                                                             │
│  ┌────────────────────── Top Bar Contract ──────────────┐   │
│  │ Brand: QuotaStudio   Tabs: Limits · Calculator ·     │   │
│  │                            Playground · Best Practices│  │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────── Active Tab View ─────────────────┐   │
│  │  ┌───────────────────┐  ┌──────────────────────────┐ │   │
│  │  │ Model Selector &  │  │ Real-time Metrics:       │ │   │
│  │  │ Free/Paid Tiers   │  │ RPM / RPD / TPM / Cost   │ │   │
│  │  └───────────────────┘  └──────────────────────────┘ │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │ Interactive Inputs / Prompt Console / Sliders   │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │ Live Telemetry: Input Tokens · Output · $ Total │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────┘
                               │ POST /api/gemini/generate
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Vite Backend Middleware                     │
│                                                             │
│  - Reads GEMINI_API_KEY from process.env                    │
│  - Calls @google/genai SDK with model 'gemini-3.8-flash'    │
│  - Extracts response text & usageMetadata (token count)     │
│  - Returns { text, usageMetadata, latencyMs } to client     │
└─────────────────────────────────────────────────────────────┘
```

### Data Model & Quotas Reference

- **Model Tiers Database**:
  - `gemini-3.8-flash`: Free Tier (15 RPM, 1,500 RPD, 1M TPM, 1M Context). Paid Tier ($0.10/1M input, $0.40/1M output, 2,000 RPM, 4M TPM).
  - `gemini-3.1-pro-preview`: Free Tier (2 RPM, 50 RPD, 32K TPM). Paid Tier ($1.25/1M input, $5.00/1M output, 1,000 RPM, 2M TPM).
  - `gemini-3.1-flash-lite`: Free Tier (30 RPM, 1,500 RPD, 1M TPM). Paid Tier ($0.075/1M input, $0.30/1M output).
- **Playground History Store**:
  - Stores local prompt run logs with timestamps, input tokens, output tokens, latency in ms, and cumulative token usage for the active browser session.
