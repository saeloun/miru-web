# frozen_string_literal: true

# == Schema Information
#
# Table name: holidays
#
#  id                              :bigint           not null, primary key
#  discarded_at                    :datetime
#  enable_optional_holidays        :boolean          default(FALSE)
#  holiday_types                   :string           default([]), is an Array
#  no_of_allowed_optional_holidays :integer
#  time_period_optional_holidays   :integer          default("per_quarter"), not null
#  year                            :integer          not null
#  created_at                      :datetime         not null
#  updated_at                      :datetime         not null
#  company_id                      :bigint           not null
#
# Indexes
#
#  index_holidays_on_company_id    (company_id)
#  index_holidays_on_discarded_at  (discarded_at)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
FactoryBot.define do
  factory :holiday do
    company
    year { 2023 }
    enable_optional_holidays { true }
    no_of_allowed_optional_holidays { 1 }
    holiday_types { ["national", "optional"] }
    time_period_optional_holidays { "per_quarter" }
  end
end
