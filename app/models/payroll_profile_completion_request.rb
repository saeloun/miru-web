# frozen_string_literal: true

class PayrollProfileCompletionRequest < ApplicationRecord
  belongs_to :company
  belongs_to :payroll_run
  belongs_to :employment
  belongs_to :recipient, class_name: "User"
  belongs_to :requested_by, class_name: "User"
  attr_readonly :company_id, :payroll_run_id, :employment_id, :recipient_id, :requested_by_id,
    :idempotency_key, :command_digest, :source_digest, :categories
  after_create_commit :enqueue_delivery

  def receipt
    { id: id.to_s, state:, categories: }
  end

  # Workspace switching is harmless, but revoked membership or reviewer assignment prevents delivery.
  def delivery_eligible?
    payroll_run.company_id == company_id && employment.company_id == company_id && employment.user_id == recipient_id &&
      payroll_run.eligible_actor?(requested_by, "accounts") &&
      (payroll_run.accounts_reviewer_id == requested_by_id || requested_by.roles.where(resource: company, name: "owner").exists?)
  end

  # Queue failure leaves the committed request available to the recovery scan.
  def enqueue_delivery
    PayrollProfileCompletionRequestJob.perform_later(id) if state == "queued"
  rescue StandardError
    # The committed request remains recoverable when queue insertion fails.
    Rails.logger.warn("Payroll profile-completion request enqueue requires recovery")
  end
end
