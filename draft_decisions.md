# Draft Decisions

This document is the working draft of **"Primer paso con ahorro medido"**, Kamai's capability to recommend a first ecoinnovation and show the savings it produced, honestly.

The design centers on three improvements that together fix the failure mode Inés's case illustrates:

- An improved diagnostic that collects investment capacity, so the ranking stops recommending ALTA/ALTA to a business whose quarter fits BAJA/BAJA.
- An honest measurement that normalizes period length and gates the money narrative by a configurable threshold.
- Recovery paths for users whose plans stall, distinguishing between "investment already made" and "never started".

The sections below record the decisions taken on each.

## About registering brand new commerces

Brand-new businesses may not have previous invoices to establish a baseline, but delaying an ecoinnovation until the next invoice period can add unnecessary waiting time. When that delay would be significant, Kamai will use a short manual baseline built from the business's own electricity-meter readings before implementation. This provides a more relevant initial projection than relying only on similar businesses, while clearly treating five days as a minimum baseline rather than a definitive measurement.

- A business may select an ecoinnovation even when it has no previous invoices.
- The catalog stores `estimatedDaysReady`, representing the estimated number of days required for the ecoinnovation to become operational.
- When creating the action plan, Kamai compares the remaining days until the next invoice period with `estimatedDaysReady + 6`:
  - If waiting for the invoice period would take more than that threshold, the plan uses `baselineMethod: "manual_measurement"`.
  - Otherwise, the plan uses the regular invoice baseline.
- For `manual_measurement`, the plan includes a measurement step that can run in parallel with the implementation steps.
- The manual measurement step requires at least 5 complete measurements from operational business days before it can be marked as completed. The user may add more days; the UI recommends 7 or more days when possible.
- Every manual measurement upload must clearly state that readings must correspond to full days in which the business operated.

### Required data changes

- Business profile: add `hasAtLeastOneMonthOperating: boolean`.
- Ecoinnovation catalog: add `estimatedDaysReady: number`.
- Action plan: add:
  - `requestedAt: date`.
  - `baselineMethod: "invoice" | "manual_measurement"`.
  - `actualReadyDate: date`.
- Action plan steps: use the existing step schema and dynamically append a manual-measurement step when `baselineMethod` is `"manual_measurement"`.
- Manual measurements: add a collection or subdocument with:
  - `planId`.
  - `measurementDate: date`.
  - `meterReading: number`.
- Manual measurements must be unique per plan and date.
- Add an endpoint to create manual measurements for an action plan.
- The existing step-completion action, if present, must verify that at least 5 complete operational business-day measurements exist whenever the plan requires manual measurements.
- The minimum of 5 measurements is fixed and does not require a `manualMeasurementDays` field. Additional measurements remain allowed.

## About stalled plans

An active plan with no progress can be in one of two states, and the right response differs. The signal is the state of the plan's steps:

- **Case A — investment already made**: at least one step has a status other than `not_started`. The user has materially engaged.
- **Case B — not yet started**: every step remains `not_started`. Inés fits here: plan `in_progress` for seven weeks, zero steps moved.

### Case A — investment already made

Suggesting a different plan would undermine the invite to finish. The move is to care for what she started.

- A dashboard badge appears on the next session after the condition triggers, with a calm message about low progress and an invitation to finalize to capitalize on the investment.
- A single companion email goes out (no repeat within 14 days for the same plan), routed through the messaging service and respecting the per-person, per-template registry.
- The improved measurement system runs silently in the background. The user is not told the savings math changed; she just sees more honest numbers when she looks.
- Kamai does not propose a different ecoinnovation while a plan is in this state.

### Case B — plan chosen but never started

The original pick may simply have been wrong for her capacity; a fresh recommendation is fair.

- Kamai re-applies the (improved) recommendation logic to the answers the user already gave in her diagnostic. No new questionnaire.
- If the recomputed top recommendation is the same as the stalled plan, behavior falls back to Case A (low-progress badge + email).
- If the recomputed top recommendation is different, Kamai surfaces it on the dashboard with a short explanation and offers a one-click plan swap.
- A single email accompanies the change, mirroring Case A's frequency rule.

### Required data changes

- Action plan: add `lastActivityAt: date`, updated whenever any step status changes.
- Derive `caseA: boolean` from steps (true if any step status ≠ `not_started`).
- Derive `caseB: boolean` from steps (true if every step is `not_started` AND `lastActivityAt` is older than a configurable threshold; proposed default: 14 days).
- Notifications: add a per-plan, per-channel registry so the no-repeat rule holds across badges and emails.
- Recommendation cache: store the recomputed recommendation alongside the diagnostic answers so Case B can compare against the stalled plan without re-running the full logic on every dashboard load.

