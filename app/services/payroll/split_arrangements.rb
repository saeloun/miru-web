# frozen_string_literal: true

module Payroll
  class SplitArrangements
    def initialize(run)
      @run = run
      @company_id = run.company_id
    end

    def request!(actor:, employment_id:, attributes:, details:, account_number_confirmation:)
      authorize_reviewer!(actor)
      raise MercuryPayment::Blocked.new("account_number_mismatch") unless details["bank_account_number"].present? && details["bank_account_number"] == account_number_confirmation

      line_ids = @run.current_revision&.payroll_payload&.fetch("lines", [])&.pluck("employment_id") || []
      employment = Employment.kept.where(company_id: @company_id, id: line_ids).find(employment_id)
      guard_bank_activity!(employment)
      PayrollSplitArrangement.create!(attributes.merge(company_id: @company_id, employment:, requested_by: actor, details:))
    end

    def verify!(actor:, arrangement_id:)
      authorize_accounts_reviewer!(actor)
      arrangement = find(arrangement_id)
      arrangement.with_lock do
        raise MercuryPayment::Blocked.new("split_not_current") unless current?(arrangement) && arrangement.verified_at.nil?

        arrangement.update!(verified_by: actor, verified_at: Time.current)
      end
      arrangement
    end

    def approve!(actor:, arrangement_id:)
      authorize_owner!(actor)
      arrangement = find(arrangement_id)
      arrangement.with_lock do
        raise MercuryPayment::Blocked.new("split_not_current") unless current?(arrangement) && arrangement.approved_at.nil?
        raise MercuryPayment::Blocked.new("split_not_verified") unless arrangement.verified_at
        raise MercuryPayment::Blocked.new("split_approver_must_differ") if arrangement.verified_by_id == actor.id

        arrangement.update!(approved_by: actor, approved_at: Time.current)
      end
      arrangement
    end

    def withdraw!(actor:, arrangement_id:)
      authorize_owner!(actor)
      arrangement = find(arrangement_id)
      guard_bank_activity!(arrangement.employment)
      arrangement.with_lock do
        raise MercuryPayment::Blocked.new("split_not_current") unless current?(arrangement) && !arrangement.withdrawn?

        arrangement.update!(withdrawn_by: actor, withdrawn_at: Time.current)
      end
      arrangement
    end

    private

      def guard_bank_activity!(employment)
        groups = PayrollPaymentGroup.where(company_id: @company_id, employment_id: employment.id, fully_credited_at: nil)
        raise MercuryPayment::Blocked.new("split_locked_by_bank_activity") if groups.any? { |group| group.in_flight_legs.exists? }
      end

      def find(id)
        PayrollSplitArrangement.where(company_id: @company_id).find(id)
      end

      def current?(arrangement)
        PayrollSplitArrangement.current_for(arrangement.employment)&.id == arrangement.id
      end

      def in_workspace?(actor)
        User.kept.exists?(id: actor&.id, current_workspace_id: @company_id)
      end

      def authorize_reviewer!(actor)
        Entitlement.require!(@company_id)
        return if in_workspace?(actor) && (@run.eligible_actor?(actor, "final") ||
          (actor.id == @run.accounts_reviewer_id && @run.eligible_actor?(actor, "accounts")))

        raise Workflow::NotAuthorized, "An active owner or the assigned accounts reviewer is required"
      end

      def authorize_accounts_reviewer!(actor)
        Entitlement.require!(@company_id)
        return if in_workspace?(actor) && actor.id == @run.accounts_reviewer_id && @run.eligible_actor?(actor, "accounts")

        raise Workflow::NotAuthorized, "The assigned accounts reviewer is required"
      end

      def authorize_owner!(actor)
        Entitlement.require!(@company_id)
        return if in_workspace?(actor) && @run.eligible_actor?(actor, "final")

        raise Workflow::NotAuthorized, "An active owner in this workspace is required"
      end
  end
end
