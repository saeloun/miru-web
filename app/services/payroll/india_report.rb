# frozen_string_literal: true

module Payroll
  class IndiaReport
    BANK_FIELDS = %w[bank_account_name bank_name bank_account_number bank_ifsc].freeze

    def self.bank_details(employment)
      (employment.employee_record&.private_details || {}).slice(*BANK_FIELDS)
    end

    def self.bank_complete?(details)
      BANK_FIELDS.all? { |field| details[field].is_a?(String) && details[field].strip.length.between?(1, 200) } &&
        details["bank_account_number"].match?(/\A\d{1,34}\z/) && details["bank_ifsc"].match?(/\A[A-Z]{4}0[A-Z0-9]{6}\z/)
    end

    def initialize(run, employment:, line:, terms:)
      @run, @employment, @line, @terms = run, employment, line, terms
    end

    def call
      minutes = @line.fetch("source_snapshot").fetch("work_entries").sum { |entry| BigDecimal(entry.fetch("duration_minutes")) }
      {
        "accounts_email" => nil, "consultant_name" => @employment.user.full_name, "period" => @run.period.strftime("%Y-%m"),
        "legal_entity" => @terms.legal_entity_name, "recorded_hours" => (minutes / 60).round(4).to_s("F"),
        "working_days" => (minutes / 480).round(4).to_s("F"), "leave_entries" => @line.dig("source_snapshot", "timeoff_entries"),
        "monthly_fee" => @terms.monthly_fee.to_s("F"),
        "confirmed_unpaid_hours" => @line.dig("preparation", "confirmed_unpaid_hours"),
        "pto" => @line.dig("source_snapshot", "pto")&.deep_dup,
        "line" => @line.deep_dup, "reimbursements" => reimbursements, "bank_details" => self.class.bank_details(@employment),
        "revision_digest" => @run.current_revision.digest, "terms_id" => @terms.id,
        "line_digest" => IndiaHandoff.line_digest(@line), "bank_digest" => MercurySetup.digest(self.class.bank_details(@employment).sort.to_h),
        "entitlement_minor" => @line.dig("amounts", "net_minor"),
        "reviewers" => @run.current_revision.payroll_approvals.order(:stage).map { |approval| { "stage" => approval.stage, "actor_id" => approval.actor_id } }
      }.tap do |report|
        reviewed = @line.dig("preparation", "service_fee_review")
        report["service_fee_review"] = reviewed if reviewed
        report["period_base_fee"] = service_fee if reviewed
      end
    end

    private

      def service_fee
        reviewed = @line.dig("preparation", "service_fee_review", "amount_minor")
        reviewed ? (reviewed.to_d / 100).to_s("F") : @terms.monthly_fee.to_s("F")
      end

      def reimbursements
        @line.fetch("reimbursements").map do |entry|
          id = ClaimReference.expense_id(entry["source_reference"])
          expense = @run.company.expenses.find_by(id:)
          entry.merge("claim_id" => id, "label" => expense&.description || entry["code"], "date" => expense&.date&.iso8601)
        end
      end
  end
end
