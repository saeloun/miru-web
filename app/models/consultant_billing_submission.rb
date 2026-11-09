# frozen_string_literal: true

class ConsultantBillingSubmission < ApplicationRecord
  self.filter_attributes += [:facts, :evidence_manifest, :command_digest, :idempotency_key]
  belongs_to :company
  belongs_to :employment
  belongs_to :actor, class_name: "User"
  belongs_to :previous_submission, class_name: name, optional: true
  belongs_to :pan_blob, class_name: "ActiveStorage::Blob", optional: true
  belongs_to :gst_blob, class_name: "ActiveStorage::Blob", optional: true
  has_many :consultant_billing_reviews, foreign_key: :submission_id, dependent: :restrict_with_exception
  serialize :facts, coder: JSON, type: Hash
  serialize :evidence_manifest, coder: JSON, type: Hash
  encrypts :facts, :evidence_manifest
  scope :heads, -> { where.not(id: where.not(previous_submission_id: nil).select(:previous_submission_id)) }

  def readonly?
    persisted?
  end

  def evidence_blob(kind)
    case kind
    when "pan" then pan_blob
    when "gst" then gst_blob
    end
  end
end
