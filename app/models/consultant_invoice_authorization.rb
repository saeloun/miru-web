# frozen_string_literal: true

class ConsultantInvoiceAuthorization < ApplicationRecord
  self.filter_attributes += [:idempotency_key, :command_digest]
  belongs_to :company
  belongs_to :employment
  belongs_to :actor, class_name: "User"
  belongs_to :previous_event, class_name: name, optional: true
  validates :action, inclusion: { in: %w[grant withdraw] }
  validates :statement_version, presence: true, length: { maximum: 128 }
  validates :statement_text, presence: true, length: { maximum: 4000 }
  validates :statement_digest, :command_digest, format: { with: /\A[0-9a-f]{64}\z/ }
  validates :idempotency_key, presence: true, length: { maximum: 128 }
  scope :heads, -> { where.not(id: ConsultantInvoiceAuthorization.where.not(previous_event_id: nil).select(:previous_event_id)) }

  def readonly?
    persisted?
  end
end
