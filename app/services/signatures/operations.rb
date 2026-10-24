# frozen_string_literal: true

class Signatures::Operations
  def initialize(record, actor:, attributes:)
    @record, @actor, @attributes = record, actor, attributes
  end

  def send_request
    change do |revision|
      unless revision.status == "approved" && revision.approved_by_id && revision.approved_at &&
          revision.approval_digest == revision.content_digest && revision.ready_errors.empty?
        raise SignatureRequest::Conflict, "Record approval for this complete version before sending."
      end
      connection = SignatureConnection.active.find_by(company_id: @record.company_id)
      raise SignatureRequest::Conflict, "Connect this company's signing provider before sending." unless connection

      connection.client
      operation = create_operation(revision, "send")
      revision.update!(signature_connection: connection, operation_id: operation.key, send_started_at: Time.current, status: "sending")
      operation
    end
  rescue Signatures::DocumensoClient::ConfigurationError => error
    raise SignatureRequest::Conflict, error.message, cause: nil
  end

  def cancel
    change do |revision|
      unless %w[sending send_uncertain awaiting_signatures].include?(revision.status) &&
          [nil, "DRAFT", "PENDING"].include?(revision.provider_status)
        raise SignatureRequest::Conflict, "Only an in-progress signature request can be cancelled."
      end
      revision.update!(cancel_requested_at: revision.cancel_requested_at || Time.current, next_reminder_at: nil)
      previous = revision.signature_operations.where(kind: "cancel").order(id: :desc).first
      if previous && (previous.state != "failed" || previous.phase != "preparing")
        previous
      else
        create_operation(revision, "cancel")
      end
    end
  end

  def remind(automatic: false)
    change(automatic:) do |revision|
      unless revision.status == "awaiting_signatures" && revision.provider_status == "PENDING" && revision.cancel_requested_at.nil?
        raise SignatureRequest::Conflict, "Only pending signature requests can receive reminders."
      end
      if revision.last_reminder_at && revision.last_reminder_at > 24.hours.ago
        raise SignatureRequest::Conflict, "Wait 24 hours between reminders."
      end
      if automatic && (revision.next_reminder_at.nil? || revision.next_reminder_at > Time.current || revision.automatic_reminders_count >= 3)
        raise SignatureRequest::Conflict, "No automatic reminder is due."
      end
      count = revision.automatic_reminders_count + (automatic ? 1 : 0)
      revision.update!(last_reminder_at: Time.current, automatic_reminders_count: count,
        next_reminder_at: count < 3 ? 3.days.from_now : nil)
      create_operation(revision, "remind", automatic:)
    end
  end

  def refresh
    change do |revision|
      raise SignatureRequest::Conflict, "This version has not been queued for signing." unless revision.operation_id

      candidate = @attributes[:provider_envelope_id]
      if candidate && (!candidate.is_a?(String) || !Signatures::DocumensoClient::ID.match?(candidate) ||
          revision.provider_envelope_id && candidate != revision.provider_envelope_id)
        raise SignatureRequest::Conflict, "Choose the provider request for this version."
      end
      create_operation(revision, "refresh", phase: "checking", provider_candidate: candidate)
    end
  end

  def self.queue_due_reminders
    SignatureRequestRevision.where(status: "awaiting_signatures", provider_status: "PENDING", cancel_requested_at: nil)
      .where("next_reminder_at <= ? AND automatic_reminders_count < 3", Time.current).find_each do |revision|
      record = revision.signature_request
      actor = revision.signature_operations.find_by!(kind: "send").requested_by
      attributes = { company_id: record.company_id, lock_version: record.lock_version, revision_id: revision.id,
        content_digest: revision.content_digest }
      begin
        new(record, actor:, attributes:).remind(automatic: true)
      rescue SignatureRequest::Conflict
        next
      rescue Pundit::NotAuthorizedError
        record.with_lock do
          if revision.reload.next_reminder_at
            revision.update!(next_reminder_at: nil)
            record.audits.create!(action: "automatic_reminders_stopped", user: actor, associated: record.company,
              audited_changes: { revision_id: revision.id, reason: "not_authorized" })
          end
        end
      end
    end
  end

  private

    def change(automatic: false)
      operation = @actor.with_lock do
        @record.with_lock do
          policy = SignatureRequestPolicy.new(@actor, @record)
          authorized = automatic ? policy.administrator_of?(@record.company_id) : policy.update?
          raise Pundit::NotAuthorizedError unless authorized

          revision = @record.current_revision
          unless @attributes[:company_id] == @record.company_id && @attributes[:lock_version].is_a?(Integer) &&
              @attributes[:lock_version] == @record.lock_version && @attributes[:revision_id] == revision.id &&
              @attributes[:content_digest] == revision.content_digest
            raise SignatureRequest::Conflict, "This version changed. Reload before continuing."
          end
          result = yield revision
          @record.touch
          result
        end
      end
      operation.enqueue! if operation.state == "queued"
      operation
    end

    def create_operation(revision, kind, **attributes)
      operation = revision.signature_operations.create!(requested_by: @actor, kind:, **attributes)
      @record.audits.create!(action: "#{kind}_queued", user: @actor, associated: @record.company,
        audited_changes: { revision_id: revision.id, operation_key: operation.key })
      operation
    end
end
