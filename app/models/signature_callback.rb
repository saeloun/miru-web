# frozen_string_literal: true

class SignatureCallback < ApplicationRecord
  EVENTS = %w[DOCUMENT_SENT DOCUMENT_OPENED DOCUMENT_SIGNED DOCUMENT_RECIPIENT_COMPLETED DOCUMENT_COMPLETED
    DOCUMENT_REJECTED DOCUMENT_CANCELLED RECIPIENT_EXPIRED DOCUMENT_REMINDER_SENT].freeze

  belongs_to :revision, class_name: "SignatureRequestRevision"
  validates :digest, format: { with: /\A[0-9a-f]{64}\z/ }
  validates :event, inclusion: { in: EVENTS }

  def enqueue!
    queued = with_lock do
      processed_at || enqueued_at && enqueued_at > 5.minutes.ago
    end
    return true if queued

    job = SignatureSyncJob.perform_later(revision_id, id)
    return false unless job && job.successfully_enqueued?

    # Record acceptance after enqueue so an interruption cannot suppress the provider's retry.
    with_lock { update!(enqueued_at: Time.current) unless processed_at }
    true
  rescue ActiveJob::EnqueueError
    false
  end
end
