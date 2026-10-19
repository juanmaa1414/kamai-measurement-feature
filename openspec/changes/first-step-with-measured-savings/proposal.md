# Proposal

## Why

Kamai can show a catalog of 40+ ecoinnovations and store the bills that each business uploads, but it cannot tell an owner where to start or show her how much she actually saved. Owners like Inés are picking the first ecoinnovation the system surfaces, getting stuck on high-investment, high-complexity choices that don't match their quarter's budget and time, and seeing misleading savings numbers that bake in period length and tariff changes. We need a **first step with measured savings** capability that recommends a first ecoinnovation with a clear reason, and reports the savings honestly.

## What Changes

- **Improved diagnostic** with an explicit capacity question (high-impact first vs seed steps first) that feeds the ranking.
- **Single persisted ranking** per business, consumed by all four recommendation surfaces (home, catalog, staged diagnostic, welcome email) — no more per-surface overrides.
- **Honest savings measurement**: bills are normalized to 31-day months at write time; the money view is gated by a configurable threshold; seasonal effects are visualized but not corrected.
- **Stalled-plan recovery** with two cases: invested (badge + email, no new recommendation) and never-started (recompute recommendation, offer one-click swap).
- **Manual baseline** for new businesses with no invoice history.
- **Cross-business data** always anonymized, averages gated by `n >= 6`, qualitative copy below the threshold.
- The IA provider is used only for sub-task personalization now; the ranking, savings math, aggregation, and failure handling are rules.

Out of scope (deferred to a later phase): the conversational dashboard assistant, the fuller implementation of failure detection and alerting.

## Capabilities

### New Capabilities

- `recommendation`: improved diagnostic with a capacity question, single persisted ranking, four recommendation surfaces consuming that one ranking, recovery path for never-started plans.
- `savings-measurement`: 31-day normalization, tariff-aware money view gated by a configurable threshold, manual baseline for new businesses.
- `plan-recovery`: dashboard badge and email cadence for stalled plans, distinguishing invested (Case A) and never-started (Case B) with appropriate follow-up.
- `cross-business-data`: anonymization, `n >= 6` aggregation threshold, qualitative copy template for small samples.

### Modified Capabilities

None — this is a greenfield change with no existing capabilities to modify.

## Impact

- **API (Node.js + Nest.js)**: new endpoints for manual measurements, ranking recomputation, stalled-plan queries, and cross-business aggregates. The existing `/user-bill` endpoint computes and stores `realDays`, `kwhNormalized31`, and `tariffSnapshot` on write.
- **Data (MongoDB)**: new fields on `user-bill`, `action-plan`, `diagnostic-answer`; new collections for `ranking`, `manual-measurement`, `recommendation-recompute`, `notification-registry`, and `cross-business-aggregate`.
- **Catalog**: add `estimatedDaysReady: number` per ecoinnovation.
- **External services**: IA provider receives user context on sub-task calls. Mailchimp replaces the existing internal messaging service for outbound user emails. SNS+SQS for async work. AWS ECS for deployment.
- **Frontend (React + Vite)**: dashboard badge for stalled plans, consumption chart with normalized view and seasonal coloring, money-savings gating with an orange note, plan-swap confirmation flow.
