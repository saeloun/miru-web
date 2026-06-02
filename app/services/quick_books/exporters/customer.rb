# frozen_string_literal: true

module QuickBooks
  module Exporters
    class Customer < Base
      def export!(client, trigger: :manual)
        with_sync_run(trigger:) do |run|
          mapper = QuickBooks::Mappers::Customer.new
          desired_payload = mapper.payload(client)

          export_remote_record!(
            run:,
            record: client,
            entity_type: "Customer",
            desired_payload:,
            update_payload: ->(reference) { mapper.update_payload(client, reference) }
          )
        end
      end
    end
  end
end
