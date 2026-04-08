# frozen_string_literal: true

class Expense < ApplicationRecord
  include Discard::Model
  include Searchable
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

  validates :date, presence: true
  validates :amount, numericality: { greater_than: 0 }

  scope :kept_ordered, -> { kept.order(created_at: :desc) }

  def display_vendor_name
    vendor_name.to_s.strip
  end

  def display_category_name
    category_name.to_s.strip
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

    def reviewer_emails
      company
        .users
        .with_role([:owner, :admin, :book_keeper], company)
        .where.not(id: user_id)
        .distinct
        .pluck(:email)
    end
end
