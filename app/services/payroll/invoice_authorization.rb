# frozen_string_literal: true

class Payroll::InvoiceAuthorization
  STATEMENT_VERSION = "miru-consultant-invoice-authorization-v1"
  STATEMENT_TEXT = "I authorize Miru to generate invoices on my behalf for my consultancy services recorded in this workspace. I can withdraw this authorization for future invoices."
  PAGE_SIZE = 20

  def initialize(employment, actor: nil)
    @employment, @actor = employment, actor
    @company = employment.company
  end

  def summary(before_id: nil)
    authorize!(:show?)
    cursor = record_id(before_id, blank: true)
    @employment.with_lock do
      authorize!(:show?)
      summary_data(cursor)
    end
  end

  def record!(action:, expected_event_id:, statement_digest:, idempotency_key:)
    authorize!(:record?)
    previous_id = record_id(expected_event_id, blank: true)
    command = command_digest(action, expected_event_id, statement_digest, idempotency_key)
    saved = @employment.with_lock do
      authorize!(:record?)
      append_event!(action, previous_id, statement_digest, idempotency_key, command)
    end
    result = summary
    result.merge(recorded_event: event_details(saved).merge(current: result.dig(:current_event, :id) == saved.id.to_s))
  end

  # Future issuance must keep the caller's employment lock held through invoice creation.
  def receipt
    return unless Payroll::Entitlement.enabled?(@company.id)
    return unless Employment.kept.exists?(id: @employment.id, company_id: @company.id, user_id: @employment.user_id) && User.kept.exists?(id: @employment.user_id)

    event = events.heads.first
    event if authorization_status(event) == "granted" && event.actor_id == @employment.user_id
  end

  def authorized?
    receipt.present?
  end

  private

    def summary_data(cursor)
      raise ActiveRecord::RecordNotFound if cursor && !events.exists?(id: cursor)

      head = events.heads.first
      history = events.order(id: :desc)
      history = history.where("id < ?", cursor) if cursor
      page = history.limit(PAGE_SIZE + 1).to_a
      status = authorization_status(head)
      { company_id: @company.id, employment_id: @employment.id, user_id: @employment.user_id, consultant_name: @employment.user.full_name,
        status:, statement:, current_event: head && event_details(head), history: page.first(PAGE_SIZE).map { |event| event_details(event) },
        next_before_id: page.size > PAGE_SIZE ? page[PAGE_SIZE - 1].id.to_s : nil,
        can_grant: policy.grant? && status != "granted", can_withdraw: policy.withdraw? }
    end

    def append_event!(action, previous_id, statement_digest, idempotency_key, command)
      existing = events.find_by(idempotency_key:)
      if existing
        unless existing.actor_id == @actor.id && existing.command_digest == command
          raise Payroll::Workflow::Conflict, "Authorization command was already used differently"
        end
        return existing
      end
      head = events.heads.first
      raise Payroll::Workflow::Conflict, "Authorization changed; refresh its latest receipt" unless head&.id == previous_id

      values = statement_for(action, statement_digest, head)
      events.create!(company: @company, employment: @employment, actor: @actor, action:, previous_event: head,
        statement_version: values[:version], statement_text: values[:text], statement_digest: values[:digest], command_digest: command, idempotency_key:)
    end

    def statement
      { version: STATEMENT_VERSION, text: STATEMENT_TEXT, digest: Digest::SHA256.hexdigest(JSON.generate([STATEMENT_VERSION, STATEMENT_TEXT])) }
    end

    def events
      ConsultantInvoiceAuthorization.where(company_id: @company.id, employment_id: @employment.id)
    end

    def policy
      ConsultantInvoiceAuthorizationPolicy.new(@actor, @employment)
    end

    def authorize!(operation)
      raise Payroll::Workflow::NotAuthorized, "Invoice authorization is private to its consultant and authorized reviewers" unless policy.public_send(operation)
    end

    def record_id(value, blank: false)
      return if blank && (value.nil? || value == "")
      unless value.is_a?(String) && value.match?(/\A[1-9]\d{0,18}\z/) && value.to_i <= 9_223_372_036_854_775_807
        raise Payroll::ConsultantReview::InvalidInput, "Use an exact receipt identifier"
      end
      value.to_i
    end

    def command_digest(action, previous, digest, key)
      valid_digest = digest.is_a?(String) && (digest.match?(/\A[0-9a-f]{64}\z/) || action == "withdraw" && digest.empty?)
      unless %w[grant withdraw].include?(action) && previous.is_a?(String) && valid_digest && key.is_a?(String) && key.length.between?(1, 128)
        raise Payroll::ConsultantReview::InvalidInput, "Choose an explicit authorization action and its current receipt"
      end
      Digest::SHA256.hexdigest(JSON.generate([action, previous, action == "grant" ? digest : nil]))
    end

    def statement_for(action, digest, head)
      if action == "grant"
        authorize!(:grant?)
        raise Payroll::Workflow::Conflict, "Authorization statement changed; read the current statement" unless digest == statement[:digest]
        raise Payroll::Workflow::Conflict, "Invoice authorization is already granted" if authorization_status(head) == "granted"

        statement
      else
        raise Payroll::Workflow::Conflict, "No current grant is available to withdraw" unless head&.action == "grant"
        authorize!(:withdraw?)
        { version: head.statement_version, text: head.statement_text, digest: head.statement_digest }
      end
    end

    def authorization_status(event)
      return "not_granted" unless event
      return "withdrawn" if event.action == "withdraw"
      return "reauthorization_required" unless event.actor_id == @employment.user_id

      expected = statement
      event.statement_version == expected[:version] && event.statement_text == expected[:text] && event.statement_digest == expected[:digest] ? "granted" : "reauthorization_required"
    end

    def event_details(event)
      { id: event.id.to_s, action: event.action, actor_id: event.actor_id.to_s, created_at: event.created_at.iso8601(6),
        statement_version: event.statement_version, statement_text: event.statement_text, statement_digest: event.statement_digest,
        previous_event_id: event.previous_event_id&.to_s }
    end
end
