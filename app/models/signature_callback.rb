# frozen_string_literal: true

class SignatureCallback < ApplicationRecord
  EVENTS = %w[DOCUMENT_SENT DOCUMENT_OPENED DOCUMENT_SIGNED DOCUMENT_RECIPIENT_COMPLETED DOCUMENT_COMPLETED
    DOCUMENT_REJECTED DOCUMENT_CANCELLED RECIPIENT_EXPIRED DOCUMENT_REMINDER_SENT].freeze

  belongs_to :revision, class_name: "SignatureRequestRevision"
  validates :digest, format: { with: /\A[0-9a-f]{64}\z/ }
  validates :event, inclusion: { in: EVENTS }

  def enqueue!
    attempted_at = Time.current
    needed = with_lock do
      next false if processed_at || enqueued_at && enqueued_at > 5.minutes.ago

      update!(enqueued_at: attempted_at)
      true
    end
    return true unless needed

    job = SignatureSyncJob.perform_later(revision_id, id)
    return true if job && job.successfully_enqueued?

    queue_failed(attempted_at)
  rescue ActiveJob::EnqueueError
    queue_failed(attempted_at)
  end

  private

    def queue_failed(attempted_at)
      self.class.where(id:, enqueued_at: attempted_at, processed_at: nil).update_all(enqueued_at: nil)
      false
    end
end
