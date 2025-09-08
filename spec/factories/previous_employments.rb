# frozen_string_literal: true

# == Schema Information
#
# Table name: previous_employments
#
#  id           :bigint           not null, primary key
#  company_name :string
#  role         :string
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  user_id      :bigint           not null
#
# Indexes
#
#  index_previous_employments_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
FactoryBot.define do
  factory :previous_employment do
    user
    company_name { Faker::Company.name }
    role { Faker::Company.profession }
  end
end
