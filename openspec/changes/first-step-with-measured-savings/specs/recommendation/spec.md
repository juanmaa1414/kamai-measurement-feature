# Spec Delta

## Purpose

The recommendation capability turns a business's diagnostic answers, including the new capacity preference, into a single persisted ranking of ecoinnovations that every recommendation surface in the product consumes, so the same business sees the same ecoinnovation in the same place in every list.

## ADDED Requirements

### Requirement: Improved diagnostic captures capacity preference
The system MUST include in the diagnostic a capacity question with two valid answers, asking whether the business prefers high-impact first or seed steps first.

#### Scenario: User selects high-impact first
- **WHEN** the user selects the "high-impact first" answer
- **THEN** the system MUST store the answer as `high_impact_first` in the diagnostic answers

#### Scenario: User selects seed steps first
- **WHEN** the user selects the "seed steps first" answer
- **THEN** the system MUST store the answer as `seed_steps_first` in the diagnostic answers

### Requirement: Ranking combines level, section scores, and capacity preference
The system MUST compute a single ranked list of ecoinnovations per business using the diagnostic overall level, the section scores, and the capacity preference.

#### Scenario: Seed preference steers ranking toward lighter interventions
- **WHEN** a business with `seed_steps_first` capacity preference has multiple applicable ecoinnovations
- **THEN** ecoinnovations marked BAJA or MEDIA for investment and complexity MUST appear above ALTA ones in the ranking

#### Scenario: High-impact preference does not artificially demote ALTA
- **WHEN** a business with `high_impact_first` capacity preference has multiple applicable ecoinnovations
- **THEN** the ranking MUST NOT push ALTA ecoinnovations below BAJA ones solely because of the preference

### Requirement: Ranking is persisted per business with reason and version
The system MUST persist the ranking per business with a timestamp, the catalog version that produced it, the diagnostic-answer snapshot that produced it, and a per-position reason string.

#### Scenario: Ranking is stored
- **WHEN** a ranking is computed for a business
- **THEN** the system MUST store it with `createdAt`, `catalogVersion`, `diagnosticSnapshot`, and a `reason` string for every position

#### Scenario: Reasons are read without recomputation
- **WHEN** any surface reads the ranking to display a recommendation
- **THEN** the system MUST return the stored `reason` for each position without rerunning the ranking logic

### Requirement: All recommendation surfaces consume the same ranking
The system MUST display ecoinnovations in every recommendation surface in the order produced by the persisted ranking, with no per-surface override.

#### Scenario: Home page shows the persisted order
- **WHEN** the home page renders the recommendation list for a business
- **THEN** the order MUST match the persisted ranking exactly

#### Scenario: Catalog shows the persisted order
- **WHEN** the catalog renders the recommendation list for a business
- **THEN** the order MUST match the persisted ranking exactly

#### Scenario: Staged diagnostic shows the persisted order
- **WHEN** the staged diagnostic displays ecoinnovations for a business
- **THEN** the order MUST match the persisted ranking exactly

#### Scenario: Welcome email uses the persisted order
- **WHEN** the welcome email is generated for a business that has completed the diagnostic
- **THEN** the ecoinnovations shown MUST be the top three of the persisted ranking

### Requirement: No diagnostic triggers an explicit message
The system MUST show an explicit "complete the diagnostic to see recommendations" message in every recommendation surface when the business has not completed the diagnostic, instead of falling back to default rules.

#### Scenario: Home page with no diagnostic
- **WHEN** a business with no diagnostic answers opens the home page
- **THEN** the recommendation area MUST show the explicit message and MUST NOT show a default ranking

#### Scenario: Welcome email with no diagnostic
- **WHEN** the welcome email is generated for a business with no diagnostic answers
- **THEN** the email MUST include the explicit message in place of ecoinnovation recommendations

### Requirement: Ranking invalidates on diagnostic or catalog change
The system MUST recompute and replace the persisted ranking whenever the business's diagnostic answers change or a relevant catalog field changes.

#### Scenario: Diagnostic answers updated
- **WHEN** a business updates any diagnostic answer
- **THEN** the system MUST recompute the ranking using the new answers and replace the previous ranking

#### Scenario: Catalog field updated
- **WHEN** an ecoinnovation in the catalog has its `complexity`, `investment`, or `category` changed
- **THEN** the system MUST recompute the ranking for every affected business

### Requirement: Ranking can be reapplied to existing answers
The system MUST be able to reapply the ranking logic to a business's existing diagnostic answers without requiring a new questionnaire, and return the top recommendation without persisting anything.

#### Scenario: Reapply returns the new top
- **WHEN** the system reapplies the ranking for a business with completed diagnostic answers
- **THEN** it MUST return the new top ecoinnovation and MUST NOT modify the persisted ranking
