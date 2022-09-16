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
#  user_id        :bigint
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
  DeviceOptionKlass = Struct.new(:name, :id)

  DEVICE_TYPE_OPTIONS = [
    DeviceOptionKlass.new("Laptop", "laptop"),
    DeviceOptionKlass.new("Mobile", "mobile"),
    DeviceOptionKlass.new("Tablet", "tablet"),
  ]

  belongs_to :assignee, class_name: :User, optional: true
  belongs_to :company, optional: true
  belongs_to :user, optional: true

  has_many :device_timelines, dependent: :destroy
  has_many :device_usages, dependent: :destroy

  before_create :set_availabilty
  # after_update :add_device_timelines

  # Device type values
  enum device_type: DEVICE_TYPE_OPTIONS.to_h { |i| [i.id.to_sym, i.id] }

  USERS_OPTIONS = User.all.map do |user|
    DeviceOptionKlass.new(user.full_name, user.id)
  end

  def formatted_entry
    {
      id: id.to_i,
      available:,
      base_os:,
      brand:,
      device_type:,
      manufacturer:,
      meta_details:,
      name:,
      serial_number:,
      specifications:,
      version:,
      assignee_id:,
      user_id:,
      version_id:
    }
  end

  private

    def set_availabilty
      self.available = true unless self.assignee_id.present?
      self.company_id = Company.first.id
    end

    def add_device_timelines
      device = self
      index_system_display_title = "Now #{device.device_type} device #{device.manufacturer} #{device.name} #{device.version} is #{device.available ? 'available' : 'not available'}"
      device.device_timelines.create!(index_system_display_title:)
    end
end
