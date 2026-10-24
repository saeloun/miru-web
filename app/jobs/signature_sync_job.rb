# frozen_string_literal: true

class SignatureSyncJob < ApplicationJob
  class Retryable < StandardError; end

  self.enqueue_after_transaction_commit = true
  queue_as :default
  retry_on Retryable, wait: :polynomially_longer, attempts: 5

  def perform(revision_id, callback_id = nil)
    revision = SignatureRequestRevision.find(revision_id)
    callback = revision.signature_callbacks.find(callback_id) if callback_id
    return if callback&.processed_at

    unless Signatures::Reconcile.new(revision).process
      if revision.reload.archive_error.in?(%w[provider_unavailable storage_unavailable])
        raise Retryable, "Completed artifacts are temporarily unavailable."
      end
      return
    end

    callback&.update!(processed_at: Time.current)
  end
end
