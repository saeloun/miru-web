# frozen_string_literal: true

module Payroll
  class IndiaHandoffReview
    def initialize(run, actor)
      @run, @actor = run, actor
      @policy = PayrollRunPolicy.new(actor, run)
    end

    def call
      raise Workflow::NotAuthorized unless @policy.india_handoffs?

      @run.with_lock do
        @head = @run.current_revision
        { revision_digest: @head&.digest, run_status: Workflow.new(@run).status,
          permissions: { manage: @policy.manage_india_handoffs?, record_credit: @policy.record_india_credit? },
          consultants: consultants }
      end
    end

    private

      def consultants
        lines = @head&.payroll_payload&.fetch("lines", []) || []
        history = PayrollIndiaHandoff.where(payroll_run_id: @run.id).order(:id).group_by(&:employment_id)
        ids = (lines.pluck("employment_id") + history.keys).uniq
        @run.company.employments.where(id: ids).includes(:user).filter_map do |employment|
          employment_id = employment.id
          terms = ConsultantCompensation.where(employment_id:, effective_on: ..@run.period)
            .order(effective_on: :desc, id: :desc).first
          next unless terms&.payment_source == "india" || history.key?(employment_id)

          preview = IndiaHandoff.new(@run).preview(employment_id:)
          line = lines.find { |entry| entry["employment_id"] == employment_id }
          { employment_id: employment_id.to_s, payee_name: employment.user.full_name,
            entitlement_minor: line&.dig("amounts", "net_minor")&.to_s, blockers: preview.fetch(:blockers),
            preview: preview[:report] && report_detail(preview[:report]),
            handoffs: history.fetch(employment_id, []).map { |handoff| handoff_detail(handoff) } }
        end
      end

      def report_detail(report)
        bank = report.fetch("bank_details")
        { consultant_name: report["consultant_name"], period: report["period"], legal_entity: report["legal_entity"],
          recorded_hours: report["recorded_hours"], working_days: report["working_days"], monthly_fee: report["monthly_fee"],
          confirmed_unpaid_hours: report["confirmed_unpaid_hours"], leave_entries: report["leave_entries"],
          reimbursements: report["reimbursements"], amounts: report.dig("line", "amounts")&.transform_values(&:to_s),
          extras: report.dig("line", "extras"), deductions: report.dig("line", "deductions"),
          bank: { holder: bank["bank_account_name"], name: bank["bank_name"], account_mask: bank["bank_account_number"].to_s.last(4),
                  ifsc: bank["bank_ifsc"] } }
      end

      def handoff_detail(handoff)
        attempts = handoff.payroll_india_deliveries.order(:attempt_number).to_a
        latest = attempts.last
        active = handoff.released_at.nil?
        known_unsent = attempts.none? { |attempt| %w[sending sent uncertain].include?(attempt.state) }
        { id: handoff.id.to_s, status: handoff.status, accounts_email: handoff.report["accounts_email"],
          created_at: handoff.created_at.iso8601, credited_at: handoff.fully_credited_at&.iso8601,
          entitlement_minor: handoff.entitlement_minor.to_s, credited_minor: handoff.credited_minor.to_s,
          settlement_blocked: handoff.settlement_blocked?,
          report: report_detail(handoff.report),
          attempts: attempts.map { |attempt| delivery_detail(attempt) },
          credits: handoff.payroll_india_credits.order(:id).map do |credit|
            { id: credit.id.to_s, amount_minor: credit.amount_minor.to_s, credited_on: credit.credited_on.iso8601,
              recorded_at: credit.created_at.iso8601 }
          end,
          actions: { retry: active && @policy.manage_india_handoffs? && latest&.state == "failed",
            void: active && @policy.manage_india_handoffs? && known_unsent && handoff.credited_minor.zero?,
            reconcile: active && @policy.record_india_credit? && latest&.state == "uncertain",
            record_credit: active && @policy.record_india_credit? && attempts.any? { |attempt| attempt.state == "sent" } } }
      end

      def delivery_detail(attempt)
        { attempt_number: attempt.attempt_number, state: attempt.state, error_code: attempt.error_code,
          created_at: attempt.created_at.iso8601, sent_at: attempt.sent_at&.iso8601, reviewed_at: attempt.reviewed_at&.iso8601 }
      end
  end
end