## About the improved diagnostic

The diagnostic is the input to the ranking. The current diagnostic returns section scores and a level (Inicial / Crecimiento / Consolidación / Expansión / Liderazgo) but does not capture the user's real capacity to execute: time, budget, or appetite for high-effort changes. That gap is why Inés's ranking recommended ALTA/ALTA despite her quarter fitting BAJA/BAJA.

The improved diagnostic adds an explicit capacity question. Working draft wording:

> ¿Consideras que puedes invertir un buen tiempo y recursos primero para ver un resultado de alto impacto? ¿O prefieres empezar en pasos semilla y afianzar tus ecoinnovaciones progresivamente?

The answer maps directly to a new ranking input:

- "Alto impacto primero" → weight the ranking toward ALTA complexity and investment.
- "Pasos semilla" → weight the ranking toward BAJA / MEDIA; surface the smallest viable first step.

The new question sits beside the existing section scores; the ranking combines both.

### Required data changes

- Diagnostic answers: add a new section or question capturing capacity preference, stored as an enum (e.g., `seed_steps_first` | `high_impact_first`).
- Ranking: consume the new capacity answer alongside the existing section scores and overall level.

## About the recommendation system

Kamai currently recommends ecoinnovations in four places using four different criteria: the home page groups by sector, the catalog orders by diagnostic answers plus complexity, the staged diagnostic applies rules and shows three, and the welcome email suggests three fixed ones. The result is that the same business sees different recommendations depending on where they look.

Decision: for every place, the order of ecoinnovations is strictly the one produced by the diagnostic's ranking system. One source, one order, no per-surface overrides.

- The ranking is persisted per business and is only invalidated when diagnostic answers or the catalog change.
- All four places consume that same ranking: none apply their own criterion on top.
- If the business has not yet completed the diagnostic, the places show an explicit message instead of falling back to default rules that would reintroduce inconsistency.
- The reason for each recommendation is stored alongside the ranking so any surface can explain "why" without recomputing.

### Required data changes

- Recommendation: new persistence of the ranking per business, with timestamp and reference to the catalog version and the diagnostic-answer snapshot that produced it.
- Each entry stores `reason: string` so all four places can explain "why" without recomputing.
- Invalidation: any change in diagnostic answers or in the catalog triggers a ranking recomputation.

## About measuring savings honestly

Three distortions matter when comparing bills across months: period length, tariff changes, and seasonality. Each is handled differently on purpose.

### Period length — normalize every month to 31 days

Bills come with different numbers of days (28, 29, 30, 31). Comparing a 28-day bill to a 31-day one is misleading: a "savings" can just be a shorter period. Every month is treated, by definition, as a 31-day month, and the normalization is applied at write time when the bill is registered in the database.

Formula:

    kwhNormalized31 = (kwhConsumed / realDays) * 31

- The raw `kwhConsumed` and `billingStartDate` / `billingEndDate` are preserved as-is for transparency.
- `kwhNormalized31` is stored alongside the bill so every later comparison is apples-to-apples without recomputing.

### Tariff — show kWh honestly, gate the money narrative

