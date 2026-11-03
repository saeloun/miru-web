# frozen_string_literal: true

module Payroll
  class MercuryPaymentReview
    def initialize(run, user)
      @run = run
      @user = user
      @policy = PayrollRunPolicy.new(user, run)
    end

    def call
      Entitlement.require!(@run.company_id)
      head = @run.current_revision
      @readiness = MercuryReadiness.new(@run, head)
      {
        setup: setup, rate: rate, run_status: Workflow.new(@run).status, revision_digest: head&.digest,
        permissions: { manage: @policy.manage_mercury?, accounts_review: accounts_reviewer?, record_credit: @policy.show? },
        consultants: consultants
      }
    end

    private

      def accounts_reviewer?
        @run.accounts_reviewer_id == @user.id
      end

      def connection
        @readiness.connection
      end

      def setup
        return { configured: false, verified: false, writes_enabled: false } unless connection

        { configured: true, environment: connection.environment, source_account_id: masked_id(connection.source_account_id),
          expected_legal_business_name: connection.expected_legal_business_name, verified: connection.read_verified?,
          verified_at: connection.verified_at&.iso8601, account_name: connection.verified_account_name, account_mask: connection.verified_account_mask,
          wire_fee_minor: connection.wire_fee_minor.to_s, writes_enabled: MercuryWrites.enabled?(@run.company_id, connection.environment) }
      end

      def masked_id(value)
        "••••#{value.last(4)}"
      end

      def rate
        row = MercuryPayment.fresh_exchange_rate(@run.company)
        return { available: false } unless row

        { available: true, reference_rate: row.rate.to_s("F"), source: row.source, date: row.date.iso8601,
          observed_at: row.updated_at.iso8601, buffered_rate: (BigDecimal(row.rate.to_s) - MercuryPayment::BUFFER).to_s("F") }
      end

      def consultants
        employments = Employment.where(company_id: @run.company_id, id: @readiness.lines.pluck("employment_id")).includes(:user, :employee_record).index_by(&:id)
        groups = PayrollPaymentGroup.where(payroll_run_id: @run.id).includes(payroll_payment_instructions: [:recipient_link, :payroll_payment_events]).index_by(&:employment_id)
        @readiness.lines.filter_map do |line|
          employment = employments[line["employment_id"]]
          employment && consultant(employment, line, groups[employment.id])
        end
      end

      def consultant(employment, line, group)
        arrangement = PayrollSplitArrangement.current_for(employment)
        allocations = allocations_for(line, @readiness.active_arrangement(employment))
        blockers = @readiness.line_blockers(employment) + allocations[:blockers]
        {
          employment_id: employment.id.to_s, payee_name: employment.user.full_name, entitlement_minor: line.dig("amounts", "net_minor").to_s,
          reimbursement_minor: line.dig("amounts", "reimbursements_minor").to_s, currency: line["currency"], blockers: blockers.uniq,
          allocations: allocations[:results], split: arrangement && split_detail(arrangement),
          recipients: @readiness.required_beneficiaries(employment).map { |beneficiary| recipient_detail(employment, beneficiary) },
          fully_credited_at: group&.fully_credited_at&.iso8601, legs: legs(group), can_prepare: can_prepare?(blockers, group, allocations),
          combined_company_debit_minor: open_legs(group).sum(&:company_debit_minor).to_s,
          resolved_shortfall_minor: open_legs(group).select { |leg| leg.credit_state == "shortfall_resolved" }.sum(&:shortfall_minor).to_s,
          settled_claims_need_review: settled_claims_need_review?(group), run_approved: @readiness.run_approved?
        }
      end

      def open_legs(group)
        group ? group.payroll_payment_instructions.select { |leg| leg.released_at.nil? } : []
      end

      def settled_claims_need_review?(group)
        return false if group.nil? || group.fully_credited_at

        group.payroll_payment_instructions.any? { |leg| leg.payroll_payment_events.any? { |event| event.kind == "group_credit_reopened" } }
      end

      def can_prepare?(blockers, group, allocations)
        return false unless blockers.empty? && @policy.manage_mercury?

        open_legs = group ? group.payroll_payment_instructions.filter_map { |leg| leg.beneficiary if leg.released_at.nil? } : []
        (allocations[:results].pluck(:beneficiary) - open_legs).any?
      end

      def allocations_for(line, arrangement)
        results = ConsultantAllocation.call(line:, arrangement:).map do |allocation|
          { beneficiary: allocation.beneficiary, amount_minor: allocation.amount_minor.to_s }
        end
        { results:, blockers: [] }
      rescue MercuryPayment::Blocked => error
        { results: [], blockers: error.codes }
      end

      def split_detail(arrangement)
        { id: arrangement.id.to_s, status: split_status(arrangement), allocation_kind: arrangement.allocation_kind,
          allocation_value: arrangement.allocation_value.to_s("F"), allocated_to: arrangement.allocated_to, remainder_to: arrangement.remainder_to,
          verified_by_id: arrangement.verified_by_id&.to_s, spouse: arrangement.masked }
      end

      def split_status(arrangement)
        return "withdrawn" if arrangement.withdrawn?
        return "approved" if arrangement.approved_at

        arrangement.verified_at ? "verified" : "requested"
      end

      def recipient_detail(employment, beneficiary)
        link = PayrollMercuryRecipientLink.current_for(employment, beneficiary)
        details = MercurySetup.bank_details(employment, beneficiary, arrangement: @readiness.active_arrangement(employment))
        { beneficiary:, linked: link.present?, current: link.present? && link.bank_details_digest == MercurySetup.digest(details.sort.to_h),
          name: link&.display_name, account_mask: link&.account_mask, swift_code: link&.swift_code, verified_at: link&.created_at&.iso8601 }
      end

      def legs(group)
        return [] unless group

        group.payroll_payment_instructions.sort_by(&:id).map { |leg| leg_detail(leg) }
      end

      def leg_detail(leg)
        link = leg.recipient_link
        {
          id: leg.id.to_s, beneficiary: leg.beneficiary, display_state: leg.display_state, released: leg.released_at.present?, frozen_digest: leg.frozen_digest,
          entitlement_minor: leg.entitlement_minor.to_s, principal_minor: leg.principal_minor.to_s, fee_minor: leg.fee_minor.to_s,
          company_debit_minor: leg.company_debit_minor.to_s, charge_type: leg.charge_type, reference_rate: leg.reference_rate.to_s("F"),
          buffered_rate: leg.buffered_rate.to_s("F"), rate_source: leg.rate_source, rate_mode: leg.rate_mode, rate_observed_at: leg.rate_observed_at.iso8601,
          rate_valid_until: leg.rate_valid_until.iso8601, quote_expired: leg.rate_valid_until <= Time.current,
          purpose_category: leg.purpose_category, purpose_info: leg.purpose_info,
          source_account_mask: connection&.verified_account_mask, recipient: { name: link.display_name, account_mask: link.account_mask, swift_code: link.swift_code },
          provider_request_id: leg.provider_request_id, request_status: leg.request_status, requester_may_approve: leg.requester_may_approve,
          approvers_required: leg.approvers_required, scheduled_send_on: leg.scheduled_send_on&.iso8601, provider_transaction_id: leg.provider_transaction_id,
          transaction_status: leg.transaction_status, transaction_link_state: leg.transaction_link_state, transaction_failure_reason: leg.transaction_failure_reason,
          credit_state: leg.credit_state, credited_minor: leg.credited_minor.to_s, shortfall_minor: leg.shortfall_minor.to_s, last_error_code: leg.last_error_code,
          last_checked_at: leg.last_checked_at&.iso8601, absence_attested: leg.absent_confirmed_at.present?,
          events: leg.payroll_payment_events.sort_by(&:id).last(12).map { |event| { kind: event.kind, created_at: event.created_at.iso8601 } },
          actions: actions(leg)
        }
      end

      def actions(leg)
        manage = @policy.manage_mercury?
        open_slot = leg.released_at.nil?
        attester = leg.retry_unlocked? && leg.absent_confirmed_by_id == @user.id
        unsent = open_slot && !attester && (leg.submission_state == "prepared" || leg.retry_unlocked?)
        {
          submit: manage && unsent, void: manage && unsent, refresh: open_slot && leg.submission_state == "accepted",
          reconcile: manage && open_slot && leg.stuck_submission?,
          attest_absence: accounts_reviewer? && open_slot && leg.stuck_submission? && !leg.retry_unlocked?,
          record_credit: leg.credit_recordable?,
          resolve_shortfall: leg.credit_state == "partial" && PayrollPaymentInstruction::CREDIT_BARRED_TRANSACTIONS.exclude?(leg.transaction_status)
        }
      end
  end
end
