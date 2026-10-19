# Spec Delta

## Purpose

The savings-measurement capability normalizes electricity bills so month-to-month comparisons are fair, gates the money narrative behind a configurable honesty threshold, and gives new businesses a manual baseline when no invoice history exists, so every owner sees savings numbers she can defend.

## ADDED Requirements

### Requirement: Bills are normalized to 31 days at write time
The system MUST compute and store `kwhNormalized31` for every accepted bill using the formula `(kwhConsumed / realDays) * 31`, where `realDays` is derived from the bill's start and end dates.

#### Scenario: 28-day bill is normalized
- **WHEN** a bill with `kwhConsumed = 1690` and `realDays = 28` is accepted
- **THEN** the system MUST store `kwhNormalized31` equal to `(1690 / 28) * 31`

#### Scenario: Raw values are preserved
- **WHEN** a bill is accepted
- **THEN** the raw `kwhConsumed`, `billingStartDate`, and `billingEndDate` MUST be preserved unchanged alongside the normalized value

### Requirement: Tariff is captured per bill
The system MUST store the `tariffSnapshot` (S/ per kWh) used to bill each period so downstream money calculations can isolate tariff changes from consumption changes.

#### Scenario: Tariff stored at registration
- **WHEN** a bill is accepted
- **THEN** the system MUST store the period's `tariffSnapshot` alongside the bill

### Requirement: Consumption chart shows raw kWh, never Soles
The system MUST display the consumption chart in raw `kWh` per period and MUST NOT show Soles values on the consumption chart.

#### Scenario: Chart axis is kWh
- **WHEN** a user views the consumption chart
- **THEN** the y-axis MUST be `kWh` and MUST NOT be Soles

### Requirement: Money view is gated by a configurable threshold
The system MUST show monetary savings in Soles and percentage only when real monetary savings are at least the configured `savingsMoneyThreshold`; below the threshold, the system MUST NOT show a Soles figure.

#### Scenario: Savings meet threshold
- **WHEN** real monetary savings are at least the configured threshold
- **THEN** the system MUST display the savings in Soles and as a percentage

#### Scenario: Savings below threshold
- **WHEN** real monetary savings are below the threshold (including negative because the tariff rise ate them)
- **THEN** the system MUST NOT display a Soles figure and MUST show the percentage of consumption saved instead

### Requirement: Below-threshold view includes an explanatory orange note
The system MUST show, when the money view is suppressed, a very visible orange note explaining that the tariff rise absorbed the money savings, and how much more the user would be losing in money terms without the ecoinnovation.

#### Scenario: Orange note explains the situation
- **WHEN** the money view is suppressed for a period
- **THEN** the system MUST show an orange note stating that the tariff rise absorbed the money savings

#### Scenario: Counterfactual is shown
- **WHEN** the money view is suppressed for a period
- **THEN** the system MUST include a counterfactual estimate of how much more the user would be losing in money terms without the ecoinnovation

### Requirement: Season is tagged but not used to correct savings
The system MUST tag each period with a `season` value for visualization and MUST NOT apply any seasonal correction to the savings number.

#### Scenario: Summer period is tagged
- **WHEN** a bill's billing month falls within a defined summer range
- **THEN** the system MUST tag the period with `season: "summer"`

#### Scenario: Savings ignore season
- **WHEN** a savings number is computed
- **THEN** the calculation MUST NOT use the `season` tag as a correction factor

### Requirement: Manual baseline is offered to new businesses
The system MUST allow a business to start an ecoinnovation even when it has no previous invoices, and MUST support a manual baseline built from the business's own electricity-meter readings.

#### Scenario: Ecoinnovation starts without invoices
- **WHEN** a business with no previous invoices selects an ecoinnovation
- **THEN** the system MUST allow the plan to be created with `baselineMethod: "manual_measurement"`

#### Scenario: Manual baseline is stored
- **WHEN** a manual baseline reading is uploaded for an action plan
- **THEN** the system MUST store it with `planId`, `measurementDate`, and `meterReading`, and MUST enforce uniqueness per `(planId, measurementDate)`

### Requirement: Manual baseline requires at least 5 operational day readings
The system MUST mark the manual baseline step as completable only when the plan has at least 5 complete measurements from operational business days.

#### Scenario: Insufficient measurements block completion
- **WHEN** a plan requires manual measurements and fewer than 5 complete operational-day measurements are stored
- **THEN** the system MUST NOT allow the manual measurement step to be marked completed

#### Scenario: Sufficient measurements allow completion
- **WHEN** a plan requires manual measurements and at least 5 complete operational-day measurements are stored
- **THEN** the system MUST allow the manual measurement step to be marked completed