The tariff changes between periods (it rose 8% between January and June in Inés's bills). Hiding it would lie; overreacting to it would also lie. The consumption chart always shows raw `kWh` so the durable fact is visible; the money view is gated by a threshold.

- The consumption chart always displays raw `kWh` per period, never Soles. That is the durable fact.
- The money view follows a threshold held in the application's configuration (proposed value: 5%):
  - When real monetary savings are at least the threshold, show them directly in Soles and as a percentage.
  - When real monetary savings are below the threshold (or negative because the tariff rise ate them), do not show a misleading Soles figure. Show the percentage of consumption saved instead, with a very visible orange note explaining that the tariff rise absorbed the money savings, and how much more the user would be losing in money terms without the ecoinnovation.

### Season — visualize, do not correct

Seasonal effects (e.g., a hotter summer raising refrigeration load) are real but cannot be cleanly separated from behavior changes on the data we have. We do not apply any correction.

- The consumption chart marks summer months in a distinct color so the user can see the seasonal effect at a glance.
- Any savings number stays season-blind by design; we tell the user we cannot isolate seasonal noise, instead of pretending we can.

### Required data changes

- User bill: store `realDays: number` (derived from `billingEndDate - billingStartDate + 1`) and `kwhNormalized31: number` at write time.
- User bill: store `tariffSnapshot: number` (the S/ per kWh used for the period) for downstream money calculations.
- Savings calculation: operate on `kwhNormalized31` for the percentage view; operate on `kwhNormalized31` × each period's `tariffSnapshot` for the money view before applying the threshold.
- Application configuration: add `savingsMoneyThreshold: number` (proposed value: 5) read at startup, used to gate the money view described above.
- Consumption chart: tag each period with `season: "summer" | "winter" | "neutral"` from the billing month using a fixed calendar range, used only for coloring, never for correction.

## About handling failures (deferred)

These failure modes are recognized as real risks for the new capability and will need a unified internal alerting mechanism. The work is large enough to be deferred to a later phase and is not part of this implementation. They are listed here so they are not forgotten.

- IA provider unavailable or returning errors.
- Messaging service rejecting an email or timing out.
- Bill photo unreadable (validation fails).
- Bill edited or deleted after it was used in a savings calculation.

For each, the planned response is the same: the system detects the failure state, marks it on the relevant record, and sends an internal alert email so a team member can review. No user-facing changes are part of this implementation.

### First-iteration proposals

Minimal starting points for each failure mode. Enough to begin work in a first pass, not the complete design.

- **IA provider unavailable or returning errors**: on timeout or 5xx, the request is persisted with `status: "pending_retry"` and retried with exponential backoff (1s / 5s / 30s, max 3 attempts). On final failure, `status: "failed"` triggers the internal alert.
- **Messaging service rejecting an email or timing out**: on non-2xx or timeout, one immediate retry; on second failure, the send is marked failed in the per-person-per-template registry and the internal alert fires. The existing registry prevents re-sending to a known bad address.
- **Bill photo unreadable**: the upload endpoint returns a structured validation failure (size, format, OCR confidence below threshold). The bill stays in `pending_review`; the UI prompts the user to retake it. Failures are logged for ops review.
- **Bill edited or deleted after use in savings**: on update or delete, any savings record referencing that bill is flagged `stale`. On the next read, savings are recalculated against the current bill set, never double-counted.

## About using data from other businesses

Privacy and statistical honesty matter whenever a number comes from someone else's business.

- Names are never displayed; all data is anonymized regardless of modality (aggregated chart, recommendation reason, marketing copy, etc.).
- Averages are only computed and shown when at least 6 businesses contribute to the data point.
- When fewer than 6 businesses contribute, Kamai does not show a number. Instead, it surfaces qualitative copy in the format "x locales ya han podido mejorar entre x% y x% mejora en consumo".

### Required data changes

- Aggregation: enforce a minimum sample size of 6 businesses before publishing any aggregate; below the threshold, return the qualitative copy template instead.
- Anonymization: strip business identifiers before any aggregate leaves the per-business data boundary; the same rule applies to recommendation reasons and any exported view.

## About technologies

- Frontend: React with Vite (existing).
- Backend: Node.js with Nest.js.
- Deploy: AWS using ECS.
- Async messaging: SNS + SQS.
- Outbound email: Mailchimp.
- Testing: unit and integration tests in code, plus a separate end-to-end suite.

## About how much AI is needed

The PDF offers a spectrum from simple rules to LLMs. The position taken in this design is "use AI only where the task genuinely benefits from it; use rules everywhere else."

### Where AI is used

- **Sub-tasks endpoint** (now): the AI provider already generates sub-tasks for plan steps. The improvement is feeding it known user data — sector, country, level from the diagnostic, current plan state — so the sub-tasks are tailored to her context rather than generic. This is the only AI call inside the core "Primer paso con ahorro medido" capability.
- **Dashboard assistant** (later): a conversational helper for two question types — frequent questions about the platform, and questions about the user's current ecoinnovations and their status. RAG over the user's own plan, bills, and the catalog is the planned approach. Deferred to a later phase; out of scope for this implementation.

### Where AI is not used

- **Ranking**: rules over the diagnostic answers and the catalog. The data is small and structured; a model would add cost and opacity without improving the ordering.
- **Savings measurement**: arithmetic on `kwhNormalized31` and `tariffSnapshot`. No inference is needed; honest numbers come from honest math.
- **Cross-business aggregation**: counts and averages gated by the `n ≥ 6` rule. The privacy guarantee requires deterministic thresholds, not model output.
- **Failure detection**: explicit status flags and retry logic, not anomaly detection.

### Required data changes

- Sub-tasks endpoint: accept and pass through user context (sector, country, level, current plan state) so the AI provider can personalize output.
