# frozen_string_literal: true

# == Schema Information
#
# Table name: holiday_infos
#
#  id           :bigint           not null, primary key
#  category     :integer          default("national"), not null
#  date         :date             not null
#  discarded_at :datetime
#  name         :string           not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  holiday_id   :bigint           not null
#
# Indexes
#
#  index_holiday_infos_on_discarded_at  (discarded_at)
#  index_holiday_infos_on_holiday_id    (holiday_id)
#
# Foreign Keys
#
#  fk_rails_...  (holiday_id => holidays.id)
#
FactoryBot.define do
  factory :holiday_info do
    holiday
    name { "New Year" }
    date { "2023-01-01" }
    category { "national" }
  end
end
