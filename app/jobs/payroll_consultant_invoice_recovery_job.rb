# frozen_string_literal: true

class PayrollConsultantInvoiceRecoveryJob < ApplicationJob
  queue_as :default
  BATCH_SIZE = 100
  RETRY_AFTER = 5.minutes

  def perform
    preparations = due_preparations.order(Arel.sql("COALESCE(next_attempt_at, created_at), id")).limit(BATCH_SIZE).to_a
    deliveries = due_deliveries.order(:updated_at, :id).limit(BATCH_SIZE).to_a
    candidates = preparations.map { |row| [row.next_attempt_at || row.created_at, "preparation", row] } +
      deliveries.map { |row| [row.updated_at, "delivery", row] }
    candidates.sort_by { |at, kind, row| [at, kind, row.id] }.first(BATCH_SIZE).each { |_, kind, row| recover(kind, row) }
  end

  private

    def due_preparations
      scope = PayrollInvoicePreparation.heads.where(reviewed: true)
        .where("next_attempt_at IS NULL OR next_attempt_at <= ?", Time.current)
        .where(<<~SQL.squish)
          NOT EXISTS (SELECT 1 FROM payroll_consultant_invoices
            WHERE payroll_consultant_invoices.company_id = payroll_invoice_preparations.company_id
              AND payroll_consultant_invoices.payroll_run_id = payroll_invoice_preparations.payroll_run_id
              AND payroll_consultant_invoices.employment_id = payroll_invoice_preparations.employment_id)
        SQL
      scope.where(state: %w[waiting_credit blocked queued]).or(
        scope.where(state: "generating").where("started_at IS NULL OR started_at <= ?", Payroll::ConsultantInvoiceIssue::STALE_AFTER.ago)
      )
    end

    def due_deliveries
      scope = PayrollConsultantInvoiceDelivery.where("updated_at <= ?", RETRY_AFTER.ago)
      scope.where(state: "queued").or(
        scope.where(state: "sending").where("started_at IS NULL OR started_at <= ?", Payroll::ConsultantInvoiceDelivery::STALE_AFTER.ago)
      )
    end

    def recover(kind, row)
      args = row.with_lock do
        scope = kind == "preparation" ? due_preparations : due_deliveries
        next unless scope.where(id: row.id).exists?

        if kind == "preparation"
          row.update!(next_attempt_at: RETRY_AFTER.from_now)
          [row.payroll_run_id, row.employment_id]
        else
          if row.state == "sending"
            row.update!(state: "uncertain", claim_token: nil, error_code: "interrupted")
          else
            row.update!(updated_at: Time.current)
          end
          [row.id]
        end
      end
      return unless args

      job = kind == "preparation" ? PayrollConsultantInvoiceIssueJob : PayrollConsultantInvoiceDeliveryJob
      job.enqueue_safely(*args)
    rescue StandardError => error
      Rails.logger.warn({ event: "consultant_invoice_recovery_failed", record_kind: kind, record_id: row.id, error_class: error.class.name }.to_json)
    end
end
