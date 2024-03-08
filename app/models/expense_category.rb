# frozen_string_literal: true

# == Schema Information
#
# Table name: expense_categories
#
#  id         :bigint           not null, primary key
#  default    :boolean          default(FALSE)
#  name       :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  company_id :bigint
#
# Indexes
#
#  index_expense_categories_on_company_id  (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
class ExpenseCategory < ApplicationRecord
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

  has_many :expenses
  belongs_to :company, optional: true

  scope :default_categories, -> { where(default: true) }

  after_commit :reindex_expenses

  private

    def reindex_expenses
      expenses.reindex
    end
end
