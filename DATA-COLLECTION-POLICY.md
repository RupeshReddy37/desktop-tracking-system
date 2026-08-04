# Data Collection and Retention Policy

This project tracks work activity metadata for operational dashboards and reports. It must be deployed with clear employee notice, access control, and retention limits.

## Allowed Data

The system may collect:

- employee identity needed for dashboard/reporting
- registered device hostname and OS
- active/idle/locked/offline status intervals
- foreground application name
- process name
- raw window title
- parsed document title where available from the window title
- per-minute input summary counts
- input timing summary values
- sync health metadata
- anomaly review flags and reviewer comments

## Prohibited Data

The system must not collect:

- typed text
- actual key values
- passwords
- screenshots
- clipboard contents
- browser history
- full file contents
- audio or video
- private message contents beyond what appears in a normal foreground window title

## Fake-Activity Detection Boundary

Anomaly detection is a review signal only. It must not be displayed as proof of misconduct.

Allowed anomaly evidence:

- keyboard event count
- mouse move/click count
- scroll count
- timing average and variance
- active application/process
- active window/document stability
- duration of suspicious pattern

Disallowed anomaly evidence:

- key names
- typed text
- screenshots
- clipboard content

## Role-Based Access

Dashboard/report access must follow scope:

- admin: permitted employees
- manager: managed employees
- team lead: assigned team members

Report access should be audited with username, report type, employee, and date range.

## Retention Defaults

Default retention:

- raw activity/window/system/input summaries: 180 days
- anomaly/review records: 365 days
- daily aggregate reports: longer-term reporting source

Retention may be shortened by policy or law. Longer retention requires business and legal approval.

## Employee Notice

Before production rollout, employees should be informed:

- what data is collected
- why it is collected
- who can view it
- how long it is retained
- how anomalies are reviewed
- how to ask questions or dispute incorrect records

## Operational Controls

Production must use:

- HTTPS
- JWT/Bearer protected dashboard/report APIs
- device token validation for sync
- role-based visibility
- request IDs in logs
- report access audit
- restricted database access
- protected backups

## Review Checklist

Before enabling this in production:

- confirm no screenshot capture exists
- confirm no keystroke content capture exists
- confirm browser history is not collected
- confirm raw events retention is configured
- confirm report access audit is enabled
- confirm managers/team leads cannot view out-of-scope employees
