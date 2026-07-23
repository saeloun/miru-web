# frozen_string_literal: true

class Expense < ApplicationRecord
  include Discardable
  include Searchable

  audited only: [:amount, :base_currency_amount, :currency, :date, :expense_type, :status, :paid_at, :category_name]

  MAX_RECEIPT_SIZE_MB = 10
  MAX_RECEIPTS = 10
  ALLOWED_RECEIPT_CONTENT_TYPES = %w[
    image/png image/jpeg image/jpg image/webp application/pdf text/csv application/vnd.ms-excel
    application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  ].freeze

  enum :expense_type, [
      :personal,
      :business
  ]
  enum :status, {
    submitted: 0,
    approved: 1,
    rejected: 2,
    paid: 3
  }

  pg_search_scope :pg_search,
    against: [:description, :category_name, :vendor_name],
    using: {
      tsearch: {
        prefix: true,
        dictionary: "simple"
      },
      trigram: {
        threshold: 0.3
      }
    }

  has_many_attached :receipts
  belongs_to :company
  belongs_to :user, optional: true
  belongs_to :expense_category, optional: true
  belongs_to :project, optional: true

  attribute :currency, :string, default: nil

  validates :date, presence: true
  validates :amount, numericality: { greater_than: 0 }
  validates :currency, presence: true, format: { with: /\A[A-Z]{3}\z/ }
  validate :known_currency_code
  validate :validate_receipt_constraints

  before_validation :normalize_currency
  before_validation :calculate_base_currency_amount

  scope :kept_ordered, -> { kept.order(created_at: :desc) }

  def self.normalize_params(attributes)
    permitted = attributes.to_h
    vendor_name = permitted.delete("vendor_name").to_s.strip
    category_name = permitted.delete("category_name").to_s.strip
    currency = permitted.delete("currency").to_s.strip.upcase

    permitted["vendor_name"] = vendor_name if vendor_name.present?
    permitted["category_name"] = category_name if category_name.present?
    permitted["currency"] = currency if currency.present?

    permitted
  end

  def display_vendor_name
    vendor_name.to_s.strip
  end

  def display_category_name
    category_name.to_s.strip
  end

  def display_currency
    currency.presence || company&.base_currency.presence || "USD"
  end

  def submitter_name
    user&.full_name || "Unknown submitter"
  end

  def notify_submission_reviewers!
    return unless user&.has_cached_role?(:employee, company)
    return if reviewer_emails.empty?

    ExpenseMailer.with(expense_id: id, recipients: reviewer_emails).submitted.deliver_later
  end

  def notify_submitter_paid!
    return if user.blank?

    ExpenseMailer.with(expense_id: id, recipients: [user.email]).paid.deliver_later
  end

  def notify_submitter_approved!
    return if user.blank?

    ExpenseMailer.with(expense_id: id, recipients: [user.email]).approved.deliver_later
  end

  def notify_submitter_rejected!
    return if user.blank?

    ExpenseMailer.with(expense_id: id, recipients: [user.email]).rejected.deliver_later
  end

  def approve!
    update!(status: :approved, paid_at: nil)
  end

  def reject!
    update!(status: :rejected, paid_at: nil)
  end

  def mark_paid!
    update!(status: :paid, paid_at: Time.current)
  end

  def formatted_date
    CompanyDateFormattingService.new(date, company:).process
  end

  def attached_receipts_urls
    return [] if !receipts.attached?

    receipts.includes(:blob).references(:blob).order(:filename).map do |image|
      Rails.application.routes.url_helpers.rails_blob_path(image, only_path: true)
    end
  end

  private

    def validate_receipt_constraints
      return unless receipts.attached?

      if receipts.size > MAX_RECEIPTS
        errors.add(:receipts, I18n.t("attachment.validation.too_many_files", count: MAX_RECEIPTS))
      end

      receipts.each do |receipt|
        if receipt.blob.byte_size > MAX_RECEIPT_SIZE_MB.megabytes
          errors.add(:receipts, I18n.t("attachment.validation.file_too_large", size_mb: MAX_RECEIPT_SIZE_MB))
        end

        next if ALLOWED_RECEIPT_CONTENT_TYPES.include?(receipt.blob.content_type)

        errors.add(:receipts, I18n.t("attachment.validation.invalid_content_type"))
      end
    end

    def normalize_currency
      self.currency = currency.to_s.strip.upcase if currency.present?
      self.currency = company&.base_currency.presence || "USD" if currency.blank?
    end

    def calculate_base_currency_amount
      return if amount.blank?
      return unless new_record? || amount_changed? || currency_changed? || date_changed?

      base_currency = company&.base_currency
      if base_currency.blank? || currency.blank? || currency == base_currency
        self.exchange_rate = 1.0
        self.base_currency_amount = amount
        return
      end

      expense_date = date || Date.current
      rate = CurrencyConversionService.get_exchange_rate(currency, base_currency, expense_date)

      if rate
        self.exchange_rate = rate
        self.exchange_rate_date = expense_date
        self.base_currency_amount = (amount * rate).round(2)
      else
        self.exchange_rate = 1.0
        self.base_currency_amount = amount
        report_missing_exchange_rate(expense_date)
      end
    end

    def report_missing_exchange_rate(expense_date)
      Sentry.capture_message(
        "Expense recorded with 1:1 fallback exchange rate",
        level: :warning,
        extra: {
          expense_id: id,
          currency:,
          base_currency: company&.base_currency,
          amount:,
          expense_date:
        }
      )
    end

    def known_currency_code
      return if currency.blank?
      return if Money::Currency.find(currency).present?

      errors.add(:currency, :invalid)
    end

    def reviewer_emails
      company
        .users
        .with_role([:owner, :admin, :book_keeper], company)
        .where.not(id: user_id)
        .distinct
        .pluck(:email)
    end
end
