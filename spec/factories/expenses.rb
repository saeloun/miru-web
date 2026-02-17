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
#  index_expenses_on_description_trgm     (description) USING gin
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
FactoryBot.define do
  factory :expense do
    amount { Faker::Number.between(from: 1.0, to: 1000.0).round(2) }
    expense_type { [:personal, :business].sample }
    date { Faker::Time.between(from: 60.days.ago, to: Time.now) }
    description { Faker::Lorem.paragraphs(number: rand(2..8)).join('\n') }
    company
    expense_category

    trait :with_receipts do
      after :build do |expense|
        file_name = "test-image.png"
        file_path = Rails.root.join("spec", "support", "fixtures", file_name)
        expense.receipts.attach(io: File.open(file_path), filename: file_name, content_type: "image/png")
      end
    end
  end
end
