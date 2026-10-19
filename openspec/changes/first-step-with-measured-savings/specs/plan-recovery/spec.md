# Spec Delta

## Purpose

The plan-recovery capability detects action plans that have stalled, distinguishes the two reasons a plan can be stalled (the user has already invested, or the user has not started at all), and applies the appropriate follow-up so a business that got stuck on a high-investment first pick is cared for rather than pushed toward a different plan.

## ADDED Requirements

### Requirement: Plan case is derived from step states
The system MUST classify every active plan as Case A, Case B, or neither, using the state of its steps and the time since the last step activity.

#### Scenario: Case A is detected
- **WHEN** an active plan has at least one step whose status is not `not_started`
- **THEN** the system MUST classify the plan as Case A

#### Scenario: Case B is detected
- **WHEN** an active plan has every step in `not_started` AND `lastActivityAt` is older than the configured Case B threshold
- **THEN** the system MUST classify the plan as Case B

#### Scenario: Active plan in progress is not classified
- **WHEN** an active plan has every step in `not_started` AND `lastActivityAt` is within the configured Case B threshold
- **THEN** the system MUST NOT classify the plan as Case A or Case B

### Requirement: Case A triggers a low-progress badge
The system MUST surface a dashboard badge on the next session after a plan is classified as Case A, with a calm message about low progress and an invitation to finalize to capitalize on the investment.

#### Scenario: Badge appears for Case A
- **WHEN** a plan is classified as Case A and the user opens the dashboard
- **THEN** the system MUST display a badge with a low-progress message and an invite to finalize

### Requirement: Case A triggers a single companion email
The system MUST send a single companion email when a plan is classified as Case A and MUST NOT send another email for the same plan within 14 days.

#### Scenario: First email is sent
- **WHEN** a plan is classified as Case A and no email has been sent for it in the last 14 days
- **THEN** the system MUST send a single companion email

#### Scenario: Repeat is suppressed
- **WHEN** a plan is still classified as Case A and an email was already sent for it within the last 14 days
- **THEN** the system MUST NOT send another email

### Requirement: Case A suppresses new ecoinnovation proposals
The system MUST NOT propose a different ecoinnovation while any plan for the business is classified as Case A.

#### Scenario: No alternative proposed
- **WHEN** a business has at least one plan in Case A
- **THEN** the recommendation surface MUST NOT offer an alternative ecoinnovation in place of the stalled plan

### Requirement: Case B reapplies the ranking
The system MUST reapply the ranking to the business's existing diagnostic answers and surface the new top recommendation on the dashboard with a short explanation when a plan is classified as Case B.

#### Scenario: New top is offered when it differs
- **WHEN** a plan is classified as Case B and the recomputed top recommendation is different from the stalled plan
- **THEN** the system MUST surface the new top ecoinnovation on the dashboard with a short explanation and a one-click plan swap

#### Scenario: Stalled plan stays when top is unchanged
- **WHEN** a plan is classified as Case B and the recomputed top recommendation equals the stalled plan
- **THEN** the system MUST NOT offer a swap and MUST fall back to the Case A badge behavior

### Requirement: Case B sends a single email
The system MUST send a single email when a Case B plan is offered a new ecoinnovation and MUST NOT send another such email for the same plan within 14 days.

#### Scenario: First swap email is sent
- **WHEN** a Case B plan is offered a new ecoinnovation and no email has been sent for it in the last 14 days
- **THEN** the system MUST send a single email accompanying the offer

#### Scenario: Repeat is suppressed
- **WHEN** a Case B plan is offered a new ecoinnovation and an email was already sent for it within the last 14 days
- **THEN** the system MUST NOT send another email

### Requirement: Notifications honor a per-plan per-channel registry
The system MUST persist a per-plan, per-channel record of each notification sent, and MUST use it to enforce the no-repeat rule for both Case A and Case B emails.

#### Scenario: Notification registry records the send
- **WHEN** a notification is sent for a plan on a channel
- **THEN** the system MUST record the `planId`, `channel`, `template`, and `sentAt`

#### Scenario: Registry is consulted before sending
- **WHEN** a notification would be sent for a plan on a channel
- **THEN** the system MUST NOT send it if a record for the same `planId`, `channel`, and `template` exists within the no-repeat window
