# frozen_string_literal: true

# == Schema Information
#
# Table name: device_timelines
#
#  id                           :bigint           not null, primary key
#  action_subject               :string
#  index_system_display_message :text
#  index_system_display_title   :text
#  created_at                   :datetime         not null
#  updated_at                   :datetime         not null
#  device_id                    :bigint           not null
#
# Indexes
#
#  index_device_timelines_on_device_id  (device_id)
#
# Foreign Keys
#
#  fk_rails_...  (device_id => devices.id)
#
class DeviceTimeline < ApplicationRecord
  belongs_to :device
end
