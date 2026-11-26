# frozen_string_literal: true

module Analytics
  class PosthogSubscriber
    EVENTS = {
      "Users::SignedIn" => "user_signed_in",
      "Companies::Created" => "workspace_created",
      "Clients::Created" => "client_created",
      "Projects::Created" => "project_created",
      "TimesheetEntries::Created" => "time_entry_created",
      "Invoices::Created" => "invoice_created",
      "Invoices::Sent" => "invoice_sent",
      "Invoices::StatusChanged" => "invoice_status_changed",
      "Payments::Recorded" => "payment_recorded",
      "Invitations::Sent" => "invitation_sent",
      "Invitations::Accepted" => "invitation_accepted",
      "Expenses::Created" => "expense_created",
      "Imports::Completed" => "import_completed"
    }.freeze

    def emit(event)
      name = EVENTS[event[:name]]
      return unless name

      payload = event[:payload].to_h
      PosthogCaptureJob.capture(name, payload[:data], user_id: payload.dig(:actor, :id))
    end
  end
end
