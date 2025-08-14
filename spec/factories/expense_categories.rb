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
FactoryBot.define do
  factory :expense_category do
    name { Faker::Name.name }
    company
  end
end
