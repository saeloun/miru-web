# frozen_string_literal: true

class Signatures::Delivery
  MUTATIONS = %w[creating distributing cancelling reminding].freeze
  PROVIDER_STATUSES = %w[DRAFT PENDING COMPLETED REJECTED CANCELLED].freeze

  def initialize(operation)
    @operation = operation
    @revision = operation.revision
    @record = @revision.signature_request
  end

  def process
    return unless claim

    case @operation.kind
    when "send" then send_request
    when "cancel" then cancel
    when "remind" then remind
    when "refresh" then refresh
    end
    queue_waiting_cancellation
  rescue Signatures::Envelope::Mismatch
    fail_operation("provider_mismatch")
  rescue Signatures::Envelope::InvalidConfiguration
    fail_operation("approval_changed")
  rescue Signatures::PdfInfo::InvalidDocument, Signatures::PdfInfo::Unavailable, Signatures::Upload::Unavailable,
      ActiveStorage::FileNotFoundError, IOError, SystemCallError
    fail_operation("source_unavailable")
  rescue Signatures::DocumensoClient::ConfigurationError
    fail_operation("connection_unavailable")
  rescue Signatures::DocumensoClient::Rejected, Signatures::DocumensoClient::Uncertain
    fail_operation("provider_uncertain", uncertain: MUTATIONS.include?(@operation.phase))
  rescue Signatures::DocumensoClient::Unavailable
    fail_operation("provider_unavailable", uncertain: MUTATIONS.include?(@operation.phase))
  end

  private

    def claim
      locked do
        next false unless @operation.state == "queued"

        @run_token = SecureRandom.uuid
        @operation.update!(state: "running", run_token: @run_token, error_code: nil, finished_at: nil)
        unless administrator?
          finish_locked("failed", "not_authorized")
          stop_undistributed("not_authorized") if @operation.kind == "send" && @operation.phase == "preparing"
          @revision.update!(next_reminder_at: nil) if @operation.kind == "remind"
          next false
        end
        true
      end
    end

    def locked
      @record.with_lock do
        @revision.reload
        @operation.reload
        yield
      end
    end

    def current_run?
      @operation.state == "running" && @operation.run_token == @run_token
    end

    def administrator?
      SignatureRequestPolicy.new(@operation.requested_by.reload, @record).administrator_of?(@record.company_id)
    end

    def approved_version?
      @record.current_revision_id == @revision.id && @revision.approved_by_id && @revision.approved_at &&
        @revision.approval_digest == @revision.content_digest && @revision.ready_errors.empty?
    end

    def client
      @client ||= @revision.signature_connection&.client ||
        raise(Signatures::DocumensoClient::ConfigurationError, "Signing connection unavailable")
    end

    def mutation(phase)
      locked do
        next false unless current_run?

        authorized = administrator?
        if !authorized || !approved_version?
          code = authorized ? "approval_changed" : "not_authorized"
          @operation.update!(state: "failed", error_code: code, finished_at: Time.current)
          stop_undistributed(code) if @operation.kind == "send" && %w[preparing verifying].include?(@operation.phase)
          @revision.update!(next_reminder_at: nil) if @operation.kind == "remind"
          next false
        end
        if @revision.cancel_requested_at && @operation.kind != "cancel"
          @operation.kind == "send" ? stop_undistributed("send_cancelled") : finish_locked("failed", "cancel_waiting")
          next false
        end
        @operation.update!(phase:)
        true
      end
    end

    def send_request
      if @operation.phase == "preparing"
        create_envelope
      end
      return unless locked { current_run? && @operation.phase == "verifying" }

      data, checked_at = observe(before_send: true)
      locked { apply_snapshot(data, checked_at) if current_run? }
      return unless mutation("distributing")

      client.distribute(@revision.provider_envelope_id)
      data, checked_at = observe
      raise Signatures::DocumensoClient::Uncertain if data["status"] == "DRAFT"

      locked { apply_snapshot(data, checked_at); finish_locked("confirmed") if current_run? }
    end

    def create_envelope
      files = original_files
      return unless mutation("creating")

      result = client.create(payload: Signatures::Envelope.new(@revision).payload(operation_id: @revision.operation_id), files:)
      locked do
        @revision.update!(provider_envelope_id: result.fetch("id")) unless @revision.provider_envelope_id
        @operation.update!(phase: "verifying") if current_run?
      end
    end

    def original_files
      @revision.documents.map do |document|
        bytes, = @revision.original_bytes(document.fetch("key"))
        Tempfile.create(["miru-signing", ".pdf"]) do |file|
          file.binmode
          file.write(bytes)
          file.flush
          info = Signatures::PdfInfo.new(file.path).process
          raise Signatures::Upload::Unavailable unless info["pages"] == document["pages"]
        end
        bytes
      end
    end

    def stop_undistributed(code)
      @revision.update!(status: "cancelled", next_reminder_at: nil)
      send_operation = @revision.signature_operations.find_by!(kind: "send")
      send_operation.update!(state: "failed", error_code: code, finished_at: Time.current, run_token: nil)
      @revision.signature_operations.where(kind: "cancel", state: %w[queued running waiting]).find_each do |operation|
        operation.update!(state: "confirmed", error_code: nil, finished_at: Time.current, run_token: nil)
        audit("cancel_confirmed", operation:)
      end
      audit("send_stopped", operation: send_operation)
    end

    def cancel
      return cancel_without_id unless @revision.provider_envelope_id

      data, checked_at = observe
      locked { apply_snapshot(data, checked_at) }
      send_operation = @revision.signature_operations.find_by!(kind: "send")
      if data["status"] == "DRAFT" && %w[creating verifying].include?(send_operation.phase)
        locked { stop_undistributed("send_cancelled") if current_run? }
      elsif data["status"] == "CANCELLED"
        locked { finish_locked("confirmed") if current_run? }
      elsif data["status"] == "PENDING"
        cancel_pending
      else
        locked { finish_locked("waiting", "cancel_waiting") if current_run? }
      end
    end

    def cancel_without_id
      locked do
        next unless current_run?

        send_operation = @revision.signature_operations.find_by!(kind: "send")
        if send_operation.phase == "preparing"
          stop_undistributed("send_cancelled")
        else
          finish_locked("waiting", "cancel_waiting")
        end
      end
    end

    def cancel_pending
      return unless mutation("cancelling")

      client.cancel(@revision.provider_envelope_id)
      data, checked_at = observe
      raise Signatures::DocumensoClient::Uncertain unless data["status"] == "CANCELLED"

      locked { apply_snapshot(data, checked_at); finish_locked("confirmed") if current_run? }
    end

    def remind
      data, checked_at = observe
      locked { apply_snapshot(data, checked_at) }
      people = data.fetch("recipients").select { |person| person["role"] != "CC" && person["signingStatus"] == "NOT_SIGNED" }
      if data["status"] != "PENDING" || people.empty?
        locked { finish_locked("confirmed") if current_run? }
        return
      end
      return unless mutation("reminding")

      client.remind(@revision.provider_envelope_id, recipient_ids: people.pluck("id"))
      locked { finish_locked("confirmed") if current_run? }
    end

    def refresh
      return refresh_without_id unless @revision.provider_envelope_id || @operation.provider_candidate

      data, checked_at = observe(id: @revision.provider_envelope_id || @operation.provider_candidate)
      resume = locked do
        next unless current_run?

        @revision.update!(provider_envelope_id: data.fetch("id")) unless @revision.provider_envelope_id
        apply_snapshot(data, checked_at)
        send_operation = @revision.signature_operations.find_by!(kind: "send")
        if resumable_draft?(data, send_operation)
          send_operation.update!(state: "queued", phase: "verifying", run_token: nil, error_code: nil, finished_at: nil)
          finish_locked("confirmed")
          send_operation
        else
          reconcile_known_state(data, send_operation)
          finish_locked("confirmed")
          nil
        end
      end
      resume&.enqueue!
    end

    def resumable_draft?(data, operation)
      @revision.status.in?(%w[sending send_uncertain]) && data["status"] == "DRAFT" &&
        %w[creating verifying].include?(operation.phase) &&
        (operation.state.in?(%w[uncertain failed]) || operation.state == "running" && operation.updated_at < 2.minutes.ago)
    end

    def refresh_without_id
      resume = locked do
        send_operation = @revision.signature_operations.find_by!(kind: "send")
        if @revision.status.in?(%w[sending send_uncertain]) && send_operation.phase == "preparing" &&
            (send_operation.state.in?(%w[queued failed]) || send_operation.updated_at < 2.minutes.ago)
          send_operation.update!(state: "queued", run_token: nil, error_code: nil, finished_at: nil)
          finish_locked("confirmed")
          send_operation
        else
          if @revision.status.in?(%w[sending send_uncertain]) && send_operation.updated_at < 2.minutes.ago
            send_operation.update!(state: "uncertain", error_code: "provider_uncertain")
            @revision.update!(status: "send_uncertain")
          end
          finish_locked("waiting", "provider_uncertain")
          nil
        end
      end
      resume&.enqueue!
    end

    def reconcile_known_state(data, send_operation)
      if data["status"] != "DRAFT" && send_operation.state.in?(%w[uncertain running failed])
        send_operation.update!(state: "confirmed", error_code: nil, finished_at: Time.current, run_token: nil)
      end
      return unless data["status"] == "CANCELLED"

      @revision.signature_operations.where(kind: "cancel", state: %w[queued running waiting uncertain]).update_all(
        state: "confirmed", error_code: nil, finished_at: Time.current, run_token: nil)
    end

    def queue_waiting_cancellation
      operation = locked do
        next unless @revision.cancel_requested_at && @revision.provider_status == "PENDING"

        pending = @revision.signature_operations.find_by(kind: "cancel", state: "waiting", phase: "preparing")
        pending&.update!(state: "queued", error_code: nil, run_token: nil)
        pending
      end
      operation&.enqueue!
    end

    def observe(before_send: false, id: @revision.provider_envelope_id)
      checked_at = Time.current
      data = client.get(id)
      Signatures::Envelope.new(@revision).verify!(data, client:, operation_id: @revision.operation_id, before_send:)
      raise Signatures::Envelope::Mismatch unless PROVIDER_STATUSES.include?(data["status"])

      [data, checked_at]
    end

    def apply_snapshot(data, checked_at)
      return if @revision.provider_checked_at && checked_at < @revision.provider_checked_at
      if @revision.status.in?(%w[cancelled signed]) || @revision.provider_status.in?(%w[COMPLETED CANCELLED REJECTED])
        raise Signatures::Envelope::Mismatch unless data["status"] == @revision.provider_status
      end
      people = @revision.recipients.map do |person|
        actual = data.fetch("recipients").find { |item| item["email"] == person.fetch("email").downcase }
        unless %w[NOT_SIGNED SIGNED REJECTED].include?(actual["signingStatus"]) &&
            %w[NOT_SENT SENT].include?(actual["sendStatus"]) && %w[NOT_OPENED OPENED].include?(actual["readStatus"])
          raise Signatures::Envelope::Mismatch
        end
        { "recipient_id" => person.fetch("id"), "provider_recipient_id" => actual.fetch("id"),
          "signing_status" => actual.fetch("signingStatus"), "send_status" => actual.fetch("sendStatus"),
          "read_status" => actual.fetch("readStatus") }
      end
      check_status_progression(people)
      next_reminder = if data["status"] == "PENDING" && @revision.cancel_requested_at.nil?
        @revision.provider_status.in?([nil, "DRAFT"]) ? 3.days.from_now : @revision.next_reminder_at
      end
      status = { "PENDING" => "awaiting_signatures", "COMPLETED" => "awaiting_signatures", "REJECTED" => "declined", "CANCELLED" => "cancelled" }[data["status"]]
      @revision.update!({ provider_status: data.fetch("status"), provider_checked_at: checked_at, recipient_statuses: people,
        next_reminder_at: next_reminder }.tap { |attributes| attributes[:status] = status if status })
    end

    def check_status_progression(people)
      people.each do |person|
        previous = @revision.recipient_statuses&.find { |item| item["recipient_id"] == person["recipient_id"] }
        if previous && %w[signing_status send_status read_status].any? do |key|
            %w[SIGNED REJECTED SENT OPENED].include?(previous[key]) && previous[key] != person[key]
          end
          raise Signatures::Envelope::Mismatch
        end
      end
    end

    def fail_operation(code, uncertain: false)
      locked do
        next unless current_run?

        finish_locked(uncertain ? "uncertain" : "failed", code)
        if @operation.kind == "send" && !@revision.status.in?(%w[cancelled signed declined expired])
          @revision.update!(status: "send_uncertain")
        end
        @revision.update!(next_reminder_at: nil) if @operation.kind == "remind" && uncertain
      end
    end

    def finish_locked(state, code = nil)
      @operation.update!(state:, error_code: code, finished_at: Time.current)
      audit("#{@operation.kind}_#{state}")
    end

    def audit(action, operation: @operation)
      @record.audits.create!(action:, user: operation.requested_by, associated: @record.company,
        audited_changes: { revision_id: @revision.id, operation_key: operation.key, phase: operation.phase, error_code: operation.error_code })
    end
end
