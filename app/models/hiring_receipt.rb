# frozen_string_literal: true

class HiringReceipt < ApplicationRecord
  belongs_to :company
  belongs_to :hiring_mailbox
  belongs_to :inbound_email, class_name: "ActionMailbox::InboundEmail", optional: true
  belongs_to :hiring_application, optional: true
  belongs_to :reviewed_by, class_name: "User", optional: true
  has_one_attached :raw_email
  serialize :details, coder: JSON, type: Hash
  encrypts :details
  audited associated_with: :company, on: :update, only: [:state, :review_reason, :hiring_application_id, :reviewed_by_id]

  validates :received_at, :source_checksum, presence: true
  validates :state, inclusion: { in: %w[pending review accepted dismissed] }
  validate :matching_tenant

  def source
    raise ActiveStorage::FileNotFoundError unless raw_email.attached?

    blob = raw_email.blob
    if blob.service.public? || !blob.byte_size.to_i.between?(1, Hiring::ReceiveEmail::MAX_BYTES)
      raise Hiring::ReceiveEmail::Unavailable, "Private email storage is unavailable."
    end
    data = +"".b
    blob.download do |chunk|
      raise Hiring::ReceiveEmail::Unavailable, "The stored email exceeds the intake limit." if data.bytesize + chunk.bytesize > Hiring::ReceiveEmail::MAX_BYTES

      data << chunk
    end
    data
  end

  private

    def matching_tenant
      [hiring_mailbox, hiring_application].compact.each do |record|
        errors.add(:base, "Choose records from this hiring workspace") unless record.company_id == company_id
      end
    end
end
