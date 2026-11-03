# frozen_string_literal: true

class SignatureRequest < ApplicationRecord
  class Conflict < StandardError; end

  belongs_to :company
  belongs_to :created_by, class_name: "User"
  belongs_to :client, optional: true
  belongs_to :employment, optional: true
  belongs_to :current_revision, class_name: "SignatureRequestRevision", optional: true
  has_many :signature_revisions, class_name: "SignatureRequestRevision", dependent: :restrict_with_exception
  audited associated_with: :company, only: [:company_id, :created_by_id, :client_id, :employment_id, :current_revision_id]
  self.filter_attributes += [:title, :creation_key]

  validates :title, presence: true, length: { maximum: 200 }
  validates :creation_key, format: { with: Signatures::Configuration::ID }
  validates :creation_digest, format: { with: /\A[0-9a-f]{64}\z/ }
  validate :valid_links
  validate :fixed_identity, on: :update

  def revise!(actor:, attributes:, upload: nil)
    previous = current_revision
    if previous && !%w[draft under_review changes_requested approved cancelled].include?(previous.status)
      raise Conflict, "This version is locked. Cancel the pending signature request before changing it."
    end
    documents, blobs = upload ? upload.persist! : [previous.documents, previous.originals.blobs.to_a]
    revision = signature_revisions.new(created_by: actor, number: (previous&.number || 0) + 1,
      title: attributes.fetch(:title, title), documents:,
      recipients: attributes.fetch(:recipients, previous&.recipients || []),
      fields: upload ? [] : attributes.fetch(:fields, previous.fields))
    revision.originals = blobs
    revision.save!
    update!(title: revision.title, current_revision: revision)
    revision
  end

  private

    def valid_links
      if (client && client.company_id != company_id) || (employment && employment.company_id != company_id) || (client && employment)
        errors.add(:base, "Choose at most one client or employment in this company")
      end
      if current_revision && current_revision.signature_request_id != id
        errors.add(:current_revision, "must belong to this request")
      end
    end

    def fixed_identity
      %w[company_id created_by_id client_id employment_id creation_key creation_digest].each do |attribute|
        errors.add(attribute, "cannot be changed") if will_save_change_to_attribute?(attribute)
      end
    end
end
