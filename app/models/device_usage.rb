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

  before_save :set_approve
  after_create :set_device_assignee
  after_update :update_device_assignee

  private

    def set_approve
      if self.device.available
        self.approve = true
      elsif !self.approve.present?
        self.approve = false
      end
    end

    def set_device_assignee
      device = self.device
      unless device.assignee_id.present?
        device.update(assignee_id: self.assignee_id, available: false) if self.assignee_id.present?
        index_system_display_title = "Now #{device.device_type} device #{device.manufacturer} #{device.name} #{device.version} assign to <b>#{self.assignee&.full_name}</b>"
      else
        index_system_display_title = "<b>#{self.assignee&.full_name}</b> need to #{device.device_type} device #{device.manufacturer} #{device.name} #{device.version}"
      end
      device.device_timelines.create!(index_system_display_title:)
    end

    def update_device_assignee
      device = self.device
      if self.approve && device.assignee_id.present? && self.assignee_id.present?
        index_system_display_title = "<b>#{device.assignee&.full_name}</b> #{device.device_type} device #{device.manufacturer} #{device.name} #{device.version} assign to #{self.assignee&.full_name}"
        device.update(assignee_id: self.assignee_id, available: false)
        device.device_timelines.create!(index_system_display_title:)
      end
    end
end
