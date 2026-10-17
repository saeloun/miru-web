# frozen_string_literal: true

module Payroll
  class Workflow
    class Conflict < StandardError; end
    class NotAuthorized < StandardError; end

    def initialize(run)
      @run = run
    end

    def revise!(actor:, payload:, idempotency_key:, expected_digest:)
      Entitlement.require!(@run.company_id)
      @run.with_lock do
        unless @run.eligible_actor?(actor, "accounts") && User.kept.exists?(id: actor.id, current_workspace_id: @run.company_id)
          raise NotAuthorized, "Active accounts role in the current workspace required"
        end

        snapshot = Snapshot.new(@run, payload)
        existing = @run.payroll_revisions.find_by(idempotency_key:)
        head = @run.current_revision
        if existing
          previous_snapshot = Snapshot.new(@run, existing.payroll_payload)
          unless previous_snapshot.digest == snapshot.digest && existing.parent_digest == expected_digest && head.id == existing.id
            raise Conflict, "Idempotency key conflicts with payload or current revision"
          end
          return existing
        end
        raise Conflict, "Revision changed; reload before editing" unless head&.digest == expected_digest

        number = (head&.number || 0) + 1
        @run.payroll_revisions.create!(created_by: actor, payroll_payload: payload, idempotency_key:,
          digest: PayrollRevision.chain_digest(snapshot.digest, expected_digest, number), parent_digest: expected_digest, number:)
      end
    end

    def approve!(actor:, stage:, expected_digest:)
      Entitlement.require!(@run.company_id)
      @run.with_lock do
        head = @run.current_revision
        raise Conflict, "Revision changed; reload before approving" unless head && head.digest == expected_digest

        head.payroll_approvals.create!(actor:, stage:)
      end
    end

    def status
      Entitlement.require!(@run.company_id)
      @run.with_lock do
        head = @run.current_revision
        return "draft" unless head && head.approval_issues.empty?

        accounts = head.payroll_approvals.find_by(stage: "accounts")
        return "draft" unless accounts && @run.eligible_actor?(accounts.actor, "accounts")

        final = head.payroll_approvals.find_by(stage: "final")
        final && @run.eligible_actor?(final.actor, "final") ? "approved" : "accounts_approved"
      end
    end
  end
end
