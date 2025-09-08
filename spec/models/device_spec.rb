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
require "rails_helper"

RSpec.describe Device, type: :model do
  let(:device) { create(:device) }

  describe "Associations" do
    it { is_expected.to belong_to(:issued_by) }
    it { is_expected.to belong_to(:issued_to) }
  end

  describe "Enums" do
    it do
      expect(subject).to define_enum_for(:device_type)
        .with_values(laptop: "laptop", mobile: "mobile")
        .backed_by_column_of_type(:string)
    end
  end

  describe "Length" do
    it { is_expected.to validate_length_of(:name).is_at_most(100) }
  end

  describe "Defaults" do
    it "default specifications to be empty strings" do
      expect(device.specifications["processor"]).to eq("")
      expect(device.specifications["ram"]).to eq("")
      expect(device.specifications["graphics"]).to eq("")
    end

    it "default device_type to be laptop" do
      expect(device.device_type).to eq("laptop")
    end
  end
end
