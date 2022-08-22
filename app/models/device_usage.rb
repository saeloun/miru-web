# frozen_string_literal: true

# == Schema Information
#
# Table name: device_usages
#
#  id            :bigint           not null, primary key
#  approve       :boolean
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  assignee_id   :bigint
#  created_by_id :bigint
#  device_id     :bigint           not null
#
# Indexes
#
#  index_device_usages_on_assignee_id    (assignee_id)
#  index_device_usages_on_created_by_id  (created_by_id)
#  index_device_usages_on_device_id      (device_id)
#
# Foreign Keys
#
#  fk_rails_...  (assignee_id => users.id)
#  fk_rails_...  (created_by_id => users.id)
#  fk_rails_...  (device_id => devices.id)
#
class DeviceUsage < ApplicationRecord
  belongs_to :created_by, class_name: :User, optional: true
  belongs_to :device
  belongs_to :assignee, class_name: :User, optional: true

  before_create :set_approve
  after_create :add_device_timelines

  private

    def set_approve
      self.approve = false unless self.approve.present?
    end

    def add_device_timelines
      device = self.device
      index_system_display_title = "<b>#{self.created_by&.full_name}</b> need to device #{device.device_company_name} #{device.name} #{device.version}"
      device.device_timelines.create!(index_system_display_title:)
    end
end
