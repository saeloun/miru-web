# Event history

Super admins can browse business events at `/events`, grouped by request or Harvest import.
Payloads contain identifiers and enums; record attributes and credentials are omitted.

Events are stored synchronously in the same database transaction as the corresponding
record change. Rollbacks also remove their events. Storage uses a savepoint so a failed
event insert cannot abort the business operation. The viewer logs storage failures;
this history is best-effort observability, not a mandatory audit trail or delivery queue.

Prune old history with `bin/rails rails_event_viewer:cleanup` (the gem defaults to seven
days). This task is manual until a recurring schedule is configured.
