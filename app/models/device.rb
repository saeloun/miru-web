# frozen_string_literal: true

# == Schema Information
#
# Table name: devices
#
#  id             :bigint           not null, primary key
#  available      :boolean
#  base_os        :string
#  brand          :string
#  device_type    :string           default("laptop")
#  manufacturer   :string
#  meta_details   :text
#  name           :string
#  serial_number  :string
#  specifications :jsonb
#  version        :string
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#  assignee_id    :bigint
#  company_id     :bigint
#  version_id     :string
#
# Indexes
#
#  index_devices_on_assignee_id  (assignee_id)
#  index_devices_on_company_id   (company_id)
#
# Foreign Keys
#
#  fk_rails_...  (assignee_id => users.id)
#  fk_rails_...  (company_id => companies.id)
#
class Device < ApplicationRecord
  belongs_to :assignee, class_name: :User, optional: true
  belongs_to :company, optional: true

  has_many :device_timelines
  has_many :device_usages

  before_create :set_availabilty
  after_update :add_device_timelines

  private

    def set_availabilty
      self.available = true unless self.available.present?
    end

    def add_device_timelines
      device = self
      index_system_display_title = "Now #{device.device_company_name} #{device.name} #{device.version} #{device.available ? 'available' : 'not available'}"
      device.device_timelines.create!(index_system_display_title:)
    end
end
