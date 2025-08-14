# frozen_string_literal: true

# == Schema Information
#
# Table name: carryovers
#
#  id                  :bigint           not null, primary key
#  discarded_at        :datetime
#  duration            :integer
#  from_year           :integer
#  to_year             :integer
#  total_leave_balance :integer
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  company_id          :bigint           not null
#  leave_type_id       :bigint           not null
#  user_id             :bigint           not null
#
# Indexes
#
#  index_carryovers_on_company_id     (company_id)
#  index_carryovers_on_discarded_at   (discarded_at)
#  index_carryovers_on_leave_type_id  (leave_type_id)
#  index_carryovers_on_user_id        (user_id)
#
FactoryBot.define do
  factory :carryover do
    user
    company
    leave_type
    from_year { 2023 }
    to_year { 2024 }
    total_leave_balance { 10000 } # in minutes
    duration { 2400 } # in minutes
    discarded_at { "2024-04-29 19:59:39" }
  end
end
