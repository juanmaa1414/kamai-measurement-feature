# Design

## Context

Kamai already ships a React + Vite frontend, a Node.js + MongoDB API, an internal messaging service, an AI provider for sub-tasks, and a file store for bill photos. The product today recommends in four places with four different criteria, shows a misleading "savings" as the simple difference between two bills, and has no path to recover users whose first pick is too heavy. We are adding the **first step with measured savings** capability on top of this stack — see `proposal.md` for the motivation.

This document records the technical decisions for that capability: the data model additions, the algorithm shape, the integration points, and the failure modes we are explicitly leaving for a later phase.

## Goals / Non-Goals

**Goals**

- Single source of truth for ecoinnovation ordering, consumed by every recommendation surface.
- Honest savings math that survives period length and tariff changes.
- A recovery path for stalled plans that respects what the user has already invested.
- Anonymized, statistically honest cross-business signals.
- Stack-aligned implementation (React + Vite, Node.js + Nest.js, MongoDB, AWS ECS, SNS+SQS, Mailchimp).

**Non-Goals (this change)**

- A conversational dashboard assistant with RAG over user data.
- Full failure-detection and internal alerting implementation. The first-iteration proposals from `draft_decisions.md` are noted for future work but not specified here.
- Statistical baselines, regression, or models for cross-business averages — the threshold (`n >= 6`) is a deterministic gate.
- Recomputing historical rankings on a schedule; invalidation is event-driven (diagnostic change, catalog change).

## Decisions

### Single persisted ranking, one writer

The ranking is computed by a single Nest.js module (`RankingService`) and written to a `ranking` collection keyed by `businessId`. Every recommendation surface (home, catalog, staged diagnostic, welcome email) reads from that collection. There is no per-surface override.

**Alternatives considered**

- A materialized view recomputed by a cron job. Rejected: invalidation must be event-driven (diagnostic or catalog change), and a cron job would lag the user's actions.
- Per-surface ranking logic that shares a builder. Rejected: it is harder to enforce "no override" by convention than by a single read.

### Capacity preference in the diagnostic, not in the profile

The new capacity question lives in the diagnostic answer set, not in the business profile. The ranking already consumes the diagnostic; the profile is for stable identity and sector.

**Alternatives considered**

- Add the capacity preference to the business profile. Rejected: the profile is meant to be stable identity information, and the capacity preference is more like a diagnostic answer (a snapshot of intent at a moment in time) than identity.

### 31-day normalization at write time

When the API accepts a bill, it computes `kwhNormalized31` and stores it alongside the raw values. The raw values are preserved for transparency. The chart, the savings percentage, and the money view all read the normalized value.

**Alternatives considered**

- Normalize at read time. Rejected: every consumer would have to redo the math, and the rule is easy to forget.
- A different normalization (e.g., prorate to 30 days, or to the prior 12-month average). Rejected: the case study specifies 31 days, and 31 makes February stand out as the anomaly it actually is.

### Money view gated by `savingsMoneyThreshold`

The application reads `savingsMoneyThreshold` from configuration at startup. When real monetary savings meet the threshold, the system shows Soles; otherwise it shows consumption percentage with an orange note. The threshold is in code/config, not in the database, because it is a calibration knob, not a per-business value.

**Alternatives considered**

- Always show Soles. Rejected: this is the failure mode the case study calls out (Inés saw "S/ 117 saved" in February when per-day consumption had actually risen).
- Always show percentage. Rejected: when Soles are honest, they are the most useful number for a small business owner.

### Manual baseline with a 5-reading minimum

When a business has no previous invoices, the system allows a `manual_measurement` baseline with at least 5 operational day readings. The UI recommends 7+ when possible. The 5-reading minimum is fixed; it is not configurable.

**Alternatives considered**

- Wait for the first invoice. Rejected: a new business should not have to wait a full month to start measuring.
- Let the user mark a single day as representative. Rejected: a single day is too noisy.

### Stalled-plan case derived from steps, not from a timer alone

A plan is Case A (`investment already made`) when any step has a status other than `not_started`, regardless of how long it has been. A plan is Case B (`never started`) only when every step is `not_started` AND `lastActivityAt` is older than a configurable threshold (proposed default: 14 days).

**Alternatives considered**

- Use only a timer (e.g., "active for more than X days"). Rejected: a plan that is genuinely making progress should not be flagged.
- Use only step state. Rejected: a freshly created plan should not be flagged as stalled on day 1.

### Per-plan, per-channel notification registry

