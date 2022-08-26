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
#  company_id     :bigint           not null
#  user_id        :bigint           not null
#  version_id     :string
#
# Indexes
#
#  index_devices_on_assignee_id  (assignee_id)
#  index_devices_on_company_id   (company_id)
#  index_devices_on_user_id      (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (assignee_id => users.id)
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (user_id => users.id)
#
class Device < ApplicationRecord
  belongs_to :assignee, class_name: :User, optional: true
  belongs_to :company, optional: true
  belongs_to :user, optional: true

  has_many :device_timelines, dependent: :destroy
  has_many :device_usages, dependent: :destroy

  before_create :set_availabilty
  after_update :add_device_timelines

  # Device type values
  enum device_type: { laptop: "laptop", mobile: "mobile", tablet: "tablet" }

  private

    def set_availabilty
      self.available = true unless self.assignee_id.present?
    end

    def add_device_timelines
      device = self
      index_system_display_title = "Now #{device.device_type} device #{device.manufacturer} #{device.name} #{device.version} is #{device.available ? 'available' : 'not available'}"
      device.device_timelines.create!(index_system_display_title:)
    end
end
