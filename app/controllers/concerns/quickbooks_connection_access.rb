# frozen_string_literal: true

module QuickbooksConnectionAccess
  extend ActiveSupport::Concern

  private

    def active_quickbooks_connection
      @_active_quickbooks_connection ||= current_company.quickbooks_connections.active.find_by(
        environment: QuickBooks::Configuration.environment
      )
    end

    def quickbooks_sync_payload(record_type, record_id)
      {
        quickbooks: {
          sync: {
            status: "queued",
            recordType: record_type,
            recordId: record_id
          }
        }
      }
    end
end
