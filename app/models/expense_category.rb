# frozen_string_literal: true

class ExpenseCategory < ApplicationRecord
  include Searchable

  pg_search_scope :pg_search,
    against: [:name],
    using: {
      tsearch: {
        prefix: true,
        dictionary: "simple"
      }
    }

  DEFAULT_CATEGORIES = [
    { name: "Salary", default: true },
    { name: "Repairs & Maintenance", default: true },
    { name: "Rent", default: true },
    { name: "Food", default: true },
    { name: "Travel", default: true },
    { name: "Tax", default: true },
    { name: "Furniture", default: true },
    { name: "Health Insurance", default: true },
    { name: "Other", default: true }
  ]

  validates :name, presence: true, uniqueness: { scope: :company_id }

  belongs_to :company, optional: true

  scope :default_categories, -> { where(default: true) }
end
