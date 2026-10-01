# frozen_string_literal: true

require "rails_event_viewer/adapters/active_record"

class RailsEventViewer::TransactionalAdapter < RailsEventViewer::Adapters::ActiveRecord
  def write_events(events)
    RailsEventViewer::Entry.transaction(requires_new: true) { super }
  end

  def event_time_span(relation)
    row = build_scope(relation).reorder(nil).pick(Arel.sql("MIN(occurred_at)"), Arel.sql("MAX(occurred_at)"))
    row ? row.map { |value| parse_timestamp(value) } : [nil, nil]
  end
end

RailsEventViewer.configure do |config|
  config.async = false
  config.storage_adapter = RailsEventViewer::TransactionalAdapter
  config.captured_events = [/\A(?:Clients|Companies|Expenses|Imports|Invitations|Invoices|Payments|Projects|TimesheetEntries|Users)::/]
  config.group_keys = [:request_id, :data_import_id]
  config.authentication = ->(controller) { controller.current_user&.event_viewer? }
end
