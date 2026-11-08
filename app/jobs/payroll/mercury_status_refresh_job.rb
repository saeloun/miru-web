# frozen_string_literal: true

module Payroll
  class MercuryStatusRefreshJob < ApplicationJob
    queue_as :default

    MAX_LEGS_PER_RUN = 100
    TRACKED_FOR = 90.days

    def perform
      PayrollMercuryConnection.where.not(verified_at: nil).find_each do |connection|
        next unless Entitlement.enabled?(connection.company_id) && connection.read_verified?

        trackable(connection).includes(:payroll_run).order(Arel.sql("last_checked_at ASC NULLS FIRST")).limit(MAX_LEGS_PER_RUN).each { |leg| refresh(leg) }
      end
    end

    private

      def trackable(connection)
        PayrollPaymentInstruction.open_slot.where(company_id: connection.company_id, submission_state: "accepted")
          .where(created_at: TRACKED_FOR.ago..)
          .where(transaction_status: [nil, "pending", "sent", "blocked"])
      end

      def refresh(leg)
        MercuryReconciliation.new(leg.payroll_run).refresh_from_job!(leg)
        leg.update!(last_error_code: nil) if %w[provider_status_unavailable status_refresh_failed].include?(leg.last_error_code)
      rescue MercuryPayment::Blocked => error
        leg.update!(last_error_code: error.codes.first, last_checked_at: Time.current)
      rescue StandardError => error
        report = PayrollProviders::Error.new("Mercury status refresh failed")
        report.set_backtrace(error.backtrace)
        Rails.error.report(report, handled: true, context: { company_id: leg.company_id,
          payroll_payment_instruction_id: leg.id, error_class: error.class.name })
        leg.update!(last_error_code: "status_refresh_failed", last_checked_at: Time.current)
      end
  end
end
