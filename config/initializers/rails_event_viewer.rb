# frozen_string_literal: true

RailsEventViewer.configure do |config|
  config.async = false
  config.transactional = false
  config.captured_events = [/\A(?:Clients|Companies|Expenses|Imports|Invitations|Invoices|Payments|Projects|TimesheetEntries|Users)::/]
  config.group_keys = [:user_id, :request_id, :data_import_id]
  config.authentication = ->(controller) { controller.current_user&.event_viewer? }
end
