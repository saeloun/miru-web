# frozen_string_literal: true

module Payroll
  class MercuryReadiness
    def initialize(run, revision)
      @run = run
      @revision = revision
    end

    def connection
      return @connection if defined?(@connection)

      @connection = PayrollMercuryConnection.find_by(company_id: @run.company_id)
    end

    def lines
      @revision&.payroll_payload&.fetch("lines", []) || []
    end

    def line(employment)
      lines.find { |entry| entry["employment_id"] == employment.id }
    end

    def terms(employment)
      if line(employment)&.dig("preparation", "service_fee_review")
        ServicePeriod.new(employment, month: @run.period, sources: sources(employment)).terms
      else
        sources(employment).terms(employment.id)
      end
    end

    def active_arrangement(employment)
      current = PayrollSplitArrangement.current_for(employment)
      current if current&.active?
    end

    def required_beneficiaries(employment)
      active_arrangement(employment) ? %w[consultant spouse] : %w[consultant]
    end

    def run_approved?
      return @run_approved if defined?(@run_approved)

      @run_approved = Workflow.new(@run).status == "approved"
    end

    def line_blockers(employment)
      entry = line(employment)
      return ["line_not_in_revision"] unless entry

      run_blockers + source_blockers(employment) + line_payment_blockers(entry) + terms_blockers(employment) + split_blockers(employment) + recipient_blockers(employment)
    end

    def source_blockers(employment)
      return ["line_not_in_revision"] unless @revision

      Snapshot.new(@run, @revision.payroll_payload, actor_id: @revision.created_by_id).outbound_line_issues(line(employment))
    end

    private

      def run_blockers
        codes = []
        codes << "run_not_approved" unless run_approved?
        codes << "connection_missing" unless connection
        codes << "connection_unverified" if connection && !connection.read_verified?
        codes
      end

      def line_payment_blockers(entry)
        codes = []
        codes << "not_consultant_line" unless entry["pay_type"] == "consultant"
        codes << "unsupported_currency" unless entry["currency"] == "INR"
        net = entry.dig("amounts", "net_minor")
        codes << "invalid_net_amount" unless net.is_a?(Integer) && net.positive?
        codes
      end

      def terms_blockers(employment)
        codes = []
        current = terms(employment)
        codes << "terms_missing" unless current
        codes << "funding_not_mercury" if current && current.payment_source != "mercury_us"
        period = ServicePeriod.new(employment, month: @run.period, sources: sources(employment))
        binding = line(employment)&.dig("preparation", "service_fee_review")
        if period.required? || binding
          codes << "service_fee_review_changed" unless period.valid_binding?(binding)
        elsif sources(employment).terms_changed?(employment.id)
          codes << "terms_changed_during_month"
        end
        codes << "consultant_inactive" if employment.discarded?
        codes << "billing_identity_review_required" unless BillingIdentity.new(employment).valid_binding?(line(employment)&.dig("preparation", "billing_identity"))
        codes
      end

      def split_blockers(employment)
        current = PayrollSplitArrangement.current_for(employment)
        current && !current.active? && !current.withdrawn? ? ["split_pending_approval"] : []
      end

      def recipient_blockers(employment)
        required_beneficiaries(employment).flat_map { |beneficiary| beneficiary_blockers(employment, beneficiary) }
      end

      def beneficiary_blockers(employment, beneficiary)
        details = MercurySetup.bank_details(employment, beneficiary, arrangement: active_arrangement(employment))
        prefix = beneficiary == "spouse" ? "spouse_" : ""
        return ["#{prefix}bank_profile_incomplete"] unless MercurySetup.bank_profile_complete?(details)

        link = PayrollMercuryRecipientLink.current_for(employment, beneficiary)
        return ["#{prefix}recipient_not_linked"] unless link

        link.bank_details_digest == MercurySetup.digest(details.sort.to_h) ? [] : ["#{prefix}bank_details_changed"]
      end

      def sources(employment)
        @sources ||= {}
        @sources[employment.id] ||= ConsultantSources.new(company: @run.company, employments: [employment], month: @run.period)
      end
  end
end
