# frozen_string_literal: true

# == Schema Information
#
# Table name: expenses
#
#  id                  :bigint           not null, primary key
#  amount              :decimal(20, 2)   default(0.0), not null
#  date                :date             not null
#  description         :text
#  expense_type        :integer
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  company_id          :bigint           not null
#  expense_category_id :bigint           not null
#  vendor_id           :bigint
#
# Indexes
#
#  index_expenses_on_company_id           (company_id)
#  index_expenses_on_expense_category_id  (expense_category_id)
#  index_expenses_on_expense_type         (expense_type)
#  index_expenses_on_vendor_id            (vendor_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (expense_category_id => expense_categories.id)
#  fk_rails_...  (vendor_id => vendors.id)
#
class Expense < ApplicationRecord
  enum expense_type: [
      :personal,
      :business
  ]

  has_many_attached :receipt
  belongs_to :company
  belongs_to :expense_category
  belongs_to :vendor, optional: true

  validates :date, presence: true
  validates :amount, numericality: { greater_than: 0 }
end
