# frozen_string_literal: true

class TaxDeclaration < ApplicationRecord
  CATEGORIES = %w[hra lta investment pension annuity agnipath health_insurance dependent_disability
    medical_treatment education_loan housing_interest housing_additional_interest electric_vehicle_loan
    donation rent_without_hra research_donation political_contribution savings_interest senior_interest
    disability royalty other].freeze
  YEARS = [2025, 2026].freeze
  STATUSES = %w[draft submitted needs_information approved rejected withdrawn].freeze
  EVIDENCE_TYPES = %w[application/pdf image/jpeg image/png].freeze

  belongs_to :employment
  has_one :company, through: :employment
  belongs_to :supersedes, class_name: "TaxDeclaration", optional: true
  has_many :corrections, class_name: "TaxDeclaration", foreign_key: :supersedes_id, dependent: :nullify
  belongs_to :reviewed_by, class_name: "User", optional: true
  belongs_to :withdrawn_by, class_name: "User", optional: true
  has_many_attached :evidence
  audited associated_with: :company, only: [:status, :submitted_at, :reviewed_at, :withdrawn_at]

  validates :tax_year, inclusion: { in: YEARS }
  validates :category, inclusion: { in: CATEGORIES }
  validates :status, inclusion: { in: STATUSES }
  validates :notes, length: { maximum: 2000 }, presence: true, if: -> { category == "other" }
  validates :notes, :review_reason, length: { maximum: 2000 }
  validates :claimed_amount, numericality: { greater_than: 0, less_than: 10_000_000_000 }
  validates :approved_amount, numericality: { greater_than: 0, less_than_or_equal_to: :claimed_amount }, allow_nil: true
  validates :approved_amount, presence: true, if: -> { status == "approved" }
  validate :decimal_amounts
  validate :valid_evidence
  validate :valid_revision, on: :create

  def submit!
    employment.with_lock do
      reload
      invalid!("Create a correction to change a saved declaration") unless status == "draft" && !corrections.exists?
      invalid!("Attach evidence before submitting") unless evidence.attached?
      update!(status: "submitted", submitted_at: Time.current)
    end
  end

  def review!(actor:, decision:, amount:, reason:)
    employment.with_lock do
      reload
      invalid!("Only the latest submitted declaration can be reviewed") unless status == "submitted" && !corrections.exists?
      invalid!("You cannot review your own declaration") if employment.user_id == actor.id
      invalid!("Choose a valid review decision") unless %w[approved rejected needs_information].include?(decision)
      invalid!("Provide a review reason") if reason.blank?
      assign_attributes(status: decision, approved_amount: decision == "approved" ? amount : nil,
        review_reason: reason, reviewed_by: actor, reviewed_at: Time.current)
      save!
      if decision == "approved"
        previous = supersedes
        while previous
          previous.withdraw!(actor:) if previous.status == "approved"
          previous = previous.supersedes
        end
      end
    end
  end

  def withdraw!(actor:)
    employment.with_lock do
      reload
      update!(status: "withdrawn", withdrawn_at: Time.current, withdrawn_by: actor) unless status == "withdrawn"
    end
  end

  def invalid!(message)
    errors.add(:base, message)
    raise ActiveRecord::RecordInvalid, self
  end

  private

    def decimal_amounts
      errors.add(:tax_year, "is unsupported") unless YEARS.map(&:to_s).include?(tax_year_before_type_cast.to_s)
      [:claimed_amount, :approved_amount].each do |attribute|
        value = public_send("#{attribute}_before_type_cast")
        next if value.nil?
        formatted = value.is_a?(BigDecimal) ? value.to_s("F") : value.to_s
        next if formatted.match?(/\A\d{1,10}(\.\d{1,2})?\z/)

        errors.add(attribute, "must be an INR amount with up to two decimal places")
      end
    end

    def valid_evidence
      errors.add(:evidence, "must contain at most 5 documents") if evidence.size > 5
      evidence.each do |file|
        errors.add(:evidence, "must be PDF, JPEG or PNG") unless EVIDENCE_TYPES.include?(file.blob.content_type)
        errors.add(:evidence, "must be 5 MiB or smaller") if file.blob.byte_size > 5.megabytes
        errors.add(:evidence, "requires private storage") if file.blob.service.public?
      end
    end

    def valid_revision
      return unless supersedes

      if supersedes.employment_id != employment_id || supersedes.tax_year != tax_year || supersedes.category != category
        errors.add(:supersedes, "must have the same employee, year and category")
      end
      errors.add(:supersedes, "already has a correction; correct the latest version") if supersedes.corrections.exists?
    end
end
