# frozen_string_literal: true

class EmployeeDocument < ApplicationRecord
  KINDS = %w[pan contract].freeze
  CONTENT_TYPES = %w[application/pdf image/jpeg image/png].freeze

  belongs_to :employment
  belongs_to :uploaded_by, class_name: "User"
  has_one :company, through: :employment
  has_one_attached :file
  audited associated_with: :company, only: [:employment_id, :kind]

  validates :kind, inclusion: { in: KINDS }
  validate :valid_document

  private

    def valid_document
      unless file.attached?
        errors.add(:file, "is required")
        return
      end
      errors.add(:file, "must be PDF, JPEG or PNG") unless CONTENT_TYPES.include?(file.blob.content_type)
      errors.add(:file, "must be 5 MiB or smaller") if file.blob.byte_size > 5.megabytes
      errors.add(:file, "requires private storage") if file.blob.service.public?
    end
end
