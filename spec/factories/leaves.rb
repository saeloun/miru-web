# frozen_string_literal: true

# == Schema Information
#
# Table name: leaves
#
#  id           :bigint           not null, primary key
#  discarded_at :datetime
#  year         :integer
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  company_id   :bigint           not null
#
# Indexes
#
#  index_leaves_on_company_id           (company_id)
#  index_leaves_on_discarded_at         (discarded_at)
#  index_leaves_on_year_and_company_id  (year,company_id) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
FactoryBot.define do
  factory :leave do
    company
    year { 2023 }
  end
end
