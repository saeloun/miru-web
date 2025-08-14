# frozen_string_literal: true

# == Schema Information
#
# Table name: timeoff_entries
#
#  id              :bigint           not null, primary key
#  discarded_at    :datetime
#  duration        :integer          not null
#  leave_date      :date             not null
#  note            :text             default("")
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  holiday_info_id :bigint
#  leave_type_id   :bigint
#  user_id         :bigint           not null
#
# Indexes
#
#  index_timeoff_entries_on_discarded_at     (discarded_at)
#  index_timeoff_entries_on_holiday_info_id  (holiday_info_id)
#  index_timeoff_entries_on_leave_type_id    (leave_type_id)
#  index_timeoff_entries_on_user_id          (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (leave_type_id => leave_types.id)
#  fk_rails_...  (user_id => users.id)
#
FactoryBot.define do
  factory :timeoff_entry do
    user
    leave_type
    duration { 480 }
    note { "Did that" }
    leave_date { Date.current }
  end
end
