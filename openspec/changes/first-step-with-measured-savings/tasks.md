# Tasks

## 1. Data model and configuration

- [ ] 1.1 Add fields to the user-bill schema (`realDays`, `kwhNormalized31`, `tariffSnapshot`) and verify a sample write populates them
- [ ] 1.2 Add `lastActivityAt` to action plans and `estimatedDaysReady` to the catalog, and verify both are written by the corresponding endpoints
- [ ] 1.3 Create the new collections (`ranking`, `manual-measurement`, `recommendation-recompute`, `notification-registry`, `cross-business-aggregate`) and verify the indexes are present
- [ ] 1.4 Add the new diagnostic answer enum and verify it round-trips through the existing answer storage
- [ ] 1.5 Add the application configuration entries (`savingsMoneyThreshold`, Case B threshold, summer range) and verify they are read at startup

## 2. Bill normalization and savings math

- [ ] 2.1 Implement write-time 31-day normalization on `/user-bill` and verify the formula matches the spec with a unit test using Inés's February bill (1690 kWh, 28 days)
- [ ] 2.2 Implement the savings calculation service (percentage on `kwhNormalized31`, money on `kwhNormalized31` × `tariffSnapshot`) and verify the WHEN/THEN scenarios from `specs/savings-measurement/spec.md`

## 3. Consumption chart and money view gating

- [ ] 3.1 Render the consumption chart in raw kWh on the y-axis with season coloring, and verify visually with February (28 days) and a summer month
- [ ] 3.2 Implement the money view gating (threshold + orange note + counterfactual) and verify with a unit test where the threshold is 5% and savings are 3%

## 4. Manual baseline for new businesses

- [ ] 4.1 Add the manual measurement endpoint with uniqueness per `(planId, measurementDate)` and verify a duplicate insert is rejected
- [ ] 4.2 Enforce the 5-reading minimum on the manual measurement step and verify the step cannot be completed with fewer than 5 readings

## 5. Improved diagnostic and ranking

- [ ] 5.1 Add the capacity question to the diagnostic and verify both answers are accepted and stored as `high_impact_first` or `seed_steps_first`
- [ ] 5.2 Implement the ranking service (single writer, deterministic over diagnostic + catalog + capacity) and verify a backfill computes the persisted ranking for a sample business
- [ ] 5.3 Wire ranking invalidation to diagnostic and catalog change events and verify a diagnostic update triggers a recomputation
- [ ] 5.4 Implement reapply-ranking for never-started plans and verify it returns the new top without persisting anything

## 6. Recommendation surfaces

- [ ] 6.1 Make home, catalog, and staged diagnostic read the persisted ranking and verify all three render the same order for the same business
- [ ] 6.2 Update the welcome email to use the top three of the persisted ranking and verify with a snapshot test of the rendered email
- [ ] 6.3 Show the explicit "complete the diagnostic" message on every surface when no diagnostic exists and verify with a fresh-business test

## 7. Plan recovery

- [ ] 7.1 Derive Case A and Case B from steps and `lastActivityAt` and verify with a unit test using Inés's case (plan `in_progress` for 7 weeks, all steps `not_started`)
- [ ] 7.2 Implement the Case A badge and the no-repeat email with the per-plan per-channel registry and verify with a registry lookup
- [ ] 7.3 Implement Case B (recompute top, offer swap if different, no swap if same) and verify with the spec's WHEN/THEN scenarios
- [ ] 7.4 Suppress alternative ecoinnovation proposals while a plan is in Case A and verify the home page for a Case A business

## 8. Cross-business data

- [ ] 8.1 Implement the anonymization helper at the data boundary and verify with a unit test that strips `businessId`, `ownerName`, and `email`
- [ ] 8.2 Implement the `n >= 6` gate and the qualitative copy fallback and verify both branches with unit tests

## 9. Mailchimp and async infrastructure

- [ ] 9.1 Replace the existing internal messaging service with Mailchimp for outbound user emails and verify the send path returns 200 on a successful send
- [ ] 9.2 Configure SNS+SQS for the recomputation triggers and verify an SQS message is produced when a diagnostic changes

## 10. End-to-end suite

- [ ] 10.1 Add an e2e test that walks Inés from a fresh plan selection through Case B recovery and verifies the dashboard badge and the email content
- [ ] 10.2 Add an e2e test for the savings view across a tariff rise and verify the orange note and the counterfactual appear

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
- Verify the archived result with `openspec validate`.
