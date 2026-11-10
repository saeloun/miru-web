# frozen_string_literal: true

class Payroll::ProfileCompletion
  def initialize(run, actor: nil)
    @run, @actor = run, actor
  end

  # Show only consultant-actionable gaps and the receipt for that exact source.
  def summary(employment)
    source = current_source(employment)
    request = requests.where(employment:, source_digest: source[:source_digest]).order(id: :desc).first if source[:source_digest]
    source.merge(can_request: source[:categories].any? && PayrollRunPolicy.new(@actor, @run).show? && (!request || %w[skipped failed].include?(request.state)),
      request: request&.receipt)
  end

  # Replay the original command before checking newer facts, without granting any payroll approval.
  def create!(employment_id:, expected_digest:, idempotency_key:)
    authorize!
    unless (employment_id.is_a?(String) || employment_id.is_a?(Integer)) && employment_id.to_s.match?(/\A[1-9]\d{0,18}\z/) &&
        employment_id.to_i <= 9_223_372_036_854_775_807 && expected_digest.is_a?(String) && expected_digest.match?(/\A[0-9a-f]{64}\z/) &&
        idempotency_key.is_a?(String) && idempotency_key.match?(/\A[A-Za-z0-9][A-Za-z0-9_-]{0,127}\z/)
      raise Payroll::ConsultantReview::InvalidInput, "Use an exact profile-completion command and refresh the current details"
    end
    employment = @run.company.employments.kept.find(employment_id)
    command = Payroll::MercurySetup.digest([employment.id, expected_digest])
    @run.with_lock do
      employment.with_lock do
        authorize!
        existing = replay(idempotency_key, command)
        next existing if existing
        source = current_source(employment)
        raise Payroll::MercuryPayment::Blocked.new("profile_completion_unavailable") if source[:categories].empty?
        raise Payroll::Workflow::Conflict, "Profile details changed; refresh before requesting completion" unless source[:source_digest] == expected_digest
        if requests.where(employment:, source_digest: expected_digest).where.not(state: %w[skipped failed]).exists?
          raise Payroll::Workflow::Conflict, "A request already exists for these details; refresh to see its delivery status"
        end
        requests.create!(company: @run.company, employment:, recipient: employment.user, requested_by: @actor,
          idempotency_key:, command_digest: command, source_digest: expected_digest, categories: source[:categories])
      end
    end
  rescue ActiveRecord::RecordNotUnique
    raise Payroll::Workflow::Conflict, "A request already exists; refresh to see its delivery status"
  end

  # Source identities stay internal; the request and mail contain categories, never profile values.
  def current_source(employment)
    empty = { categories: [], source_digest: nil }
    return empty unless Payroll::Entitlement.enabled?(@run.company_id) && employment.company_id == @run.company_id &&
      Employment.kept.exists?(id: employment.id, company_id: @run.company_id, user_id: employment.user_id) && User.kept.exists?(id: employment.user_id)
    return empty if employment.joined_at && employment.joined_at > @run.period.end_of_month || employment.resigned_at && employment.resigned_at < @run.period

    terms = employment.consultant_compensations.where(effective_on: ..@run.period.end_of_month).order(effective_on: :desc, id: :desc).first
    return empty unless terms

    details = Payroll::MercurySetup.bank_details(employment)
    bank_complete = case terms.payment_source
                    when "mercury_us" then Payroll::MercurySetup.bank_profile_complete?(details)
                    when "india" then Payroll::IndiaReport.bank_complete?(details)
                    else true # Funding setup belongs to accounts; do not guess consultant bank requirements.
    end
    billing = Payroll::BillingIdentity.new(employment).completion_request_source
    categories = []
    categories << "bank_details" if !bank_complete && bank_self_service?(employment)
    categories << "billing_identity" unless billing.nil?
    return empty if categories.empty?

    { categories:, source_digest: Payroll::MercurySetup.digest([@run.company_id, @run.id, employment.id, employment.user_id,
      terms.id, categories, Payroll::MercurySetup.digest(details.sort.to_h), billing]) }
  end

  private

    # A reused key may recover its receipt but cannot authorize different request details.
    def replay(idempotency_key, command)
      existing = requests.find_by(requested_by: @actor, idempotency_key:)
      return unless existing
      raise Payroll::Workflow::Conflict, "This request key was already used for different details" unless existing.command_digest == command

      existing
    end

    def requests
      PayrollProfileCompletionRequest.where(company_id: @run.company_id, payroll_run: @run)
    end

    # Recheck membership under the run lock so a revoked reviewer cannot queue mail.
    def authorize!
      Payroll::Entitlement.require!(@run.company_id)
      raise Payroll::Workflow::NotAuthorized, "An owner or the assigned accounts reviewer is required" unless PayrollRunPolicy.new(@actor, @run).show?
    end

    # Match the bank form's active-staff access; historical billing uses its own policy.
    def bank_self_service?(employment)
      (employment.joined_at.nil? || employment.joined_at <= Date.current) && (employment.resigned_at.nil? || employment.resigned_at >= Date.current) &&
        employment.user.roles.where(resource_type: "Company", resource_id: employment.company_id, name: EmployeeRecordPolicy::STAFF_ROLES).exists?
    end
end
