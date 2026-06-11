# frozen_string_literal: true

module QuickBooks
  module Exporters
    class Base
      def initialize(connection:, qbo_client: nil, sync_run: nil, source: :manual)
        @connection = connection
        @qbo_client = qbo_client || QuickBooks::Client.new(connection:)
        @sync_run = sync_run
        @source = source
        @owns_sync_run = sync_run.blank?
      end

      private

        attr_reader :connection, :qbo_client, :sync_run, :source, :owns_sync_run

        def with_sync_run(trigger:)
          run = nil
          run = owns_sync_run ? create_sync_run!(trigger) : sync_run
          start_sync_run!(run)

          result = yield(run)
          finish_sync_run!(run, :succeeded) if owns_sync_run

          result
        rescue StandardError => error
          finish_sync_run!(run, :failed, error:) if owns_sync_run && run.present?
          raise
        end

        def export_remote_record!(run:, record:, entity_type:, desired_payload:, update_payload:)
          reference = quickbooks_reference_for(record, entity_type)
          digest = payload_digest(desired_payload)

          return skip_duplicate_export!(run, reference) if duplicate_payload?(reference, digest)

          operation = reference.synced? ? "Update" : "Create"
          entity = write_remote_entity!(entity_type, operation, reference, desired_payload, update_payload)
          sync_reference!(reference, entity, digest)
          record_successful_export!(run, reference, entity_type, operation, digest)

          reference
        rescue StandardError => error
          handle_export_failure!(run, reference, record, entity_type, digest, error)
          raise
        end

        def duplicate_payload?(reference, digest)
          reference.synced? && reference.payload_digest == digest
        end

        def skip_duplicate_export!(run, reference)
          increment_summary!(run, "skipped")
          reference
        end

        def write_remote_entity!(entity_type, operation, reference, desired_payload, update_payload)
          response = qbo_client.post(
            entity_path(entity_type),
            operation == "Update" ? update_payload.call(reference) : desired_payload,
            operation == "Update" ? { operation: "update" } : {}
          )
          response.fetch(entity_type) do
            raise QuickBooks::Error, "QuickBooks #{entity_type} response was missing #{entity_type}"
          end
        end

        def sync_reference!(reference, entity, digest)
          reference.update!(
            company: connection.company,
            quickbooks_connection: connection,
            quickbooks_entity_id: entity.fetch("Id").to_s,
            quickbooks_sync_token: entity["SyncToken"].to_s.presence,
            last_synced_at: Time.current,
            direction: :miru_to_quickbooks,
            status: :synced,
            payload_digest: digest,
            last_error: nil
          )
        end

        def record_successful_export!(run, reference, entity_type, operation, digest)
          record_sync_event!(
            run:,
            entity_type:,
            entity_id: reference.quickbooks_entity_id,
            operation:,
            digest:,
            status: :processed
          )
          increment_summary!(run, operation.underscore)
        end

        def handle_export_failure!(run, reference, record, entity_type, digest, error)
          reference ||= quickbooks_reference_for(record, entity_type)
          mark_reference_failed!(reference, record, entity_type, digest, error)
          record_sync_event!(
            run:,
            entity_type:,
            entity_id: reference.quickbooks_entity_id,
            operation: "Export",
            digest: digest || failed_payload_digest(record, entity_type),
            status: :failed,
            error:
          )
          increment_summary!(run, "failed")
        end

        def quickbooks_reference_for(record, entity_type)
          QuickbooksReference.find_or_initialize_by(
            quickbooks_connection: connection,
            miru_record: record,
            quickbooks_entity_type: entity_type
          ).tap do |reference|
            reference.company = connection.company
            reference.quickbooks_connection = connection
            reference.quickbooks_entity_id ||= pending_entity_id(record, entity_type)
            reference.direction ||= :miru_to_quickbooks
            reference.status ||= :pending
          end
        end

        def create_sync_run!(trigger)
          QuickbooksSyncRun.create!(
            company: connection.company,
            quickbooks_connection: connection,
            direction: :miru_to_quickbooks,
            trigger:,
            status: :queued
          )
        end

        def start_sync_run!(run)
          return unless run.queued?

          run.update!(status: :running, started_at: Time.current)
        end

        def finish_sync_run!(run, status, error: nil)
          attrs = {
            status:,
            finished_at: Time.current
          }
          attrs[:error] = error.message if error.present?
          run.update!(attrs)
          connection.update!(last_successful_sync_at: Time.current) if status == :succeeded
        end

        def record_sync_event!(run:, entity_type:, entity_id:, operation:, digest:, status:, error: nil)
          QuickbooksSyncEvent.create!(
            company: connection.company,
            quickbooks_connection: connection,
            quickbooks_sync_run: run,
            source:,
            quickbooks_entity_type: entity_type,
            quickbooks_entity_id: entity_id,
            operation:,
            payload_digest: digest,
            event_time: Time.current,
            status:,
            error: error&.message
          )
        end

        def mark_reference_failed!(reference, record, entity_type, digest, error)
          reference.assign_attributes(
            company: connection.company,
            quickbooks_connection: connection,
            quickbooks_entity_id: reference.quickbooks_entity_id.presence || pending_entity_id(record, entity_type),
            direction: :miru_to_quickbooks,
            status: :failed,
            payload_digest: digest,
            last_error: error.message
          )
          reference.save!
        end

        def increment_summary!(run, key)
          summary = run.summary || {}
          summary[key] = summary.fetch(key, 0) + 1
          run.update!(summary:)
        end

        def entity_path(entity_type)
          "/v3/company/#{connection.realm_id}/#{entity_type.underscore}"
        end

        def pending_entity_id(record, entity_type)
          "pending-#{entity_type}-#{record.id}"
        end

        def payload_digest(payload)
          Digest::SHA256.hexdigest(canonical_json(payload))
        end

        def failed_payload_digest(record, entity_type)
          payload_digest({ "record" => "#{record.class.name}:#{record.id}", "entity" => entity_type })
        end

        def canonical_json(value)
          case value
          when Hash
            sorted = value.keys.sort.each_with_object({}) do |key, memo|
              memo[key.to_s] = JSON.parse(canonical_json(value[key]))
            end
            JSON.generate(sorted)
          when Array
            JSON.generate(value.map { |nested| JSON.parse(canonical_json(nested)) })
          else
            JSON.generate(value)
          end
        end
    end
  end
end
