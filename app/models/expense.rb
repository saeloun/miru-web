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

  has_many_attached :receipts
  belongs_to :company
  belongs_to :expense_category
  belongs_to :vendor, optional: true

  validates :date, presence: true
  validates :amount, numericality: { greater_than: 0 }

  searchkick filterable: [ :amount, :date, :expense_type, :category_id, :vendor_id, :company_id],
    word_start: [ :category_name, :vendor_name, :description]

  def search_data
    {
      id: id.to_i,
      amount:,
      date: date.to_time,
      description:,
      expense_type:,
      category_name: expense_category.name,
      category_id: expense_category_id,
      vendor_name: vendor&.name,
      vendor_id:,
      company_id: company.id,
      created_at:
    }
  end

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
