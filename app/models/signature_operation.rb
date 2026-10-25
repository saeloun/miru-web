# frozen_string_literal: true

class SignatureOperation < ApplicationRecord
  ERRORS = {
    "not_authorized" => "The sender is no longer an active administrator in this company.",
    "approval_changed" => "The approved version changed. Reconcile it before continuing.",
    "source_unavailable" => "The original PDFs could not be verified. Contact your workspace administrator.",
    "provider_mismatch" => "The provider document does not match the approved version. Reconcile it before continuing.",
    "provider_unavailable" => "The provider could not be reached or verified. Check the status again.",
    "provider_uncertain" => "The outcome could not be confirmed. Check the status before trying another action.",
    "connection_unavailable" => "The signing connection is unavailable. Ask an administrator to check it.",
    "queue_unavailable" => "This action could not be queued. Check the status to try queuing it again.",
    "cancel_waiting" => "Cancellation is waiting for the in-progress send to be reconciled.",
    "send_cancelled" => "Sending was cancelled before distribution.",
    "request_expired" => "The signing window has expired. No reminder was sent.",
    "request_closed" => "The provider already closed this request. It cannot be cancelled."
  }.freeze

  belongs_to :revision, class_name: "SignatureRequestRevision"
  belongs_to :requested_by, class_name: "User"
  before_validation(on: :create) { self.key ||= SecureRandom.uuid }
  validates :key, format: { with: /\A[0-9a-f-]{36}\z/ }, uniqueness: true
  validates :kind, inclusion: { in: %w[send cancel remind refresh] }
  validates :state, inclusion: { in: %w[queued running waiting confirmed failed uncertain] }
  validates :phase, inclusion: { in: %w[preparing creating verifying distributing cancelling reminding checking] }
  validates :error_code, inclusion: { in: ERRORS.keys }, allow_nil: true
  validates :provider_candidate, format: { with: Signatures::DocumensoClient::ID }, allow_nil: true
  validate :immutable_identity, on: :update

  def error_message = ERRORS[error_code]

  def summary
    slice(:id, :key, :kind, :state, :phase, :automatic, :created_at, :finished_at).merge(error_code:, error_message:)
  end

  def enqueue!
    job = SignatureDeliveryJob.perform_later(id)
    queue_failed unless job && job.successfully_enqueued?
    job
  rescue ActiveJob::EnqueueError
    queue_failed
    nil
  end

  private

    def queue_failed
      record = revision.signature_request
      record.with_lock do
        reload
        if state == "queued"
          update!(state: "failed", error_code: "queue_unavailable", finished_at: Time.current)
          record.audits.create!(action: "#{kind}_queue_failed", user: requested_by, associated: record.company,
            audited_changes: { revision_id:, operation_key: key, error_code: })
        end
      end
    end

    def immutable_identity
      if %w[revision_id requested_by_id key kind provider_candidate automatic].any? { |name| will_save_change_to_attribute?(name) }
        errors.add(:base, "Delivery operation identity cannot be changed")
      end
    end
end
