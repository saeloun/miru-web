# frozen_string_literal: true

# == Schema Information
#
# Table name: employments
#
#  id              :bigint           not null, primary key
#  designation     :string
#  discarded_at    :datetime
#  employment_type :string
#  joined_at       :date
#  resigned_at     :date
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  company_id      :bigint           not null
#  employee_id     :string
#  user_id         :bigint           not null
#
# Indexes
#
#  index_employments_on_company_id                   (company_id)
#  index_employments_on_company_id_and_discarded_at  (company_id,discarded_at)
#  index_employments_on_discarded_at                 (discarded_at)
#  index_employments_on_user_id                      (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (user_id => users.id)
#
FactoryBot.define do
  factory :employment do
    company
    user
    employee_id { Faker::Alphanumeric.alphanumeric(number: 10, min_alpha: 3) }
    designation { "SDE" }
    employment_type { "Salaried" }
    joined_at { Faker::Date.between(from: "2020-01-01", to: "2021-01-01") }
    resigned_at { Faker::Date.between(from: "2021-01-02", to: "2022-01-01") }
  end
end
