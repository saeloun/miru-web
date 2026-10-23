# frozen_string_literal: true

class Agreement < ApplicationRecord
  belongs_to :company
  belongs_to :created_by, class_name: "User"
  belongs_to :agreement_template, optional: true
  belongs_to :client, optional: true
  belongs_to :employment, optional: true
  serialize :document, coder: JSON
  serialize :fields, coder: JSON
  serialize :field_values, coder: JSON
  attribute :document, default: -> { {} }
  attribute :fields, default: -> { [] }
  attribute :field_values, default: -> { {} }
  encrypts :document, :fields, :field_values
  audited associated_with: :company, only: [:company_id, :created_by_id, :client_id, :employment_id, :kind, :status]

  validates :title, presence: true, length: { maximum: 200 }
  validates :kind, inclusion: { in: AgreementTemplate::KINDS }
  validates :status, inclusion: { in: ["draft"] }
  validates :source_template_version, numericality: { only_integer: true, greater_than_or_equal_to: 0 },
    allow_nil: true
  validate :valid_document
  validate :valid_counterparty
  validate :valid_source
  validate :fixed_identity, on: :update

  private

    def valid_document
      Agreements::Document.new(document, fields:, values: field_values).errors.each { |message| errors.add(:document, message) }
    end

    def valid_counterparty
      party = kind == "client" ? client : employment
      other = kind == "client" ? employment : client
      unless party && other.nil? && party.company_id == company_id
        errors.add(:base, "Choose exactly one #{kind} in this company")
      end
    end

    def valid_source
      if agreement_template
        unless agreement_template.company_id == company_id && agreement_template.kind == kind && source_template_version
          errors.add(:agreement_template, "must match the company and kind and include its copied version")
        end
      elsif source_template_version
        errors.add(:source_template_version, "requires a template")
      end
    end

    def fixed_identity
      %w[company_id created_by_id kind client_id employment_id agreement_template_id source_template_version].each do |attribute|
        errors.add(attribute, "cannot be changed") if will_save_change_to_attribute?(attribute)
      end
    end
end
