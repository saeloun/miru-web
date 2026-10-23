# frozen_string_literal: true

class AgreementTemplate < ApplicationRecord
  KINDS = %w[client consultant].freeze

  belongs_to :company
  belongs_to :created_by, class_name: "User"
  has_many :agreements, dependent: :restrict_with_exception
  serialize :document, coder: JSON
  serialize :fields, coder: JSON
  attribute :document, default: -> { {} }
  attribute :fields, default: -> { [] }
  encrypts :document, :fields
  audited associated_with: :company, only: [:company_id, :created_by_id, :kind]

  validates :title, presence: true, length: { maximum: 200 }
  validates :kind, inclusion: { in: KINDS }
  validate :valid_document
  validate :fixed_identity, on: :update

  def build_agreement(**attributes)
    Agreement.new(attributes.merge(company:, agreement_template: self, source_template_version: lock_version,
      kind:, document: document.deep_dup, fields: fields.deep_dup))
  end

  private

    def valid_document
      Agreements::Document.new(document, fields:).errors.each { |message| errors.add(:document, message) }
    end

    def fixed_identity
      %w[company_id created_by_id kind].each do |attribute|
        errors.add(attribute, "cannot be changed") if will_save_change_to_attribute?(attribute)
      end
    end
end
