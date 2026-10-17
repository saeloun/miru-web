# frozen_string_literal: true

module Payroll
  class ReviewSummary
    SETUP_BLOCKERS = %w[provider_setup_required capabilities_unverified recipients_unverified roster_binding_required dry_run_only].freeze

    def initialize(run, revision: nil)
      @run = run
      @revision = revision
    end

    def summary
      Entitlement.require!(@run.company_id)
      {
        id: @run.id.to_s, company_id: @run.company_id.to_s, period: @run.period.iso8601,
        currency: @run.currency, dry_run: @run.dry_run,
        current_revision: @revision && revision_metadata(@revision)
      }
    end

    def detail
      Entitlement.require!(@run.company_id)
      @run.with_lock do
        @revision = @run.current_revision
        summary.merge(status: Workflow.new(@run).status, review_issues: review_issues,
          reviewers: { accounts: reviewer(@run.accounts_reviewer), final: reviewer(@run.final_reviewer) },
          revision: revision_detail)
      end
    end

    def preflight
      Entitlement.require!(@run.company_id)
      @run.with_lock do
        @revision = @run.current_revision
        state = Workflow.new(@run).status
        reconciliation = reconcile
        {
          status: "blocked", preview_only: true, execution_enabled: false,
          run_id: @run.id.to_s, company_id: @run.company_id.to_s, period: @run.period.iso8601, currency: @run.currency,
          revision_number: @revision&.number, revision_digest: @revision&.digest, approval_state: state,
          recipient_count: lines.size, total_net_minor: total_minor&.to_s, reconciliation:,
          blockers: (SETUP_BLOCKERS + review_issues + reconciliation["issues"] + (state == "approved" ? [] : ["approval_required"])).uniq
        }
      end
    end

    private

      def revision_metadata(revision)
        { number: revision.number, digest: revision.digest, created_at: revision.created_at.iso8601(6) }
      end

      def reviewer(user)
        { id: user.id.to_s, name: user.full_name }
      end

      def review_issues
        @revision ? @revision.approval_issues.uniq : ["revision_missing"]
      end

      def lines
        @revision&.payroll_payload&.fetch("lines", []) || []
      end

      def total_minor
        return nil if lines.empty? || lines.any? { |line| !line.dig("amounts", "net_minor").is_a?(Integer) }

        lines.sum { |line| line.dig("amounts", "net_minor") }
      end

      def revision_detail
        return unless @revision

        payload = @revision.payroll_payload
        employments = Employment.where(company_id: @run.company_id, id: lines.pluck("employment_id")).includes(:user).index_by(&:id)
        revision_metadata(@revision).merge(policies: payload["policies"], exceptions: payload["exceptions"],
          lines: lines.map { |line| line_detail(line, employments[line["employment_id"]]) },
          approvals: approvals(@revision), audit: audit)
      end

      def line_detail(line, employment)
        result = line.slice("employment_id", "pay_type", "currency", "amounts", "extras", "reimbursements", "deductions", "source_resolutions")
        result = precise_values(result)
        result.merge("payee_name" => employment&.user&.full_name || "Unavailable payee",
          "source" => source_detail(line["source_snapshot"]), "calculation" => calculation_detail(line["calculation_snapshot"]))
      end

      def source_detail(source)
        return unless source.is_a?(Hash)

        precise_values(source.slice("month", "digest", "captured_at", "work_entries", "timeoff_entries",
          "review_exceptions", "company_calendar", "employment", "pay_policy_version", "attendance_policy_version"))
      end

      def calculation_detail(calculation)
        return unless calculation.is_a?(Hash)

        result = calculation.slice("calculation_version", "company_id", "person_id", "period", "currency", "gross", "deductions",
          "net", "manual_net_delta", "review_ready", "preview_only", "issues").deep_dup
        result["lines"] = calculation.fetch("lines").map do |line|
          line.slice("code", "kind", "source_currency", "source_amount", "currency", "amount", "origin_period", "reason", "reviewed")
        end
        result["input"] = calculation.fetch("input").except("quantity_source", "hours_source", "adjustments", "manual_net")
        if calculation.dig("input", "manual_net")
          result["input"]["manual_net"] = calculation.dig("input", "manual_net").slice("amount", "currency", "reason", "reviewed")
        end
        result["policy"] = calculation.fetch("policy").except("fx")
        result["policy"]["fx"] = calculation.dig("policy", "fx").except("source") if calculation.dig("policy", "fx")
        precise_values(result)
      end

      def precise_values(value)
        case value
        when Hash then value.transform_values { |entry| precise_values(entry) }
        when Array then value.map { |entry| precise_values(entry) }
        when Integer then value.to_s
        else value
        end
      end

      def approvals(revision)
        records = revision.payroll_approvals
        records = records.includes(:actor) unless records.loaded?
        records.sort_by { |approval| [approval.created_at, approval.id] }.map do |approval|
          { stage: approval.stage, actor_name: approval.actor.full_name, created_at: approval.created_at.iso8601(6) }
        end
      end

      def audit
        @run.payroll_revisions.select(:id, :payroll_run_id, :number, :digest, :created_at, :created_by_id)
          .order(number: :desc).limit(20).includes(:created_by, payroll_approvals: :actor).map do |revision|
          revision_metadata(revision).merge(created_by_name: revision.created_by.full_name, approvals: approvals(revision))
        end
      end

      def reconcile
        return { "reconciled" => false, "issues" => ["revision_missing"] } unless @revision
        return { "reconciled" => false, "issues" => ["missing_or_invalid_recipient_net"] } unless total_minor

        employments = Employment.where(company_id: @run.company_id, id: lines.pluck("employment_id")).index_by(&:id)
        rows = lines.map { |line| reconciliation_row(line, employments.fetch(line["employment_id"])) }
        multiplier = Money::Currency.find(@run.currency).subunit_to_unit
        PayrollCalculation::Reconciliation.new.call(results: rows, expected_totals: { @run.currency => (BigDecimal(total_minor.to_s) / multiplier).to_s("F") },
          recipient_ids: rows.pluck("person_id"), company_id: @run.company_id.to_s, period: @run.period.strftime("%Y-%m"))
      rescue ArgumentError, KeyError, TypeError
        { "reconciled" => false, "issues" => ["invalid_or_duplicate_recipient_records"] }
      end

      def reconciliation_row(line, employment)
        multiplier = Money::Currency.find(@run.currency).subunit_to_unit
        { "person_id" => employment.user_id.to_s, "company_id" => @run.company_id.to_s,
          "period" => @run.period.strftime("%Y-%m"), "currency" => line.fetch("currency"),
          "net" => (BigDecimal(line.fetch("amounts").fetch("net_minor").to_s) / multiplier).to_s("F"),
          "review_ready" => line.dig("calculation_snapshot", "review_ready") == true }
      end
  end
end
