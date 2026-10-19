# frozen_string_literal: true

class SalarySlip < ApplicationRecord
  belongs_to :employment
  belongs_to :uploaded_by, class_name: "User"
  belongs_to :published_by, class_name: "User", optional: true
  belongs_to :withdrawn_by, class_name: "User", optional: true
  belongs_to :supersedes, class_name: "SalarySlip", optional: true
  has_many :revisions, class_name: "SalarySlip", foreign_key: :supersedes_id, dependent: :nullify
  has_one :company, through: :employment
  has_one_attached :file

  audited associated_with: :company, only: [:pay_month, :published_at, :withdrawn_at]

  validates :pay_month, :source, presence: true
  validates :source, length: { maximum: 100 }
  validate :valid_document
  validate :month_start

  scope :published, -> { where.not(published_at: nil).where(withdrawn_at: nil) }

  def status
    return "withdrawn" if withdrawn_at?

    published_at? ? "published" : "draft"
  end

  def publish!(actor:)
    employment.with_lock do
      reload
      if withdrawn_at?
        errors.add(:base, "Import a new revision instead of republishing a withdrawn slip")
        raise ActiveRecord::RecordInvalid, self
      end
      return self if published_at?

      previous = employment.salary_slips.published.find_by(pay_month:) || employment.salary_slips
        .where(pay_month:).where.not(published_at: nil).order(published_at: :desc, id: :desc).first
      previous&.withdraw!(actor:)
      update!(published_at: Time.current, published_by: actor, supersedes: previous)
    end
    self
  end

  def withdraw!(actor:)
    update!(withdrawn_at: Time.current, withdrawn_by: actor) unless withdrawn_at?
  end

  private

    def month_start
      errors.add(:pay_month, "must be the first day of the month") if pay_month && pay_month.day != 1
    end

    def valid_document
      if !file.attached?
        errors.add(:file, "is required")
      elsif file.blob.byte_size > 5.megabytes
        errors.add(:file, "must be 5 MiB or smaller")
      elsif file.blob.content_type != "application/pdf"
        errors.add(:file, "must be a PDF")
      elsif file.blob.service.public?
        errors.add(:file, "requires private storage")
      end
    end
end
