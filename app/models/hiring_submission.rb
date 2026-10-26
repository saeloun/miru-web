# frozen_string_literal: true

class HiringSubmission < ApplicationRecord
  class InvalidResume < StandardError; end
  class StorageUnavailable < StandardError; end
  MAX_RESUME_BYTES = 5.megabytes
  RESUME_TYPES = %w[application/pdf application/msword application/vnd.openxmlformats-officedocument.wordprocessingml.document].freeze

  belongs_to :company
  belongs_to :hiring_application
  belongs_to :hiring_portal_access
  has_one_attached :resume
  serialize :answers, coder: JSON
  encrypts :answers
  self.filter_attributes += [:answers]
  audited associated_with: :company, only: [:submitted_at]
  validate :matching_application
  validate :valid_answers, if: :submitted_at?
  validate :fixed_submission, on: :update
  validate :private_resume

  def review_details(include_sensitive: false)
    access = hiring_portal_access
    fields = access.form_schema.fetch("fields")
    values = answers
    unless include_sensitive
      current = HiringSetting.find_by(company_id:)&.form&.fetch("fields") || []
      hidden = fields.filter_map do |field|
        latest = current.find { |item| item["id"] == field["id"] }
        field["id"] if field["sensitive"] || !latest || latest["sensitive"]
      end
      fields = fields.reject { |field| hidden.include?(field["id"]) }
      values = answers.except(*hidden)
    end
    { id:, access_id: access.id, issued_at: access.created_at, approved_setting_version: access.approved_setting_version,
      submitted_at:, expires_at: access.expires_at, revoked_at: access.revoked_at,
      fields:, answers: values,
      resume: fields.any? { |field| field["id"] == "resume" } && resume.attached? ?
        { filename: resume.filename.to_s, byte_size: resume.blob.byte_size } : nil }
  end

  def resume_bytes
    raise ActiveStorage::FileNotFoundError unless resume.attached?

    blob = resume.blob
    raise StorageUnavailable if blob.service.public? || !blob.byte_size.between?(1, MAX_RESUME_BYTES) || !RESUME_TYPES.include?(blob.content_type)

    data = +"".b
    blob.download do |chunk|
      raise StorageUnavailable if data.bytesize + chunk.bytesize > MAX_RESUME_BYTES

      data << chunk
    end
    raise StorageUnavailable unless data.bytesize == blob.byte_size && Digest::SHA256.hexdigest(data) == blob.metadata["hiring_sha256"]

    data
  end

  private

    def private_resume
      return unless resume.attached?

      blob = resume.blob
      errors.add(:base, "Use a private resume up to 5 MiB") if blob.service.public? ||
        !blob.byte_size.between?(1, MAX_RESUME_BYTES) || !RESUME_TYPES.include?(blob.content_type)
    end

    def matching_application
      access = hiring_portal_access
      unless access.company_id == company_id && access.hiring_application_id == hiring_application_id
        errors.add(:base, "Choose the form for this application")
      end
    end

    def fixed_submission
      fields = %w[company_id hiring_application_id hiring_portal_access_id]
      fields += %w[answers submitted_at] if submitted_at_in_database
      errors.add(:base, "A submitted form cannot be rewritten") if fields.any? { |field| will_save_change_to_attribute?(field) }
    end

    def valid_answers
      form = Hiring::Form.new(hiring_portal_access.form_schema)
      errors.add(:base, "Complete required fields and use valid amounts, currencies, dates and links") unless form.valid_answers?(answers, resume: resume.attached?)
    end
end
