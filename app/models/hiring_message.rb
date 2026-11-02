# frozen_string_literal: true

class HiringMessage < ApplicationRecord
  belongs_to :company
  belongs_to :hiring_application
  belongs_to :hiring_setting
  belongs_to :queued_by, class_name: "User", optional: true
  belongs_to :original_message, class_name: "HiringMessage", optional: true
  belongs_to :resolved_by, class_name: "User", optional: true
  serialize :content, coder: JSON, type: Hash
  serialize :resolution_details, coder: JSON
  encrypts :content, :resolution_details
  audited associated_with: :company, on: [:create, :update], only: [:state, :error_code, :resolution, :resolved_by_id]

  scope :operations, -> { where(original_message_id: nil) }

  validates :kind, inclusion: { in: ["acknowledgement"] }
  validates :state, inclusion: { in: %w[queued sending sent failed uncertain] }
  validates :attempt_number, numericality: { only_integer: true, greater_than: 0 }
  validate :matching_tenant
  validate :valid_attempt
  validate :valid_resolution
  validate :immutable_content, on: :update

  def attempts
    self.class.where(company_id:, hiring_application_id:, kind:)
      .where("id = :root OR original_message_id = :root", root: original_message_id || id)
  end

  def retryable?
    state == "failed" && resolution != "accepted" || state == "uncertain" && resolution == "not_accepted" &&
      resolution_details.is_a?(Hash) && resolution_details["worker_stopped"] == true
  end

  def self.recover_deliveries
    where(state: "sending").where("started_at <= ?", 15.minutes.ago).find_each do |message|
      message.with_lock do
        message.update!(state: "uncertain", error_code: "interrupted") if message.state == "sending" && message.started_at <= 15.minutes.ago
      end
    end
    where(state: "queued").where("enqueued_at IS NULL OR enqueued_at <= ?", 15.minutes.ago).find_each(&:enqueue)
  end

  def enqueue
    return unless reload.state == "queued"
    return if enqueued_at && enqueued_at > 15.minutes.ago

    job = HiringDeliveryJob.perform_later(id)
    if job && job.successfully_enqueued?
      self.class.where(id:, state: "queued").update_all(enqueued_at: Time.current, error_code: nil)
    else
      self.class.where(id:, state: "queued").update_all(error_code: "queue_unavailable")
    end
    reload
  rescue ActiveJob::EnqueueError, SolidQueue::Job::EnqueueError
    self.class.where(id:, state: "queued").update_all(error_code: "queue_unavailable")
    reload
  end

  private

    def matching_tenant
      [hiring_application, hiring_setting].compact.each do |record|
        errors.add(:base, "Choose records from this hiring workspace") unless record.company_id == company_id
      end
    end

    def immutable_content
      fields = %w[company_id hiring_application_id hiring_setting_id approved_setting_version kind content queued_by_id original_message_id attempt_number]
      errors.add(:base, "The approved message snapshot cannot be changed") if fields.any? { |field| will_save_change_to_attribute?(field) }
      if attribute_in_database("resolution").present? && %w[resolution resolution_details resolved_by_id resolved_at].any? { |field| will_save_change_to_attribute?(field) }
        errors.add(:base, "Recorded reconciliation evidence cannot be changed")
      end
    end

    def valid_attempt
      valid = if original_message
        original_message.original_message_id.nil? && original_message.company_id == company_id &&
          original_message.hiring_application_id == hiring_application_id && original_message.kind == kind && attempt_number.to_i > 1
      else
        attempt_number == 1
      end
      errors.add(:base, "Choose the original acknowledgement from this application") unless valid
    end

    def valid_resolution
      if resolution.nil?
        errors.add(:base, "Provide a reconciliation outcome") if resolved_at || resolved_by_id || resolution_details.present?
        return
      end
      evidence = resolution_details["evidence"] if resolution_details.is_a?(Hash)
      unless %w[accepted not_accepted].include?(resolution) && resolved_at && evidence.is_a?(String) && evidence.strip.length.between?(1, 2000) &&
          (resolution != "not_accepted" || resolution_details["worker_stopped"] == true)
        errors.add(:base, "Provide the verified outcome, evidence and original worker status")
      end
    end
end
