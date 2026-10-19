# Spec Delta

## Purpose

The cross-business-data capability lets one business learn from others without ever exposing another business's identity, and never shows a sample-based number that isn't statistically honest.

## ADDED Requirements

### Requirement: Business identities are never displayed
The system MUST NOT display another business's name or any other personal identifier in any surface, recommendation reason, aggregate, or copy, and MUST strip business identifiers from any data that crosses the per-business data boundary.

#### Scenario: Names are absent from aggregates
- **WHEN** an aggregate is rendered for a user
- **THEN** the aggregate MUST NOT include the name of any contributing business

#### Scenario: Identifiers are stripped at the boundary
- **WHEN** data leaves the per-business storage boundary to feed an aggregate, a recommendation reason, or an exported view
- **THEN** the system MUST remove `businessId`, `ownerName`, `email`, and any other personal identifier from the data

### Requirement: Aggregates require a minimum sample size of 6
The system MUST publish any aggregate (average, median, percentage) only when at least 6 distinct businesses contribute to the data point.

#### Scenario: Aggregate with sufficient sample
- **WHEN** an aggregate is requested and at least 6 distinct businesses contribute
- **THEN** the system MUST return the aggregate value

#### Scenario: Aggregate with insufficient sample
- **WHEN** an aggregate is requested and fewer than 6 distinct businesses contribute
- **THEN** the system MUST NOT return an aggregate value and MUST return the qualitative copy template instead

### Requirement: Below the threshold, qualitative copy is shown
The system MUST show qualitative copy in the format "x locales ya han podido mejorar entre x% y x% mejora en consumo" when an aggregate is suppressed for sample size.

#### Scenario: Qualitative copy replaces the number
- **WHEN** an aggregate is suppressed for sample size
- **THEN** the system MUST render the qualitative copy template with the count of contributing businesses and the observed range

### Requirement: Anonymization applies to recommendation reasons
The system MUST NOT include any business identifier in a stored `reason` string on the ranking, and MUST NOT include any business identifier in any recommendation reason rendered to a user.

#### Scenario: Reason strings are free of identifiers
- **WHEN** a `reason` is generated and stored alongside a ranking position
- **THEN** the `reason` MUST NOT contain any business identifier

### Requirement: Anonymization applies to exports
The system MUST remove business identifiers from any view, export, or report derived from cross-business data before the data is delivered to a user or an ally.

#### Scenario: Exports strip identifiers
- **WHEN** a cross-business export is generated for a user or an ally
- **THEN** the export MUST NOT contain business identifiers and MUST apply the `n >= 6` rule per data point
