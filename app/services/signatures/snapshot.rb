# frozen_string_literal: true

class Signatures::Snapshot
  def initialize(revision)
    @revision = revision
  end

  def apply!(data, checked_at:)
    @revision.signature_request.with_lock do
      @revision.reload
      return false if @revision.provider_checked_at && checked_at < @revision.provider_checked_at

      provider_status = data.fetch("status")
      if @revision.status.in?(%w[cancelled signed]) || @revision.provider_status.in?(%w[COMPLETED CANCELLED REJECTED])
        raise Signatures::Envelope::Mismatch unless provider_status == @revision.provider_status
      end
      people = recipient_statuses(data)
      check_progression(people)
      status = { "PENDING" => @revision.signing_window_expired?(people) ? "expired" : "awaiting_signatures", "COMPLETED" => "awaiting_signatures",
        "REJECTED" => "declined", "CANCELLED" => "cancelled" }.fetch(provider_status, @revision.status)
      next_reminder = if provider_status == "PENDING" && status != "expired" && @revision.cancel_requested_at.nil?
        @revision.provider_status.in?([nil, "DRAFT"]) ? 3.days.from_now : @revision.next_reminder_at
      end
      status = "signed" if @revision.archived_at
      close_pending_cancellations if %w[COMPLETED REJECTED].include?(provider_status)
      @revision.update!(provider_status:, provider_checked_at: checked_at, recipient_statuses: people, status:,
        next_reminder_at: next_reminder,
        archive_error: provider_status == "COMPLETED" || @revision.archived_at ? @revision.archive_error : nil)
    end
  end

  private

    def close_pending_cancellations
      @revision.signature_operations.where(kind: "cancel", state: %w[queued running waiting uncertain]).find_each do |operation|
        operation.update!(state: "failed", error_code: "request_closed", finished_at: Time.current, run_token: nil)
        record = @revision.signature_request
        record.audits.create!(action: "cancel_request_closed", user: operation.requested_by, associated: record.company,
          audited_changes: { revision_id: @revision.id, operation_key: operation.key })
      end
    end

    def recipient_statuses(data)
      @revision.recipients.map do |person|
        actual = data.fetch("recipients").find { |item| item["email"] == person.fetch("email").downcase }
        unless %w[NOT_SIGNED SIGNED REJECTED].include?(actual["signingStatus"]) &&
            %w[NOT_SENT SENT].include?(actual["sendStatus"]) && %w[NOT_OPENED OPENED].include?(actual["readStatus"])
          raise Signatures::Envelope::Mismatch
        end
        { "recipient_id" => person.fetch("id"), "provider_recipient_id" => actual.fetch("id"),
          "signing_status" => actual.fetch("signingStatus"), "send_status" => actual.fetch("sendStatus"),
          "read_status" => actual.fetch("readStatus"), "expires_at" => person["role"] == "cc" ? nil : deadline(actual["expiresAt"]) }
      end
    end

    def deadline(value)
      return if value.nil?

      unless value.is_a?(String) && value.bytesize <= 40 && value.match?(/T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})\z/)
        raise Signatures::Envelope::Mismatch
      end
      DateTime.iso8601(value).to_time.utc.iso8601(3)
    rescue ArgumentError
      raise Signatures::Envelope::Mismatch, cause: nil
    end

    def check_progression(people)
      people.each do |person|
        previous = @revision.recipient_statuses&.find { |item| item["recipient_id"] == person["recipient_id"] }
        if previous && %w[signing_status send_status read_status].any? do |key|
            %w[SIGNED REJECTED SENT OPENED].include?(previous[key]) && previous[key] != person[key]
          end
          raise Signatures::Envelope::Mismatch
        end
      end
    end
end
