# frozen_string_literal: true

module Payroll
  class MercuryReconciliation
    Contract = PayrollProviders::MercuryContract
    IN_FLIGHT_GRACE = 2.minutes
    CREATED_SKEW = 5.minutes
    TRANSACTION_WAIT = 3.days
    MAX_REQUEST_PAGES = 10
    MONEY_FORMAT = /\A\d{1,12}(\.\d{1,2})?\z/
    REFERENCE_FORMAT = %r{\A[\w .,:/#-]{1,100}\z}
    TERMINAL_REQUEST_STATUSES = %w[rejected cancelled].freeze
    RECOVERABLE_HOLDS = %w[transaction_list_incomplete multiple_transactions transaction_mismatch].freeze

    def self.accept!(instruction, parsed, actor:, event:)
      instruction.with_lock do
        known = instruction.provider_request_id
        unless instruction.stuck_submission? && instruction.released_at.nil? && [nil, parsed.request_id].include?(known)
          raise MercuryPayment::Blocked.new("nothing_to_reconcile")
        end

        instruction.update!(accepted_attributes(parsed).merge(submission_state: "accepted", absent_confirmed_at: nil, absent_confirmed_by: nil,
          last_error_code: nil, provider_request_id: parsed.request_id, provider_request_created_at: parsed.created_at,
          request_approved_at: parsed.status == "approved" ? Time.current : nil))
        instruction.payroll_payment_events.create!(kind: event, actor:, data: { "status" => parsed.status })
      end
      instruction
    end

    def self.accepted_attributes(parsed)
      { request_status: parsed.status, requester_may_approve: parsed.requester_may_approve,
        approvers_required: parsed.approvers_required, scheduled_send_on: parsed.scheduled_send_on, last_checked_at: Time.current }
    end

    def initialize(run)
      @run = run
      @company_id = run.company_id
    end

    def refresh!(actor:, instruction_id:)
      Entitlement.require!(@company_id)
      authorize_reader!(actor)
      read_status!(find_instruction(instruction_id), actor)
    end

    def refresh_from_job!(instruction)
      Entitlement.require!(@company_id)
      read_status!(instruction, nil)
    end

    def reconcile!(actor:, instruction_id:)
      Entitlement.require!(@company_id)
      authorize_owner!(actor)
      instruction = find_instruction(instruction_id)
      guard_reconcilable!(instruction)
      client = connection.client
      return link_known_request(instruction, client, actor) if instruction.provider_request_id

      scan_requests(instruction, client, actor)
    end

    def confirm_request!(actor:, instruction_id:, request_id:)
      Entitlement.require!(@company_id)
      authorize_owner!(actor)
      instruction = find_instruction(instruction_id)
      guard_reconcilable!(instruction)
      unless request_id.is_a?(String) && request_id.match?(PayrollMercuryConnection::UUID)
        raise MercuryPayment::Blocked.new("request_id_invalid")
      end

      parsed = read_request(connection.client, request_id)
      unless candidate?(instruction, parsed) && !request_claimed?(instruction, parsed.request_id)
        raise MercuryPayment::Blocked.new("request_does_not_match")
      end

      self.class.accept!(instruction, parsed, actor:, event: "request_linked_by_owner")
    end

    def attest_absence!(actor:, instruction_id:, evidence_reference:)
      Entitlement.require!(@company_id)
      authorize_accounts_reviewer!(actor)
      unless evidence_reference.is_a?(String) && evidence_reference.match?(REFERENCE_FORMAT)
        raise MercuryPayment::Blocked.new("absence_evidence_required")
      end

      instruction = find_instruction(instruction_id)
      guard_reconcilable!(instruction)
      known_request_id = instruction.provider_request_id
      guard_known_request_closed!(instruction) if known_request_id

      codes = absence_blockers(instruction)
      raise MercuryPayment::Blocked.new(codes) if codes.any?

      instruction.with_lock do
        guard_reconcilable!(instruction)
        raise MercuryPayment::Blocked.new("request_id_known") unless instruction.provider_request_id == known_request_id

        instruction.update!(submission_state: "uncertain", absent_confirmed_at: Time.current, absent_confirmed_by: actor, provider_request_id: nil)
        instruction.payroll_payment_events.create!(kind: "absence_attested", actor:,
          data: { "evidence_reference" => evidence_reference, "cleared_request_id" => known_request_id }.compact)
      end
      instruction
    end

    def absence_blockers(instruction)
      requests, complete = list_requests(connection.client, instruction.source_account_id)
      return ["candidates_must_be_resolved"] if requests.any? { |parsed| candidate?(instruction, parsed) && !request_claimed?(instruction, parsed.request_id) }

      complete ? [] : ["scan_incomplete"]
    end

    def record_credit!(actor:, instruction_id:, amount:, credited_on:, reference:)
      Entitlement.require!(@company_id)
      authorize_reader!(actor)
      instruction = find_instruction(instruction_id)
      minor = credit_minor(amount)
      date = credit_date(credited_on)
      raise MercuryPayment::Blocked.new("credit_reference_invalid") unless reference.is_a?(String) && reference.match?(REFERENCE_FORMAT)

      instruction.with_lock do
        next if duplicate_credit?(instruction, minor, reference)
        raise MercuryPayment::Blocked.new("credit_not_recordable") unless instruction.credit_recordable?

        total = instruction.credited_minor + minor
        instruction.update!(credited_minor: total, credit_state: total >= instruction.entitlement_minor ? "credited" : "partial")
        instruction.payroll_payment_events.create!(kind: "credit_recorded", actor:, data: { "amount_minor" => minor,
          "currency" => instruction.entitlement_currency, "credited_on" => date.iso8601, "reference" => reference })
      end
      sync_group(instruction, actor)
      instruction
    end

    def resolve_shortfall!(actor:, instruction_id:, reason:)
      Entitlement.require!(@company_id)
      authorize_reader!(actor)
      instruction = find_instruction(instruction_id)
      unless reason.is_a?(String) && reason.strip.length.between?(1, 500)
        raise MercuryPayment::Blocked.new("shortfall_reason_required")
      end

      instruction.with_lock do
        unless instruction.credit_state == "partial" && instruction.held_reason.blank? &&
            PayrollPaymentInstruction::CREDIT_BARRED_TRANSACTIONS.exclude?(instruction.transaction_status)
          raise MercuryPayment::Blocked.new("no_open_shortfall")
        end

        instruction.update!(credit_state: "shortfall_resolved")
        instruction.payroll_payment_events.create!(kind: "shortfall_resolved", actor:, data: { "shortfall_minor" => instruction.shortfall_minor, "reason" => reason.strip })
      end
      sync_group(instruction, actor)
      instruction
    end

    private

      def connection
        PayrollMercuryConnection.find_by(company_id: @company_id) || raise(MercuryPayment::Blocked.new("connection_missing"))
      end

      def find_instruction(id)
        PayrollPaymentInstruction.where(company_id: @company_id, payroll_run_id: @run.id).find(id)
      end

      def read_status!(instruction, actor)
        raise MercuryPayment::Blocked.new("not_accepted_yet") unless instruction.submission_state == "accepted"

        client = connection.client
        parsed = read_request(client, instruction.provider_request_id)
        matched = apply_request(instruction, parsed, actor)
        apply_transactions(instruction, client, actor) if matched && instruction.request_status != "pendingApproval"
        sync_group(instruction, actor)
        instruction
      end

      def authorize_owner!(actor)
        return if @run.eligible_actor?(actor, "final") && in_workspace?(actor)

        raise Workflow::NotAuthorized, "An active owner in this workspace is required"
      end

      def authorize_accounts_reviewer!(actor)
        return if actor&.id == @run.accounts_reviewer_id && @run.eligible_actor?(actor, "accounts") && in_workspace?(actor)

        raise Workflow::NotAuthorized, "The assigned accounts reviewer is required"
      end

      def authorize_reader!(actor)
        return if in_workspace?(actor) && (@run.eligible_actor?(actor, "final") ||
          (actor.id == @run.accounts_reviewer_id && @run.eligible_actor?(actor, "accounts")))

        raise Workflow::NotAuthorized, "An active owner or the assigned accounts reviewer is required"
      end

      def in_workspace?(actor)
        User.kept.exists?(id: actor.id, current_workspace_id: @company_id)
      end

      def guard_reconcilable!(instruction)
        raise MercuryPayment::Blocked.new("nothing_to_reconcile") unless instruction.stuck_submission?
        return unless instruction.submission_state == "submitting" && instruction.submission_started_at > IN_FLIGHT_GRACE.ago

        raise MercuryPayment::Blocked.new("submission_in_progress")
      end

      def guard_known_request_closed!(instruction)
        client = connection.client
        parsed = read_request(client, instruction.provider_request_id)
        closed = !instruction.matches_request?(parsed) && TERMINAL_REQUEST_STATUSES.include?(parsed.status)
        raise MercuryPayment::Blocked.new("request_id_known") unless closed && no_transactions_for?(client, parsed)
      end

      def no_transactions_for?(client, parsed)
        transactions, total = Contract.transactions(client.request_transactions(account_id: parsed.account_id,
          request_id: parsed.request_id, start: (parsed.created_at - 1.day).to_date))
        total.zero? && transactions.empty?
      rescue PayrollProviders::Error
        raise MercuryPayment::Blocked.new("provider_status_unavailable")
      end

      def read_request(client, request_id)
        Contract.send_money_request(client.send_money_request(request_id))
      rescue PayrollProviders::Error
        raise MercuryPayment::Blocked.new("provider_status_unavailable")
      end

      def apply_request(instruction, parsed, actor)
        instruction.with_lock do
          next false if instruction.released_at

          unless instruction.provider_request_id == parsed.request_id && instruction.matches_request?(parsed)
            flag_reconciliation(instruction, actor, "request_mismatch")
            next false
          end

          previous = instruction.request_status
          attributes = self.class.accepted_attributes(parsed)
          attributes[:request_approved_at] = Time.current if parsed.status == "approved" && instruction.request_approved_at.nil?
          instruction.update!(attributes)
          record_change(instruction, actor, "request_status_changed", previous, parsed.status)
          true
        end
      end

      def apply_transactions(instruction, client, actor)
        start = (instruction.provider_request_created_at - 1.day).to_date
        transactions, total = Contract.transactions(
          client.request_transactions(account_id: instruction.source_account_id, request_id: instruction.provider_request_id, start:)
        )
        instruction.with_lock { apply_linkage(instruction, transactions, total, actor) }
      rescue PayrollProviders::Error
        raise MercuryPayment::Blocked.new("provider_status_unavailable")
      end

      def apply_linkage(instruction, transactions, total, actor)
        # Only explicit reconciliation may change a closed or held terminal outcome.
        return if instruction.released_at || instruction.transaction_status == "reversed"
        return if PayrollPaymentInstruction::NO_FUNDS_MOVED_TRANSACTIONS.include?(instruction.transaction_status) && instruction.held_reason.present?
        return if instruction.held_reason.present? && RECOVERABLE_HOLDS.exclude?(instruction.held_reason)

        matches = transactions.select { |transaction| transaction.request_id == instruction.provider_request_id && transaction.kind != Contract::FEE_KIND }
        returned = matches.find do |transaction|
          instruction.provider_transaction_id == transaction.id && transaction.status == "reversed" && linkable?(instruction, transaction)
        end
        link_transaction(instruction, returned, actor) if returned
        return flag_reconciliation(instruction, actor, "transaction_list_incomplete", hold: true) if total > transactions.size

        return apply_no_transaction(instruction, actor) if matches.empty?

        observe_unlinked_status(instruction, matches, actor) unless returned
        return flag_reconciliation(instruction, actor, "multiple_transactions", hold: true) if matches.many?
        return if returned

        apply_transaction(instruction, matches.first, actor)
      end

      def apply_transaction(instruction, transaction, actor)
        return flag_reconciliation(instruction, actor, "transaction_mismatch") unless linkable?(instruction, transaction)
        if instruction.provider_transaction_id.nil? && instruction.held_reason == "multiple_transactions" &&
            PayrollPaymentInstruction::CREDIT_BARRED_TRANSACTIONS.include?(transaction.status)
          return flag_reconciliation(instruction, actor, "multiple_transactions", hold: true)
        end
        if transaction.status == "pending" && (instruction.transaction_status == "sent" || instruction.credited_minor.positive?)
          return flag_reconciliation(instruction, actor, bank_activity_hold(instruction) || "transaction_mismatch", hold: true)
        end

        link_transaction(instruction, transaction, actor)
      end

      def linkable?(instruction, transaction)
        transaction.kind == Contract::OUTGOING_KIND && transaction.account_id == instruction.source_account_id &&
          transaction.amount_minor == -instruction.principal_minor &&
          [nil, transaction.id].include?(instruction.provider_transaction_id) && !transaction_claimed?(instruction, transaction.id)
      end

      def observe_unlinked_status(instruction, matches, actor)
        worst = matches.find do |transaction|
          transaction.id == instruction.provider_transaction_id && PayrollPaymentInstruction::CREDIT_BARRED_TRANSACTIONS.include?(transaction.status) &&
            linkable?(instruction, transaction)
        end
        worst ||= PayrollPaymentInstruction::CREDIT_BARRED_TRANSACTIONS.reverse_each.filter_map do |status|
          matches.find { |transaction| transaction.status == status }
        end.first
        return unless worst && !linkable?(instruction, worst) || (worst && matches.many?)

        if PayrollPaymentInstruction::CREDIT_BARRED_TRANSACTIONS.include?(worst.status) &&
            (worst.id != instruction.provider_transaction_id || !linkable?(instruction, worst))
          code = matches.many? ? "multiple_transactions" : "transaction_mismatch"
          return flag_reconciliation(instruction, actor, code, hold: true)
        end

        previous = instruction.transaction_status
        instruction.update!(transaction_status: worst.status, transaction_failure_reason: worst.failure_reason)
        record_change(instruction, actor, "transaction_status_changed", previous, worst.status)
      end

      def apply_no_transaction(instruction, actor)
        if TERMINAL_REQUEST_STATUSES.include?(instruction.request_status)
          if instruction.request_approved_at || instruction.provider_transaction_id || instruction.transaction_status || bank_activity_hold(instruction)
            return flag_reconciliation(instruction, actor, bank_activity_hold(instruction) || "cancelled_after_approval", hold: true)
          end

          return instruction.update!(released_at: Time.current, held_reason: nil, last_error_code: nil, transaction_link_state: "none") unless instruction.released_at
        end
        return unless instruction.request_approved_at && instruction.request_approved_at < TRANSACTION_WAIT.ago

        flag_reconciliation(instruction, actor, "transaction_not_found")
      end

      def link_transaction(instruction, transaction, actor)
        previous = instruction.transaction_status
        no_funds = PayrollPaymentInstruction::NO_FUNDS_MOVED_TRANSACTIONS.include?(transaction.status)
        unexplained = no_funds && ([nil, "pending"].exclude?(previous) || instruction.credited_minor.positive? || bank_activity_hold(instruction))
        linkage = { transaction_link_state: "linked" }
        unless transaction.status == "reversed"
          linkage[:last_error_code] = nil
          linkage[:held_reason] = nil
        end
        instruction.update!({ provider_transaction_id: transaction.id, transaction_status: transaction.status,
          transaction_failure_reason: transaction.failure_reason, last_checked_at: Time.current }
          .merge(unexplained ? {} : linkage))
        record_change(instruction, actor, "transaction_status_changed", previous, transaction.status)
        return flag_reconciliation(instruction, actor, bank_activity_hold(instruction) || "failed_after_sent", hold: true) if unexplained

        instruction.update!(released_at: Time.current) if no_funds && instruction.released_at.nil?
      end

      def flag_reconciliation(instruction, actor, code, hold: false)
        changed = instruction.transaction_link_state != "reconciliation_required" || instruction.last_error_code != code
        instruction.update!({ transaction_link_state: "reconciliation_required", last_error_code: code, last_checked_at: Time.current }
          .merge(hold ? { held_reason: bank_activity_hold(instruction) || code } : {}))
        instruction.payroll_payment_events.create!(kind: "reconciliation_required", actor:, data: { "code" => code }) if changed
      end

      def bank_activity_hold(instruction)
        instruction.held_reason.presence unless instruction.held_reason == "transaction_list_incomplete"
      end

      def record_change(instruction, actor, kind, previous, current)
        return if previous == current

        instruction.payroll_payment_events.create!(kind:, actor:, data: { "from" => previous, "to" => current })
      end

      def link_known_request(instruction, client, actor)
        parsed = read_request(client, instruction.provider_request_id)
        raise MercuryPayment::Blocked.new("request_does_not_match") unless candidate?(instruction, parsed)

        { outcome: "linked", instruction: self.class.accept!(instruction, parsed, actor:, event: "request_reconciled"), candidates: [] }
      end

      def scan_requests(instruction, client, actor)
        requests, complete = list_requests(client, instruction.source_account_id)
        candidates = requests.select { |parsed| candidate?(instruction, parsed) && !request_claimed?(instruction, parsed.request_id) }
        marked = candidates.select { |parsed| parsed.memo == instruction.idempotency_key }
        if marked.one?
          return { outcome: "linked", instruction: self.class.accept!(instruction, marked.first, actor:, event: "request_reconciled"), candidates: [] }
        end

        outcome = candidates.any? ? "candidates" : (complete ? "none_found" : "incomplete")
        instruction.payroll_payment_events.create!(kind: "reconcile_scan", actor:, data: { "outcome" => outcome, "candidates" => candidates.size })
        { outcome:, instruction:, candidates: candidates.map { |parsed| candidate_summary(parsed) } }
      end

      def list_requests(client, account_id)
        requests = []
        cursor = nil
        MAX_REQUEST_PAGES.times do
          page, cursor = Contract.send_money_requests(client.send_money_requests(account_id:, start_after: cursor))
          requests.concat(page)
          return [requests, true] unless cursor
        end
        [requests, false]
      rescue PayrollProviders::Error
        raise MercuryPayment::Blocked.new("provider_status_unavailable")
      end

      def candidate?(instruction, parsed)
        foreign_key = parsed.memo.to_s.start_with?("miru-payroll-") && parsed.memo != instruction.idempotency_key
        !foreign_key && instruction.matches_request?(parsed) && parsed.created_at >= instruction.created_at - CREATED_SKEW
      end

      def request_claimed?(instruction, request_id)
        PayrollPaymentInstruction.where(company_id: @company_id, provider_request_id: request_id).where.not(id: instruction.id).exists?
      end

      def transaction_claimed?(instruction, transaction_id)
        PayrollPaymentInstruction.where(company_id: @company_id, provider_transaction_id: transaction_id).where.not(id: instruction.id).exists?
      end

      def candidate_summary(parsed)
        { request_id: parsed.request_id, status: parsed.status, created_at: parsed.created_at.utc.iso8601 }
      end

      def sync_group(instruction, actor)
        group = instruction.payroll_payment_group
        group.with_lock do
          if group.fully_credited?
            settle_group(group, instruction, actor) unless group.fully_credited_at
          elsif group.fully_credited_at
            group.update!(fully_credited_at: nil)
            settled = PayrollExpenseReservation.active.where(payroll_run_id: @run.id, employment_id: group.employment_id).where.not(settled_at: nil).pluck(:expense_id)
            instruction.payroll_payment_events.create!(kind: "group_credit_reopened", actor:, data: { "settled_expense_ids" => settled })
          end
        end
      end

      def settle_group(group, instruction, actor)
        group.update!(fully_credited_at: Time.current)
        instruction.payroll_payment_events.create!(kind: "group_fully_credited", actor:, data: {})
        PayrollExpenseReservation.unsettled.where(payroll_run_id: @run.id, employment_id: group.employment_id).find_each do |reservation|
          reservation.expense.mark_paid!(payroll_reservation: reservation)
          reservation.update!(settled_at: Time.current)
        end
      end

      def credit_minor(amount)
        raise MercuryPayment::Blocked.new("credit_amount_invalid") unless amount.is_a?(String) && amount.match?(MONEY_FORMAT)

        minor = (BigDecimal(amount) * 100).to_i
        minor.positive? ? minor : raise(MercuryPayment::Blocked.new("credit_amount_invalid"))
      end

      def credit_date(value)
        date = Date.iso8601(value.to_s)
        date <= @run.company.resolved_time_zone.today ? date : raise(MercuryPayment::Blocked.new("credit_date_invalid"))
      rescue Date::Error
        raise MercuryPayment::Blocked.new("credit_date_invalid"), cause: nil
      end

      def duplicate_credit?(instruction, minor, reference)
        instruction.payroll_payment_events.where(kind: "credit_recorded")
          .where("data->>'reference' = ? AND (data->>'amount_minor')::bigint = ?", reference, minor).exists?
      end
  end
end
