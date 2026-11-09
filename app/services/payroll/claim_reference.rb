# frozen_string_literal: true

module Payroll
  module ClaimReference
    PREFIX = "expense"

    module_function

    def for(expense)
      "#{PREFIX}:#{expense.id}:#{digest(expense)}"
    end

    def expense_id(reference)
      match = reference.to_s.match(/\A#{PREFIX}:(\d+):\h+\z/o)
      match && match[1].to_i
    end

    def digest(expense)
      Digest::SHA256.hexdigest([expense.amount.to_s("F"), expense.currency, expense.date.iso8601, expense.user_id,
        expense.company_id, expense.approved_at&.iso8601(6)].join("|")).first(24)
    end

    def references(line)
      line.fetch("reimbursements", []).pluck("source_reference").select { |reference| expense_id(reference) }
    end

    def issues(run, line, employment)
      references(line).filter_map do |reference|
        expense = run.company.expenses.find_by(id: expense_id(reference))
        "claim_changed:#{expense_id(reference)}" unless current?(run, expense, reference, employment)
      end
    end

    def current?(run, expense, reference, employment)
      return false unless expense && !expense.discarded? && expense.user_id == employment.user_id && self.for(expense) == reference

      reservation = PayrollExpenseReservation.active.find_by(expense_id: expense.id)
      return false if reservation && reservation.payroll_run_id != run.id
      return reservation&.settled_at.present? if expense.paid? || expense.paid_at.present?

      expense.approved?
    end

    def reserve!(run, revision)
      revision.payroll_payload.fetch("lines").each do |line|
        next if MercuryRevisionGuard.new(run).protected_line?(line)

        line.fetch("reimbursements", []).each { |entry| reserve_entry!(run, revision, line, entry) }
      end
    rescue ActiveRecord::RecordNotUnique
      raise Workflow::Conflict, "A selected claim was reserved by another payroll; prepare a new revision", cause: nil
    end

    def reserve_entry!(run, revision, line, entry)
      id = expense_id(entry["source_reference"])
      return unless id

      expense = run.company.expenses.lock.find(id)
      reservation = PayrollExpenseReservation.active.find_by(expense_id: id)
      if reservation
        raise Workflow::Conflict, "A selected claim was reserved by another payroll; prepare a new revision" unless reservation.payroll_run_id == run.id

        return reservation.update!(payroll_revision: revision)
      end
      unless expense.approved? && expense.paid_at.nil? && !expense.discarded? && self.for(expense) == entry["source_reference"]
        raise Workflow::Conflict, "A selected claim is no longer payable; prepare a new revision"
      end

      PayrollExpenseReservation.create!(company_id: run.company_id, expense:, payroll_run: run, payroll_revision: revision,
        employment_id: line["employment_id"], amount_minor: entry["amount_minor"])
    end
  end
end
