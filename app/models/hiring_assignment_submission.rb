# frozen_string_literal: true

class HiringAssignmentSubmission < ApplicationRecord
  MAX_FILE_BYTES = 5.megabytes
  MAX_FILES = 5
  MAX_TOTAL_BYTES = 20.megabytes
  KEYS = %w[repository_url setup approach own_contribution ai_used ai_tools ai_how ai_parts].freeze

  belongs_to :company
  belongs_to :hiring_assignment
  has_many_attached :files
  serialize :answers, coder: JSON
  encrypts :answers
  self.filter_attributes += [:answers]
  validate :matching_assignment
  validate :valid_answers, if: :submitted_at?
  validate :fixed_submission, on: :update
  validate :private_files

  def candidate_details
    { answers:, submitted_at:, lock_version:, files: files.map { |file| { id: file.id, filename: file.filename.to_s, byte_size: file.blob.byte_size } } }
  end

  def file_bytes(attachment)
    raise ActiveStorage::FileNotFoundError unless attachment.record == self

    blob = attachment.blob
    raise HiringSubmission::StorageUnavailable if blob.service.public? || !blob.byte_size.between?(1, MAX_FILE_BYTES)

    data = +"".b
    blob.download do |chunk|
      raise HiringSubmission::StorageUnavailable if data.bytesize + chunk.bytesize > MAX_FILE_BYTES

      data << chunk
    end
    unless data.bytesize == blob.byte_size && Digest::SHA256.hexdigest(data) == blob.metadata["hiring_sha256"]
      raise HiringSubmission::StorageUnavailable
    end

    data
  end

  private

    def matching_assignment
      errors.add(:base, "Choose an assignment in this workspace") unless hiring_assignment&.company_id == company_id
    end

    def fixed_submission
      immutable = %w[company_id hiring_assignment_id]
      immutable += %w[answers submitted_at] if submitted_at_in_database
      if immutable.any? { |field| will_save_change_to_attribute?(field) } || submitted_at_in_database && attachment_changes.key?("files")
        errors.add(:base, "Submitted work cannot be rewritten")
      end
    end

    def private_files
      return unless files.attached?

      blobs = files.map(&:blob)
      valid = blobs.size <= MAX_FILES && blobs.sum(&:byte_size) <= MAX_TOTAL_BYTES && blobs.all? do |blob|
        !blob.service.public? && blob.byte_size.between?(1, MAX_FILE_BYTES) &&
          blob.metadata["hiring_assignment_submission_id"] == id && blob.metadata["hiring_company_id"] == company_id &&
          blob.metadata["hiring_sha256"].is_a?(String) && blob.metadata["hiring_sha256"].match?(/\A[0-9a-f]{64}\z/) &&
          blob.identified? && blob.analyzed?
      end
      errors.add(:files, "Use private bounded files uploaded for this submission") unless valid
    end

    def valid_answers
      valid = answers.is_a?(Hash) && (answers.keys - KEYS).empty? && answers.to_json.bytesize <= 96.kilobytes &&
        %w[setup approach own_contribution].all? { |key| text?(answers[key]) } && [true, false].include?(answers["ai_used"])
      if valid
        valid &&= KEYS.excluding("ai_used", "repository_url").all? { |key| answers[key].nil? || answers[key] == "" || text?(answers[key]) }
        valid &&= %w[ai_tools ai_how ai_parts].all? { |key| text?(answers[key]) } if answers["ai_used"]
        repository = answers["repository_url"]
        has_repository = repository.is_a?(String) && repository.present?
        valid &&= !has_repository || repository_url?(repository)
        valid &&= repository.nil? || repository.is_a?(String)
        method = hiring_assignment.terms.dig("details", "submission_method")
        valid &&= has_repository if method == "repository"
        valid &&= files.attached? if method == "files"
        valid &&= has_repository || files.attached? if method == "repository_or_files"
      end
      errors.add(:answers, "Include the required work, setup, explanation, own contribution and explicit AI-use disclosure") unless valid
    end

    def text?(value)
      value.is_a?(String) && value.valid_encoding? && value.strip.present? && value.length <= 10_000 &&
        !value.match?(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/)
    end

    def repository_url?(value)
      return false unless value.length <= 2_048 && !value.match?(/[[:space:][:cntrl:]]/)

      uri = URI.parse(value)
      %w[http https].include?(uri.scheme) && uri.host.present? && uri.userinfo.nil?
    rescue URI::InvalidURIError
      false
    end
end
