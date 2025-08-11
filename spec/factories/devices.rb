# frozen_string_literal: true

# == Schema Information
#
# Table name: devices
#
#  id             :bigint           not null, primary key
#  device_type    :string           default("laptop")
#  name           :string
#  serial_number  :string
#  specifications :jsonb
#  created_at     :datetime         not null
#  updated_at     :datetime         not null
#  company_id     :bigint           not null
#  user_id        :bigint           not null
#
# Indexes
#
#  index_devices_on_company_id   (company_id)
#  index_devices_on_device_type  (device_type)
#  index_devices_on_user_id      (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#  fk_rails_...  (user_id => users.id)
#
FactoryBot.define do
  factory :device do
    issued_to factory: :user
    issued_by factory: :company
    name { Faker::Alphanumeric.alphanumeric }
    serial_number { Faker::Alphanumeric.alphanumeric }
  end
end
