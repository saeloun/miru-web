# frozen_string_literal: true

module Payroll
  module PtoRecovery
    module_function

    def reserve!(run, revision)
      revision.payroll_payload.fetch("lines").sort_by { |line| line["employment_id"] }.each do |line|
        next unless line["pay_type"] == "consultant"
        protected_line = MercuryRevisionGuard.new(run).protected_line?(line)

        pto = line.dig("source_snapshot", "pto")
        next unless pto

        employment = run.company.employments.find(line.fetch("employment_id"))
        employment.with_lock do
          ids = pto.fetch("historical_decision_ids")
          ids += [pto.fetch("decision_id")] if pto["unpaid_hours"].to_d.positive?
          ids = released_decision_ids(run, employment, ids) if protected_line
          ids.each { |id| reserve_entry!(run, revision, line, employment, id) }
        end
      end
    rescue ActiveRecord::RecordNotUnique, ActiveRecord::RecordNotFound
      raise Workflow::Conflict, "PTO decision changed or was recovered elsewhere; prepare a fresh revision", cause: nil
    end

    def released_decision_ids(run, employment, ids)
      released_ids = PayrollPtoRecovery.heads.where(payroll_run: run, employment:, kind: "released").pluck(:payroll_pto_entry_id)
      ids.select { |id| released_ids.include?(id.to_i) }
    end
    private_class_method :released_decision_ids

    def release!(run, protected_employment_ids:)
      reservations(run).order(:employment_id, :id).each do |entry|
        entry.employment.with_lock do
          next unless PayrollPtoRecovery.heads.exists?(id: entry.id)
          next if protected_employment_ids.include?(entry.employment_id) && original_bank_activity?(run, entry)

          append(entry, "released")
        end
      end
    end

    def settle!(run, employment_id)
      run.with_lock do
        employment = run.company.employments.find(employment_id)
        employment.with_lock do
          if PayrollPtoRecovery.heads.exists?(payroll_run: run, employment_id:, kind: "returned_review")
            raise Workflow::Conflict, "Prior credit needs owner review before PTO recovery can settle"
          end
          reservations(run).where(employment_id:).each do |entry|
            raise Workflow::Conflict, "Full confirmed credit on the reserved revision is required before PTO recovery settles" unless confirmed_credit?(run, entry)

            append(entry, "settled")
          end
        end
      end
    end

    def returned!(run, employment_id)
      PayrollPtoRecovery.heads.where(payroll_run: run, employment_id:, kind: "settled").each { |entry| append(entry, "returned_review") }
    end

    def resolve_review!(review, actor:, reason:, expected_recovery_id:)
      run = review.payroll_run
      Entitlement.require!(run.company_id)
      run.with_lock do
        unless actor&.id == run.final_reviewer_id && run.eligible_actor?(actor, "final") &&
            User.kept.exists?(id: actor.id, current_workspace_id: run.company_id)
          raise Workflow::NotAuthorized, "The assigned active owner must review prior credit"
        end
        unless reason.is_a?(String) && reason.strip.length.between?(1, 1000)
          raise ConsultantReview::InvalidInput, "Record the reason and bank reconciliation evidence for this review"
        end
        groups = PayrollPaymentGroup.where(payroll_run: run, employment_id: review.employment_id).order(:id).lock.to_a
        PayrollPaymentInstruction.where(payroll_payment_group_id: groups.map(&:id)).order(:id).lock.load
        review.employment.with_lock do
          head = PayrollPtoRecovery.heads.find_by!(payroll_pto_entry_id: review.payroll_pto_entry_id)
          if head.kind == "settled" && head.previous_recovery_id == review.id && head.actor_id == actor.id && head.reason == reason
            return head
          end
          unless head.id == review.id && head.kind == "returned_review" && head.id.to_s == expected_recovery_id.to_s
            raise Workflow::Conflict, "Recovery review changed; refresh its recorded state"
          end
          unless confirmed_credit?(run, head)
            raise Workflow::Conflict, "Full confirmed credit on the reserved revision is required; a confirmed reversal remains under bank review"
          end
          settle_review!(groups, head, actor, reason)
        end
      end
    end

    def reservations(run)
      PayrollPtoRecovery.heads.where(payroll_run: run, kind: "reserved")
    end

    def issues(run, line)
      return [] unless line["pay_type"] == "consultant"

      pto = line.dig("source_snapshot", "pto")
      return [] unless pto

      ids = Array(pto["historical_decision_ids"]).dup
      ids << pto["decision_id"] if pto["unpaid_hours"].to_d.positive?
      ids.flat_map do |id|
        entry = PayrollPtoEntry.heads.find_by(id:, company_id: run.company_id, employment_id: line["employment_id"])
        next ["pto_decision_superseded"] unless entry

        recovery = PayrollPtoRecovery.heads.find_by(payroll_pto_entry: entry)
        next ["pto_recovery_return_review"] if recovery&.kind == "returned_review"
        next ["pto_recovery_already_claimed"] if recovery && recovery.kind != "released" && recovery.payroll_run_id != run.id
        if recovery&.kind == "reserved" && recovery.payroll_revision_id != run.current_revision&.id && !original_bank_activity?(run, recovery)
          next ["pto_reservation_revision_changed"]
        end

        []
      end
    end

    def original_bank_activity?(run, recovery)
      original = { company_id: run.company_id, payroll_run_id: run.id, employment_id: recovery.employment_id,
                   payroll_revision_id: recovery.payroll_revision_id }
      PayrollIndiaHandoff.active.where(original).exists? ||
        PayrollPaymentInstruction.open_slot.where(original).where.not(submission_state: "prepared").any?(&:intact?)
    end
    private_class_method :original_bank_activity?

    def append(previous, kind, actor: nil, reason: nil)
      PayrollPtoRecovery.create!(company_id: previous.company_id, employment_id: previous.employment_id,
        payroll_pto_entry_id: previous.payroll_pto_entry_id, payroll_run_id: previous.payroll_run_id,
        payroll_revision_id: previous.payroll_revision_id, previous_recovery: previous, kind:, amount_minor: previous.amount_minor, actor:, reason:)
    end

    def recovery_line(recovery)
      recovery.payroll_revision.payroll_payload.fetch("lines").find { |line| line["employment_id"] == recovery.employment_id }
    end

    def confirmed_credit?(run, recovery)
      line = recovery_line(recovery)
      india = PayrollIndiaHandoff.active.where(payroll_run: run, employment_id: recovery.employment_id, payroll_revision_id: recovery.payroll_revision_id).any? do |handoff|
        handoff.payroll_india_credits.sum(:amount_minor) >= handoff.entitlement_minor &&
          handoff.payroll_india_deliveries.where(state: "sent").exists? && handoff.line_digest == IndiaHandoff.line_digest(line)
      end
      india || PayrollPaymentGroup.where(payroll_run: run, employment_id: recovery.employment_id).any? do |group|
        group_confirms_credit?(group, recovery, line)
      end
    end

    def group_confirms_credit?(group, recovery, line)
      return false unless group.line_digest == PayrollPaymentGroup.line_digest(line) && group.fully_credited?

      legs = group.open_legs.includes(:payroll_revision).to_a
      # A carried split must retain an original leg and the exact approved source on every replacement leg.
      legs.any? { |leg| leg.payroll_revision_id == recovery.payroll_revision_id } && legs.all? do |leg|
        approved = leg.payroll_revision.payroll_payload.fetch("lines").find { |entry| entry["employment_id"] == recovery.employment_id }
        approved && MercuryRevisionGuard.same_line?(approved, line)
      end
    end

    def reserve_entry!(run, revision, line, employment, id)
      entry = PayrollPtoEntry.heads.find_by!(id:, employment:, company: run.company, kind: %w[unpaid allocation review_unpaid])
      previous = PayrollPtoRecovery.heads.find_by(payroll_pto_entry: entry)
      if previous && previous.kind != "released"
        return if %w[reserved settled].include?(previous.kind) && previous.payroll_run_id == run.id &&
          IndiaHandoff.line_digest(line) == IndiaHandoff.line_digest(recovery_line(previous))
        raise Workflow::Conflict, "This absence has already been reserved or recovered"
      end
      base = line.fetch("calculation_snapshot").fetch("input").fetch("compensation").fetch("amount").to_d * 100
      amount = entry.kind == "review_unpaid" ? entry.cash_amount_minor : base.to_i - line.fetch("amounts").fetch("base_minor")
      PayrollPtoRecovery.create!(company: run.company, employment:, payroll_pto_entry: entry, payroll_run: run,
        payroll_revision: revision, previous_recovery: previous, kind: "reserved", amount_minor: amount)
    end
    private_class_method :reserve_entry!

    def settle_review!(groups, head, actor, reason)
      settled = append(head, "settled", actor:, reason:)
      return settled if PayrollPtoRecovery.heads.exists?(payroll_run_id: head.payroll_run_id, employment_id: head.employment_id, kind: "returned_review")

      groups.each do |group|
        next unless group.fully_credited_at.nil? && group_confirms_credit?(group, head, recovery_line(head))

        group.update!(fully_credited_at: Time.current)
        group.payroll_payment_instructions.order(:id).first&.payroll_payment_events&.create!(kind: "pto_credit_review_approved", actor:, data: {})
      end
      settled
    end
    private_class_method :settle_review!
  end
end
