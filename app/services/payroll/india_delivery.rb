# frozen_string_literal: true

module Payroll
  class IndiaDelivery
    STALE_AFTER = 15.minutes

    def initialize(delivery)
      @delivery = delivery
      @handoff = delivery.payroll_india_handoff
      @run = @handoff.payroll_run
    end

    def deliver
      raise ActiveRecord::ActiveRecordError, "Payroll delivery cannot run inside a transaction" if PayrollIndiaDelivery.connection.transaction_open?

      claimed = locked do
        if @delivery.state == "sending" && @delivery.started_at && @delivery.started_at <= STALE_AFTER.ago
          @delivery.update!(state: "uncertain", error_code: "interrupted")
        end
        next false unless @delivery.state == "queued" && permitted_to_send?

        @delivery.update!(state: "sending", started_at: Time.current, error_code: nil)
        @started_at = @delivery.started_at
        true
      end
      send_report if claimed
      @delivery
    end

    private

      def locked(&block)
        @run.with_lock { @handoff.with_lock { @delivery.with_lock(&block) } }
      end

      def permitted_to_send?
        reason = IndiaHandoff.new(@run).dispatch_blocker(@handoff)
        return true unless reason

        @delivery.update!(state: "failed", error_code: reason)
        false
      end

      def send_report
        begin
          mail = PayrollIndiaMailer.report(@delivery.id)
          message = mail.message
        rescue StandardError => error
          Rails.logger.warn({ event: "payroll_india_report_unavailable", run_id: @run.id,
            handoff_id: @handoff.id, delivery_id: @delivery.id, error_class: error.class.name }.to_json)
          record_outcome(state: "failed", error_code: "report_unavailable")
          return
        end
        unless message.perform_deliveries
          record_outcome(state: "failed", error_code: "delivery_disabled")
          return
        end
        message.raise_delivery_errors = true
        return unless locked { claimed? && permitted_to_send? }

        begin
          mail.deliver_now
        rescue Postmark::InactiveRecipientError
          record_outcome(state: "failed", error_code: "transport_rejected")
        rescue StandardError
          # SMTP status errors can follow DATA acceptance during QUIT; the exception has no phase.
          record_outcome(state: "uncertain", error_code: "transport_unknown")
        else
          record_outcome(state: "sent", sent_at: Time.current, error_code: nil)
        end
      end

      def claimed?
        @delivery.state == "sending" && @delivery.reviewed_at.nil? && @delivery.started_at == @started_at
      end

      def record_outcome(**attributes)
        locked { @delivery.update!(**attributes) if claimed? }
      end
  end
end