A `notification-registry` collection stores `(planId, channel, template, sentAt)` records. Both Case A and Case B send paths consult this registry before sending, so the no-repeat rule is enforced across both.

**Alternatives considered**

- Reuse the existing per-person, per-template messaging registry. Rejected: the per-person registry does not know about plans, so it would still allow repeat sends for different plans of the same business.

### Anonymization at the data boundary, not at render time

Before any data leaves the per-business storage boundary to feed an aggregate, a recommendation reason, or an exported view, the system strips `businessId`, `ownerName`, `email`, and other personal identifiers. Render-time anonymization is treated as a defense-in-depth check, not the primary line of defense.

**Alternatives considered**

- Anonymize only at render time. Rejected: any consumer that forgets to filter leaks the identifier.
- Hash identifiers into a stable opaque ID. Rejected: the privacy guarantee here is "never display names", not "support joins across anonymized businesses".

### Mailchimp for outbound email, SNS+SQS for async work

The existing internal messaging service is replaced by Mailchimp for outbound user emails. SNS+SQS handle async work (ranking recomputation, manual baseline ingest, aggregate refresh).

**Alternatives considered**

- Keep the existing internal messaging service. Rejected: the user has chosen Mailchimp; this is the user-level decision, not a technical one.
- Use only SQS (no SNS fan-out). Rejected: SNS+SQS gives us a topic for recomputation triggers and a queue for the work itself, which is the AWS-native pattern.

### Rules, not AI, for ranking and savings

The ranking is a deterministic function of the diagnostic answers, the catalog, and the capacity preference. The savings math is arithmetic on normalized values. The IA provider is used only for sub-task personalization, where the existing integration already exists.

**Alternatives considered**

- Use an LLM to rank. Rejected: the data is small and structured; an LLM would add cost and opacity without improving the ordering.
- Use an LLM to generate the savings explanation. Rejected: the explanation is short and rule-driven; an LLM is overkill.

## Risks / Trade-offs

- **[Risk] Stale `lastActivityAt` if step updates do not write it** → Mitigation: every step status change writes `lastActivityAt` in the same operation; the `ActionPlan` module owns this invariant.
- **[Risk] The Case B threshold (14 days) is too aggressive or too lenient for some businesses** → Mitigation: it is configurable per environment; product can tune without code change.
- **[Risk] A business with a real `in_progress` plan older than the threshold but genuinely making progress is misclassified as Case B** → Mitigation: the Case B classifier uses step state, not plan age, so progress on any step keeps the plan out of Case B.
- **[Risk] The `n >= 6` threshold hides useful signal for the first weeks of a new sector or country** → Mitigation: the qualitative copy template still surfaces the count and the range, so users see that there is some signal without seeing a number we cannot defend.
- **[Risk] Mailchimp replaces a service that already has a per-person, per-template registry** → Mitigation: the new `notification-registry` collection enforces the no-repeat rule across plans; Mailchimp's own dedup is a defense-in-depth check.
- **[Risk] 31-day normalization makes February an outlier for visual reasons** → Mitigation: the chart tags summer periods; if product wants a "winter" emphasis later, the season field is already there.

## Migration Plan

The application is treated as already deployed; there is no v1 to v2 migration. The plan to ship is:

1. Deploy the data model additions and write-time normalizations. New fields are nullable or default-valued; existing bills and plans are read with the old shape until updated.
2. Deploy the ranking service and a one-time backfill that computes the persisted ranking for every business with a completed diagnostic. Welcome email is gated on a non-null ranking for the first deploy; the explicit "complete the diagnostic" message covers the rest.
3. Enable the recovery surface (badge + email) per business. New notifications consult the registry; the first send is allowed.
4. Enable the orange-note and money-view gating. The threshold defaults to 5% in configuration.
5. Enable the cross-business aggregation endpoint. The first deploy returns the qualitative copy for every data point because `n < 6` is the typical state at launch.

There is no destructive change to the existing catalog, plans, or bills. The rollback is a feature flag in each module: the new endpoints can be turned off without affecting the legacy `/user-bill`, `/user-eco-card/:id`, or the four recommendation surfaces.

## Open Questions

- The Case B threshold default of 14 days is a guess; the product team should confirm after observing the first month of recovery traffic.
- The `savingsMoneyThreshold` default of 5% is a guess; it should be calibrated against the first batch of post-launch bills.
- The summer range used to tag `season` is currently a fixed calendar range. The product team should confirm the exact months for Peru and Bolivia before launch.
