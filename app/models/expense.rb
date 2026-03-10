# frozen_string_literal: true

class Expense < ApplicationRecord
  include Searchable
  enum :expense_type, [
      :personal,
      :business
  ]

  pg_search_scope :pg_search,
    against: [:description],
    associated_against: {
      expense_category: [:name],
      vendor: [:name]
    },
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
  belongs_to :expense_category
  belongs_to :vendor, optional: true

  validates :date, presence: true
  validates :amount, numericality: { greater_than: 0 }


  def formatted_date
    CompanyDateFormattingService.new(date, company:).process
  end

  def attached_receipts_urls
    return [] if !receipts.attached?

    receipts.includes(:blob).references(:blob).order(:filename).map do |image|
      Rails.application.routes.url_helpers.polymorphic_url(image, only_path: true)
    end
  end
end
