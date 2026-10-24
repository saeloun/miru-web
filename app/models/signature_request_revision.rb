# frozen_string_literal: true

class SignatureRequestRevision < ApplicationRecord
  STATUSES = %w[draft under_review changes_requested approved sending send_uncertain awaiting_signatures signed declined cancelled expired].freeze
  CONTENT_ATTRIBUTES = %w[signature_request_id created_by_id number title documents recipients fields content_digest].freeze

  belongs_to :signature_request
  belongs_to :created_by, class_name: "User"
  belongs_to :approved_by, class_name: "User", optional: true
  has_many_attached :originals
  serialize :documents, coder: JSON
  serialize :recipients, coder: JSON
  serialize :fields, coder: JSON
  encrypts :documents, :recipients, :fields
  self.filter_attributes += [:title, :documents, :recipients, :fields]
  before_validation :assign_digest, on: :create

  validates :title, presence: true, length: { maximum: 200 }
  validates :number, numericality: { only_integer: true, greater_than: 0 }
  validates :status, inclusion: { in: STATUSES }
  validates :content_digest, format: { with: /\A[0-9a-f]{64}\z/ }
  validate :valid_content, on: :create
  validate :immutable_content, on: :update

  def configuration
    Signatures::Configuration.new(documents:, recipients:, fields:)
  end

  private

    def valid_content
      configuration.errors.each { |message| errors.add(:base, message) }
      return if configuration.errors.any?

      blobs = originals.blobs.to_a
      unless documents.is_a?(Array) && documents.size == blobs.size && documents.sum { |document| document["byte_size"].to_i } <= 25.megabytes &&
          documents.all? do |document|
            blob = blobs.find { |item| item.id == document["blob_id"] }
            blob && !blob.service.public? && blob.content_type == "application/pdf" && blob.byte_size <= Signatures::PdfInfo::MAX_BYTES &&
              document["sha256"] == blob.metadata["signatures_sha256"] && document["byte_size"] == blob.byte_size
          end
        errors.add(:base, "Originals must be validated private PDF uploads")
      end
    end

    def immutable_content
      if CONTENT_ATTRIBUTES.any? { |attribute| will_save_change_to_attribute?(attribute) } || attachment_changes.key?("originals")
        errors.add(:base, "Create a new revision to change its content")
      end
    end

    def assign_digest
      return if configuration.errors.any?

      payload = { "title" => title, "documents" => documents.map { |document| document.except("blob_id") },
        "recipients" => recipients, "fields" => fields }
      self.content_digest = Digest::SHA256.hexdigest(JSON.generate(canonical(payload)))
    end

    def canonical(value)
      case value
      when Hash then value.sort.to_h.transform_values { |entry| canonical(entry) }
      when Array then value.map { |entry| canonical(entry) }
      else value
      end
    end
end
