# Analytics Module

## Overview

Miru analytics provides predictive and operational reporting for revenue, team productivity, client performance, and expense trends.

## Report Types

- `revenue_forecast`
- `team_productivity`
- `client_analysis`
- `expense_trends`

## Endpoints

### Analytics Data

- `GET /internal_api/v1/analytics/revenue_forecast`
- `GET /internal_api/v1/analytics/comparison`
- `GET /internal_api/v1/analytics/team_productivity`
- `GET /internal_api/v1/analytics/client_analysis`
- `GET /internal_api/v1/analytics/expense_trends`

### Exports

- `GET /internal_api/v1/analytics/exports/:report_type.csv`
- `GET /internal_api/v1/analytics/exports/:report_type.pdf`

### Saved Reports

- `GET /internal_api/v1/analytics/reports`
- `POST /internal_api/v1/analytics/reports`
- `GET /internal_api/v1/analytics/reports/:id`
- `DELETE /internal_api/v1/analytics/reports/:id`

## Filters

- `preset`
- `from`
- `to`
- `members`
- `clients`
- `projects`
- `horizon`

Internal API filters map to `user_ids`, `client_ids`, and `project_ids` where needed.

## Access Model

- `owner` / `admin`: full company analytics
- `book_keeper`: financial analytics
- `manager`: scoped analytics based on existing project/client memberships
- `employee`: self-only team analytics
- `client`: no analytics access

### Manager Scope Assumption

The current repo does not have a dedicated reporting hierarchy schema. To stay minimal and repo-consistent, manager scope is derived from existing membership tables:

- managed projects: projects where the manager is a `project_member`
- managed clients: clients linked to those projects, plus direct `client_members`
- managed users: users assigned to those managed projects

## Features

- analytics dashboard
- revenue forecast chart
- team analytics page with periodic refresh
- client insights with client revenue heatmap
- expense trends with layered chart and anomaly highlighting
- CSV / PDF export
- saved reports with workspace-only visibility
- invoice client analytics summary
- reports integration links
- audit logging
- threshold-based email notifications
- lightweight insights and recommendations

## Notifications

Threshold alerts are generated from existing analytics services and emailed to `owner`, `admin`, and `book_keeper` users.

Current deterministic rules:

- utilization below `60%`
- collected revenue below `70%` of previous period
- expense anomalies present

Threshold notifications run once per week. Duplicate notifications are suppressed for one week per company and alert type.

## Audit Logging

Analytics usage is tracked with Ahoy-style events for:

- analytics page views
- saved analytics report opens

Tracked metadata includes user, company, page/report type, and timestamps.

## Performance Notes

- analytics queries use SQL aggregation where practical
- dedicated indexes exist for invoices, payments, timesheet entries, invoice line items, and expenses
- analytics payloads are cached through `Analytics::QueryService` and `Analytics::CacheStore`
- cached saved reports can be refreshed in the background

## Mobile Behavior

- KPI cards stack on small screens
- charts reduce visible series or months on mobile to avoid overcrowding
- client insights include a horizontally scrollable heatmap-style grid
- expense trends reduce visible series on mobile and preserve anomaly highlighting
