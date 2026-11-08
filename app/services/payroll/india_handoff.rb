# frozen_string_literal: true

module Payroll
  class IndiaHandoff
    MONEY_FORMAT = /\A\d{1,12}(?:\.\d{1,2})?\z/

    def self.line_digest(line)
      normalized = line.deep_dup
      normalized["source_snapshot"]&.delete("captured_at")
      Digest::SHA256.hexdigest(JSON.generate(canonical(normalized)))
    end

    def self.canonical(value)
      case value
      when Hash then value.sort.to_h.transform_values { |entry| canonical(entry) }
      when Array then value.map { |entry| canonical(entry) }
      else value
      end
    end
    private_class_method :canonical

    def initialize(run)
      @run = run
    end

    def preview(employment_id:)
      Entitlement.require!(@run.company_id)
      employment_id = record_id(employment_id, "employment_id_invalid")
      employment = Employment.where(company_id: @run.company_id).find(employment_id)
      head = @run.current_revision
      line = head&.payroll_payload&.fetch("lines", [])&.find { |entry| entry["employment_id"] == employment.id }
      codes, terms = readiness(employment, line)
      { report: codes.empty? ? IndiaReport.new(@run, employment:, line:, terms:).call : nil, blockers: codes }
    end

    def create!(actor:, employment_id:, expected_digest:, accounts_email:, bank_confirmed:)
      Entitlement.require!(@run.company_id)
      @run.with_lock do
        authorize!(actor, "final")
        conflict!("Revision changed; reload before sending") unless @run.current_revision&.digest == expected_digest
        blocked!("bank_confirmation_required") unless bank_confirmed == true
        blocked!("accounts_email_invalid") unless valid_mailbox?(accounts_email)
        report = queue_report!(employment_id, accounts_email)
        existing = handoffs.active.find_by(employment_id:)
        if existing
          conflict!("An active handoff already exists with a different report") unless existing.report == report
          return existing
        end
        handoff = handoffs.create!(company_id: @run.company_id, payroll_revision: @run.current_revision,
          employment_id:, created_by: actor, consultant_compensation_id: report["terms_id"], report:,
          line_digest: report["line_digest"], bank_digest: report["bank_digest"], entitlement_minor: report["entitlement_minor"])
        handoff.payroll_india_deliveries.create!(attempt_number: 1)
        handoff
      end
    rescue ActiveRecord::RecordNotUnique
      conflict!("An active handoff already exists")
    end

    def dispatch_blocker(handoff)
      return "payroll_disabled" unless Entitlement.enabled?(@run.company_id)
      return "handoff_voided" if handoff.released_at
      return "creator_no_longer_authorized" unless authorized?(User.find_by(id: handoff.created_by_id), "final")

      prepared = preview(employment_id: handoff.employment_id)
      return prepared[:blockers].first if prepared[:blockers].any?

      current = prepared.fetch(:report)
      return "approved_line_changed" unless current["line_digest"] == handoff.line_digest
      return "terms_changed" unless current["terms_id"] == handoff.consultant_compensation_id
      return "bank_details_changed" unless current["bank_digest"] == handoff.bank_digest

      nil
    rescue ActiveRecord::RecordNotFound
      "consultant_inactive"
    end

    def retry!(actor:, handoff_id:)
      mutate(handoff_id) do |handoff, attempt|
        authorize!(actor, "final")
        blocked!("delivery_not_retryable") unless !handoff.released_at && handoff.credited_minor.zero? && attempt&.state == "failed"
        blocker = dispatch_blocker(handoff)
        blocked!(blocker) if blocker
        handoff.payroll_india_deliveries.create!(attempt_number: attempt.attempt_number + 1)
      end
    end

    def void!(actor:, handoff_id:)
      mutate(handoff_id) do |handoff, attempt|
        authorize!(actor, "final")
        blocked!("handoff_not_voidable") unless !handoff.released_at && handoff.credited_minor.zero? && %w[queued failed].include?(attempt&.state)
        handoff.update!(released_at: Time.current)
      end
    end

    def reconcile_delivery!(actor:, handoff_id:, outcome:, evidence_reference:, worker_stopped:)
      mutate(handoff_id) do |handoff, attempt|
        authorize!(actor, "accounts")
        blocked!("delivery_not_uncertain") unless !handoff.released_at && attempt&.state == "uncertain"
        blocked!("worker_stop_confirmation_required") unless worker_stopped == true
        blocked!("delivery_evidence_required") unless evidence_reference.is_a?(String) && evidence_reference.strip.length.between?(1, 200) && !evidence_reference.match?(/[\r\n\x00]/)
        blocked!("delivery_outcome_invalid") unless %w[delivered not_delivered].include?(outcome)
        sent = outcome == "delivered"
        attempt.update!(state: sent ? "sent" : "failed", sent_at: sent ? Time.current : nil,
          error_code: sent ? nil : "delivery_confirmed_absent", review_evidence: evidence_reference.strip,
          reviewed_by: actor, reviewed_at: Time.current)
      end
    end

    def record_credit!(actor:, handoff_id:, amount:, credited_on:, reference:)
      mutate(handoff_id) do |handoff, attempt|
        authorize!(actor, "accounts")
        values = credit_values(amount, credited_on, reference)
        existing = PayrollIndiaCredit.find_by(company_id: @run.company_id, reference_digest: values[:reference_digest])
        if existing
          unless existing.payroll_india_handoff_id == handoff.id && existing.amount_minor == values[:amount_minor] && existing.credited_on == values[:credited_on]
            conflict!("Credit reference conflicts with the recorded transfer")
          end
          settle_if_complete!(handoff)
          next
        end
        blocked!("delivery_not_confirmed") unless !handoff.released_at && attempt&.state == "sent"
        handoff.payroll_india_credits.create!(**values, company_id: @run.company_id, actor:)
        handoff.update!(credited_minor: handoff.payroll_india_credits.sum(:amount_minor))
        settle_if_complete!(handoff)
      end
    rescue ActiveRecord::RecordNotUnique
      conflict!("Credit reference conflicts with the recorded transfer")
    end

    private

      def handoffs
        PayrollIndiaHandoff.where(company_id: @run.company_id, payroll_run_id: @run.id)
      end

      def mutate(id)
        Entitlement.require!(@run.company_id)
        id = record_id(id, "handoff_id_invalid")
        @run.with_lock do
          handoff = handoffs.lock.find(id)
          attempt = handoff.payroll_india_deliveries.order(attempt_number: :desc).lock.first
          yield handoff, attempt
          handoff
        end
      end

      def authorized?(actor, stage)
        actor && (stage != "accounts" || actor.id == @run.accounts_reviewer_id) && @run.eligible_actor?(actor, stage) &&
          User.kept.exists?(id: actor.id, current_workspace_id: @run.company_id)
      end

      def authorize!(actor, stage)
        raise Workflow::NotAuthorized, "An active #{stage == 'final' ? 'owner' : 'assigned accounts reviewer'} in this workspace is required" unless authorized?(actor, stage)
      end

      def readiness(employment, line)
        codes = line_blockers(line)
        config = ActiveRecord::Encryption.config
        codes << "payroll_reference_key_missing" unless config.has_deterministic_key? && config.deterministic_key.is_a?(String)
        codes << "run_not_approved" unless Workflow.new(@run).status == "approved"
        sources = ConsultantSources.new(company: @run.company, employments: [employment], month: @run.period)
        terms = sources.terms(employment.id)
        codes << "terms_missing" unless terms
        codes << "funding_not_india" if terms && terms.payment_source != "india"
        codes << "terms_changed_during_month" if sources.terms_changed?(employment.id)
        codes << "consultant_inactive" if employment.discarded? || !User.kept.exists?(id: employment.user_id)
        codes << "bank_profile_incomplete" unless IndiaReport.bank_complete?(IndiaReport.bank_details(employment))
        codes << "mercury_activity_exists" if PayrollPaymentInstruction.where(payroll_run_id: @run.id, employment_id: employment.id).exists?
        codes << "split_not_supported" if PayrollSplitArrangement.current_for(employment)
        [codes, terms]
      end

      def line_blockers(line)
        return ["line_not_in_revision"] unless line

        codes = []
        codes << "not_consultant_line" if line["pay_type"] != "consultant"
        codes << "unsupported_currency" if line["currency"] != "INR"
        codes << "invalid_net_amount" unless line.dig("amounts", "net_minor").is_a?(Integer) && line.dig("amounts", "net_minor").positive?
        codes
      end

      def queue_report!(employment_id, accounts_email)
        prepared = preview(employment_id:)
        blocked!(prepared[:blockers]) if prepared[:blockers].any?
        prepared.fetch(:report).merge("accounts_email" => accounts_email.strip)
      end

      def valid_mailbox?(value)
        value.is_a?(String) && value.strip.length.between?(3, 254) && value.strip.match?(URI::MailTo::EMAIL_REGEXP) &&
          !value.match?(/[\r\n\x00,;<>\s]/)
      end

      def record_id(value, code)
        valid = value.is_a?(Integer) || (value.is_a?(String) && value.match?(/\A[1-9]\d{0,18}\z/))
        blocked!(code) unless valid && value.to_i.between?(1, 9_223_372_036_854_775_807)
        value.to_i
      end

      def credit_minor(amount)
        blocked!("credit_amount_invalid") unless amount.is_a?(String) && amount.match?(MONEY_FORMAT)
        minor = (BigDecimal(amount) * 100).to_i
        blocked!("credit_amount_invalid") unless minor.positive?
        minor
      end

      def credit_date(value)
        blocked!("credit_date_invalid") unless value.is_a?(String) && value.match?(/\A\d{4}-\d{2}-\d{2}\z/)
        date = Date.iso8601(value)
        blocked!("credit_date_invalid") if date > @run.company.resolved_time_zone.today || date < @run.period
        date
      rescue Date::Error
        blocked!("credit_date_invalid")
      end

      def reference_digest(value)
        # Session-key rotation must not make a recorded bank transfer look new.
        key = ActiveRecord::Encryption.config.deterministic_key
        unless key.is_a?(String) && key.present?
          raise ActiveRecord::Encryption::Errors::Configuration, "A stable payroll reference key is required"
        end
        OpenSSL::HMAC.hexdigest("SHA256", key, "payroll_india_credit_reference:v1:#{value}")
      end

      def credit_values(amount, credited_on, reference)
        normalized = reference.is_a?(String) ? reference.unicode_normalize(:nfkc).gsub(/[[:space:]]/, "").upcase : ""
        blocked!("credit_reference_invalid") unless normalized.length.between?(1, 200) && !normalized.match?(/[\x00-\x1f\x7f]/)
        { amount_minor: credit_minor(amount), credited_on: credit_date(credited_on), reference: normalized,
          reference_digest: reference_digest(normalized) }
      end

      def settle!(handoff)
        entries = handoff.report.fetch("line").fetch("reimbursements").filter_map do |entry|
          id = ClaimReference.expense_id(entry["source_reference"])
          [id, entry] if id
        end
        reservations = PayrollExpenseReservation.active.where(company_id: @run.company_id, payroll_run_id: @run.id,
          employment_id: handoff.employment_id).order(:expense_id).lock.to_a
        unless reservations.map(&:expense_id) == entries.map(&:first).sort
          conflict!("Reserved reimbursements differ from the approved report")
        end
        entries.sort_by(&:first).each do |id, entry|
          reservation = reservations.find { |item| item.expense_id == id && item.amount_minor == entry["amount_minor"] }
          conflict!("A reserved reimbursement changed") unless reservation
          next if reservation.settled_at
          settle_reservation!(handoff, reservation, entry)
        end
        handoff.update!(fully_credited_at: Time.current)
      end

      def settle_reservation!(handoff, reservation, entry)
        expense = reservation.expense
        expense.lock!
        unless ClaimReference.current?(@run, expense, entry["source_reference"], handoff.employment)
          conflict!("A reserved reimbursement changed; reconcile it before recording credit")
        end
        expense.mark_paid!(payroll_reservation: reservation)
        reservation.update!(settled_at: Time.current)
      end

      def settle_if_complete!(handoff)
        return unless handoff.settlement_blocked?

        PayrollExpenseReservation.transaction(requires_new: true) { settle!(handoff) }
      rescue Workflow::Conflict, ActiveRecord::RecordNotFound, ActiveRecord::RecordInvalid
        # Actual bank credit remains recorded when reimbursement settlement needs review.
        handoff.reload
      end

      def blocked!(code)
        raise MercuryPayment::Blocked.new(code)
      end

      def conflict!(message)
        raise Workflow::Conflict, message, cause: nil
      end
  end
end
