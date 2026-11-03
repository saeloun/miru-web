# frozen_string_literal: true

module Payroll
  class MercuryPayment
    class Blocked < StandardError
      attr_reader :codes

      def initialize(codes)
        @codes = Array(codes)
        super("Mercury payment is blocked: #{@codes.join(', ')}")
      end
    end

    BUFFER = BigDecimal("1.50")
    RATE_FORMAT = /\A\d{1,6}(\.\d{1,6})?\z/
    QUOTE_VALIDITY = 24.hours
    FUTURE_TOLERANCE = 5.minutes
    PLAUSIBLE_RATE = (BigDecimal("50")..BigDecimal("200"))
    DEFINITIVE_FIRST_ATTEMPT_STATUSES = [404].freeze
    Contract = PayrollProviders::MercuryContract

    def self.fresh_exchange_rate(company)
      row = ExchangeRate.between("USD", "INR").order(date: :desc).first
      row if row && row.updated_at > QUOTE_VALIDITY.ago && row.date >= company.resolved_time_zone.today - 1
    end

    def initialize(run)
      @run = run
      @company_id = run.company_id
    end

    def prepare!(actor:, employment_id:, expected_digest:, quote:)
      Entitlement.require!(@company_id)
      @run.with_lock do
        authorize_owner!(actor)
        head = @run.current_revision
        raise Workflow::Conflict, "Revision changed; reload before preparing" unless head&.digest == expected_digest

        employment = Employment.where(company_id: @company_id).find(employment_id)
        readiness = MercuryReadiness.new(@run, head)
        raise_if_blocked(readiness.line_blockers(employment))
        create_missing_legs!(actor, head, employment, readiness, quote)
      end
    rescue ActiveRecord::RecordNotUnique
      raise Workflow::Conflict, "This payment was prepared already; reload", cause: nil
    end

    def submit!(actor:, instruction_id:, expected_digest:)
      Entitlement.require!(@company_id)
      instruction = find_instruction(instruction_id)
      @run.with_lock do
        instruction.lock!
        check_submittable!(actor, instruction, expected_digest)
      end
      raise_if_blocked(absence_blockers(instruction))
      provider_state = fresh_provider_state(instruction)
      begin_submission!(actor, instruction, expected_digest, provider_state)
      dispatch(instruction)
    end

    def void!(actor:, instruction_id:)
      Entitlement.require!(@company_id)
      instruction = find_instruction(instruction_id)
      authorize_owner!(actor)
      raise_if_blocked(state_blockers(instruction) + attester_blockers(instruction, actor))
      raise_if_blocked(absence_blockers(instruction))
      @run.with_lock do
        authorize_owner!(actor)
        instruction.lock!
        raise_if_blocked(state_blockers(instruction) + attester_blockers(instruction, actor))
        instruction.update!(submission_state: "voided", released_at: Time.current)
        record_event(instruction, "voided", actor)
      end
      instruction
    end

    private

      def authorize_owner!(actor)
        unless @run.eligible_actor?(actor, "final") && User.kept.exists?(id: actor.id, current_workspace_id: @company_id)
          raise Workflow::NotAuthorized, "An active owner in this workspace is required"
        end
      end

      def find_instruction(id)
        PayrollPaymentInstruction.where(company_id: @company_id, payroll_run_id: @run.id).find(id)
      end

      def raise_if_blocked(codes)
        raise Blocked.new(codes) if codes.any?
      end

      def attester_blockers(instruction, actor)
        instruction.retry_unlocked? && instruction.absent_confirmed_by_id == actor.id ? ["attester_cannot_retry"] : []
      end

      def absence_blockers(instruction)
        instruction.retry_unlocked? ? MercuryReconciliation.new(@run).absence_blockers(instruction) : []
      end

      def create_missing_legs!(actor, head, employment, readiness, quote)
        line = readiness.line(employment)
        arrangement = readiness.active_arrangement(employment)
        allocations = ConsultantAllocation.call(line:, arrangement:)
        group = current_group!(head, employment, line, arrangement, allocations)
        open_beneficiaries = group.open_legs.pluck(:beneficiary)
        missing = allocations.reject { |allocation| open_beneficiaries.include?(allocation.beneficiary) }
        raise Workflow::Conflict, "Every transfer for this consultant is already prepared; reload" if missing.empty?

        rate = quote_values(actor, quote)
        principals = missing.index_with { |allocation| principal_for(allocation.amount_minor, rate[:buffered_rate]) }
        missing.map { |allocation| create_leg!(actor, head, employment, readiness, group, allocation, rate, principals[allocation]) }
      end

      def current_group!(head, employment, line, arrangement, allocations)
        digest = PayrollPaymentGroup.line_digest(line)
        group = PayrollPaymentGroup.find_or_initialize_by(company_id: @company_id, payroll_run_id: @run.id, employment_id: employment.id)
        if group.persisted? && group.in_flight_legs.exists? && (group.line_digest != digest || group.split_arrangement_id != arrangement&.id)
          raise Blocked.new("bank_activity_requires_same_amounts")
        end
        raise Blocked.new("void_stale_transfer_first") if group.persisted? && stale_open_leg?(group, allocations)

        group.update!(payroll_revision: head, split_arrangement: arrangement, line_digest: digest, required_legs: allocations.size,
          entitlement_minor: line.dig("amounts", "net_minor"), reimbursement_minor: line.dig("amounts", "reimbursements_minor"))
        group
      end

      def stale_open_leg?(group, allocations)
        expected = allocations.to_h { |allocation| [allocation.beneficiary, allocation.amount_minor] }
        group.open_legs.any? { |leg| expected[leg.beneficiary] != leg.entitlement_minor }
      end

      def create_leg!(actor, head, employment, readiness, group, allocation, rate, principal)
        beneficiary = allocation.beneficiary
        connection = readiness.connection
        link = PayrollMercuryRecipientLink.current_for(employment, beneficiary)
        fee = connection.wire_fee_minor
        instruction = PayrollPaymentInstruction.create!(
          rate.merge(company_id: @company_id, payroll_payment_group: group, payroll_run: @run, payroll_revision: head, employment:, prepared_by: actor,
            beneficiary:, consultant_compensation: readiness.terms(employment), recipient_link: link, connection_version: connection.credential_version,
            environment: connection.environment, source_account_id: connection.source_account_id, revision_digest: head.digest,
            bank_details_digest: link.bank_details_digest, recipient_digest: link.recipient_digest, mercury_recipient_id: link.mercury_recipient_id,
            entitlement_minor: allocation.amount_minor, entitlement_currency: "INR", principal_minor: principal, fee_minor: fee,
            company_debit_minor: principal + fee, charge_type: PayrollPaymentInstruction::CHARGE_TYPE,
            purpose_category: PayrollPaymentInstruction::PURPOSE_CATEGORY,
            purpose_info: MercurySetup.bank_details(employment).fetch("bank_account_name"),
            idempotency_key: "miru-payroll-#{SecureRandom.uuid}")
        )
        record_event(instruction, "prepared", actor)
        instruction
      end

      def principal_for(amount_minor, buffered)
        principal = (BigDecimal(amount_minor) / buffered).round(0, BigDecimal::ROUND_HALF_UP).to_i
        raise Blocked.new("principal_out_of_range") unless principal.between?(1, PayrollPaymentInstruction::MAX_PRINCIPAL_MINOR)

        principal
      end

      def quote_values(actor, quote)
        values = quote[:mode] == "exchange_rate" ? stored_rate : manual_rate(actor, quote)
        buffered = values[:reference_rate] - BUFFER
        raise Blocked.new("rate_not_positive") unless buffered.positive?
        raise Blocked.new("rate_implausible") unless PLAUSIBLE_RATE.cover?(values[:reference_rate])

        values.merge(buffered_rate: buffered, rate_valid_until: values[:rate_observed_at] + QUOTE_VALIDITY)
      end

      def stored_rate
        row = self.class.fresh_exchange_rate(@run.company)
        raise Blocked.new("rate_unavailable") unless row

        { reference_rate: BigDecimal(row.rate.to_s), rate_source: "Miru exchange rates (#{row.source}, #{row.date.iso8601})".first(100),
          rate_mode: "exchange_rate", rate_observed_at: row.updated_at.utc.change(usec: 0) }
      end

      def manual_rate(actor, quote)
        value = quote[:reference_rate]
        raise Blocked.new("rate_invalid") unless value.is_a?(String) && value.match?(RATE_FORMAT)

        source = quote[:source]
        raise Blocked.new("rate_source_missing") unless source.is_a?(String) && source.strip.length.between?(1, 100)

        { reference_rate: BigDecimal(value), rate_source: source.strip, rate_mode: "manual", rate_entered_by: actor,
          rate_observed_at: observed_time(quote[:observed_at]) }
      end

      def observed_time(value)
        observed = Time.iso8601(value.to_s).utc.change(usec: 0)
        unless observed > QUOTE_VALIDITY.ago && observed <= FUTURE_TOLERANCE.from_now
          raise Blocked.new("rate_stale_or_future")
        end

        observed
      rescue ArgumentError
        raise Blocked.new("rate_invalid"), cause: nil
      end

      def check_submittable!(actor, instruction, expected_digest)
        authorize_owner!(actor)
        raise Blocked.new("writes_disabled") unless MercuryWrites.enabled?(@company_id, instruction.environment)
        raise Workflow::Conflict, "This payment changed; reload before submitting" unless instruction.frozen_digest == expected_digest

        raise_if_blocked(state_blockers(instruction) + local_blockers(instruction) + attester_blockers(instruction, actor))
      end

      def state_blockers(instruction)
        return ["instruction_closed"] if instruction.released_at

        case instruction.submission_state
        when "prepared" then []
        when "submitting" then ["submission_in_progress"]
        when "uncertain" then instruction.retry_unlocked? ? [] : ["reconcile_before_retry"]
        when "accepted" then ["already_submitted"]
        else ["instruction_closed"]
        end
      end

      def local_blockers(instruction)
        return ["instruction_tampered"] unless instruction.intact?

        head = @run.current_revision
        readiness = MercuryReadiness.new(@run, head)
        employment = instruction.employment
        codes = Workflow.new(@run).status == "approved" ? [] : ["run_not_approved"]
        codes << "revision_changed" unless head&.id == instruction.payroll_revision_id && head.digest == instruction.revision_digest
        codes << "consultant_inactive" if employment.discarded?
        codes << "terms_changed" unless readiness.terms(employment)&.id == instruction.consultant_compensation_id
        codes << "split_changed" unless readiness.active_arrangement(employment)&.id == instruction.payroll_payment_group.split_arrangement_id
        codes << "connection_changed" unless connection_current?(instruction, readiness.connection)
        codes.concat(beneficiary_blockers(employment, instruction, readiness))
        codes << "allocation_changed" unless allocation_current?(employment, instruction, readiness)
        codes << "quote_expired" if instruction.rate_valid_until <= Time.current
        codes
      end

      def allocation_current?(employment, instruction, readiness)
        line = readiness.line(employment)
        return false unless line

        allocations = ConsultantAllocation.call(line:, arrangement: readiness.active_arrangement(employment))
        allocations.any? { |allocation| allocation.beneficiary == instruction.beneficiary && allocation.amount_minor == instruction.entitlement_minor }
      rescue Blocked
        false
      end

      def beneficiary_blockers(employment, instruction, readiness)
        beneficiary = instruction.beneficiary
        details = MercurySetup.bank_details(employment, beneficiary, arrangement: readiness.active_arrangement(employment))
        codes = MercurySetup.digest(details.sort.to_h) == instruction.bank_details_digest ? [] : ["bank_details_changed"]
        codes << "recipient_changed" unless PayrollMercuryRecipientLink.current_for(employment, beneficiary)&.id == instruction.recipient_link_id
        codes
      end

      def connection_current?(instruction, connection)
        connection&.read_verified? && connection.credential_version == instruction.connection_version &&
          connection.source_account_id == instruction.source_account_id && connection.environment == instruction.environment
      end

      def fresh_provider_state(instruction)
        connection = PayrollMercuryConnection.find_by!(company_id: @company_id)
        { recipient_digest: fresh_recipient_digest(connection, instruction), balance: fresh_balance(connection) }
      end

      def fresh_recipient_digest(connection, instruction)
        recipient = Contract.recipient(connection.client.recipient(instruction.mercury_recipient_id))
        recipient.status == "active" ? MercurySetup.recipient_digest(recipient) : nil
      rescue PayrollProviders::Error
        raise Blocked.new("recipient_check_failed")
      end

      def fresh_balance(connection)
        connection.balance_adapter.fetch_balance(company_id: @company_id, currency: "USD")
      rescue PayrollProviders::Error
        raise Blocked.new("source_account_ineligible")
      end

      def begin_submission!(actor, instruction, expected_digest, provider_state)
        @run.with_lock do
          instruction.lock!
          instruction.employment.lock!
          check_submittable!(actor, instruction, expected_digest)
          raise Blocked.new("recipient_changed") unless provider_state[:recipient_digest] == instruction.recipient_digest

          raise_if_blocked(balance_blockers(instruction, provider_state[:balance]))
          instruction.update!(submission_state: "submitting", submission_attempts: instruction.submission_attempts + 1,
            submission_started_at: Time.current, absent_confirmed_at: nil, absent_confirmed_by: nil, submitted_by: actor, last_error_code: nil)
          record_event(instruction, "submission_started", actor, "attempt" => instruction.submission_attempts)
        end
      end

      def balance_blockers(instruction, balance)
        connection = PayrollMercuryConnection.find_by!(company_id: @company_id)
        result = PayrollProviders::LocalPreflight.call(
          balance:,
          binding: { provider: "mercury", company_id: @company_id, currency: "USD",
                     account_reference: connection.account_reference, environment: connection.environment },
          amounts: { total_minor_units: instruction.principal_minor, fees_minor_units: instruction.fee_minor,
                     reserve_minor_units: other_open_debits(instruction) },
          review: { reviewed_revision_digest: instruction.revision_digest, current_revision_digest: @run.current_revision&.digest,
                    accounts_approved: true, final_approved: true, capabilities_verified: true, recipients_verified: true }
        )
        result[:blockers].to_a
      end

      def other_open_debits(instruction)
        PayrollPaymentInstruction.open_slot.where(company_id: @company_id, source_account_id: instruction.source_account_id)
          .where(submission_state: %w[submitting uncertain accepted], transaction_status: [nil, "pending"])
          .where.not(id: instruction.id).sum(:company_debit_minor).to_i
      end

      def dispatch(instruction)
        connection = PayrollMercuryConnection.find_by!(company_id: @company_id)
        response = connection.client.create_send_money_request(account_id: instruction.source_account_id,
          amount_minor: instruction.principal_minor, body: instruction.provider_body)
        record_response(instruction, response)
      rescue PayrollProviders::MercuryClient::Rejected => error
        record_rejection(instruction, error.status)
      rescue PayrollProviders::Error
        record_uncertain(instruction, "outcome_unknown")
      end

      def record_response(instruction, response)
        parsed = Contract.send_money_request(response)
        unless instruction.matches_request?(parsed) && !claimed_request?(instruction, parsed.request_id)
          return record_uncertain(instruction, "response_mismatch", request_id: parsed.request_id)
        end

        MercuryReconciliation.accept!(instruction, parsed, actor: instruction.submitted_by, event: "submission_accepted")
      rescue PayrollProviders::MercuryClient::Malformed
        record_uncertain(instruction, "response_malformed", request_id: Contract.request_id(response))
      end

      def claimed_request?(instruction, request_id)
        PayrollPaymentInstruction.where(company_id: @company_id, provider_request_id: request_id).where.not(id: instruction.id).exists?
      end

      def record_rejection(instruction, status)
        return record_uncertain(instruction, "provider_returned_#{status}") unless
          instruction.submission_attempts == 1 && DEFINITIVE_FIRST_ATTEMPT_STATUSES.include?(status)

        instruction.with_lock do
          instruction.update!(submission_state: "rejected", last_error_code: "provider_returned_#{status}", released_at: Time.current)
          record_event(instruction, "submission_rejected", instruction.submitted_by, "status" => status)
        end
        instruction
      end

      def record_uncertain(instruction, code, request_id: nil)
        instruction.with_lock do
          known = request_id && !claimed_request?(instruction, request_id)
          instruction.update!({ submission_state: "uncertain", last_error_code: code }.merge(known ? { provider_request_id: request_id } : {}))
          record_event(instruction, "submission_uncertain", instruction.submitted_by, "code" => code)
        end
        instruction
      end

      def record_event(instruction, kind, actor, data = {})
        instruction.payroll_payment_events.create!(kind:, actor:, data:)
      end
  end
end
