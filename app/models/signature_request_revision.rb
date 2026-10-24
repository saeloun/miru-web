# frozen_string_literal: true

class SignatureRequestRevision < ApplicationRecord
  STATUSES = %w[draft under_review changes_requested approved sending send_uncertain awaiting_signatures signed declined cancelled expired].freeze
  CONTENT_ATTRIBUTES = %w[signature_request_id created_by_id number title documents recipients fields signing_options content_digest].freeze

  belongs_to :signature_request
  belongs_to :created_by, class_name: "User"
  belongs_to :approved_by, class_name: "User", optional: true
  has_many :review_invitations, class_name: "SignatureReviewInvitation", foreign_key: :revision_id, dependent: :restrict_with_exception
  has_many :review_comments, class_name: "SignatureReviewComment", foreign_key: :revision_id, dependent: :restrict_with_exception
  has_many_attached :originals
  serialize :documents, coder: JSON
  serialize :recipients, coder: JSON
  serialize :fields, coder: JSON
  serialize :signing_options, coder: JSON
  encrypts :documents, :recipients, :fields, :signing_options, :approval_note
  self.filter_attributes += [:title, :documents, :recipients, :fields, :approval_note]
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

  def ready_errors
    failures = configuration.ready_errors
    return failures if failures.any?

    Signatures::Envelope.new(self).payload(operation_id: "approval-check")
    []
  rescue Signatures::Envelope::InvalidConfiguration => error
    [error.message]
  end

  def review_comments_page(before_id: nil)
    raise ActionController::BadRequest unless before_id.nil? || before_id.to_s.match?(/\A[1-9]\d{0,17}\z/)

    records = review_comments.includes(:author_user, author_invitation: :revision).order(id: :desc)
    records = records.where("id < ?", before_id) if before_id
    page = records.limit(31).to_a
    comments = page.first(30).reverse.map do |comment|
      comment.slice(:id, :body, :created_at).merge(author_name: comment.author_name,
        author_kind: comment.author_user_id ? "admin" : "reviewer")
    end
    { comments:, older_before_id: page.size > 30 ? comments.first.fetch("id") : nil }
  end

  def original_bytes(key)
    document = documents.find { |item| item["key"] == key }
    raise ActiveRecord::RecordNotFound unless document

    blob = originals.blobs.find(document.fetch("blob_id"))
    data = +"".b
    blob.download do |chunk|
      data << chunk
      raise Signatures::Upload::Unavailable, "The original document could not be verified." if data.bytesize > Signatures::PdfInfo::MAX_BYTES
    end
    raise Signatures::Upload::Unavailable, "The original document could not be verified." unless Digest::SHA256.hexdigest(data) == document.fetch("sha256")

    [data, document]
  end

  private

    def valid_content
      configuration.errors.each { |message| errors.add(:base, message) }
      return if configuration.errors.any?

      unless Signatures::Envelope.valid_options?(signing_options)
        errors.add(:base, "Save a new version with valid signing settings")
        return
      end

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
      if signature_request&.company
        self.signing_options ||= Signatures::Envelope.default_options(timezone: signature_request.company.resolved_time_zone.tzinfo.name)
      end
      return if configuration.errors.any?

      self.fields = fields.map do |field|
        field.merge(field.slice("x", "y", "width", "height").transform_values { |value| value.round(2) })
      end
      payload = { "title" => title, "documents" => documents.map { |document| document.except("blob_id") },
        "recipients" => recipients, "fields" => fields, "signing_options" => signing_options }
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
