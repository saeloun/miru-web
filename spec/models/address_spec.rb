# frozen_string_literal: true

# == Schema Information
#
# Table name: addresses
#
#  id               :bigint           not null, primary key
#  address_line_1   :string           not null
#  address_line_2   :string
#  address_type     :string           default("current")
#  addressable_type :string
#  city             :string           not null
#  country          :string           not null
#  pin              :string           not null
#  state            :string           not null
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  addressable_id   :bigint
#
# Indexes
#
#  index_addresses_on_addressable                   (addressable_type,addressable_id)
#  index_addresses_on_addressable_and_address_type  (addressable_type,addressable_id,address_type) UNIQUE
#
require "rails_helper"

RSpec.describe Address, type: :model do
  subject { build(:address) }

  describe "Associations" do
    it "has a polymorphic relationship" do
      expect(subject).to belong_to(:addressable)
    end
  end

  describe "Validations" do
    it { is_expected.to validate_presence_of(:address_type) }
    it { is_expected.to validate_presence_of(:address_line_1) }
    it { is_expected.to validate_presence_of(:state) }
    it { is_expected.to validate_presence_of(:city) }
    it { is_expected.to validate_presence_of(:country) }
    it { is_expected.to validate_presence_of(:pin) }
    it { is_expected.to validate_length_of(:address_line_1).is_at_most(50) }
    it { is_expected.to validate_length_of(:address_line_2).is_at_most(50) }
    it { is_expected.to validate_length_of(:pin).is_at_most(10) }

    it do
      expect(subject).to validate_uniqueness_of(:address_type)
        .scoped_to(:addressable_id, :addressable_type)
        .ignoring_case_sensitivity
    end
  end

  describe "Enums" do
    it do
      expect(subject).to define_enum_for(:address_type).with_values(
        current: "current",
        permanent: "permanent"
      ).backed_by_column_of_type(:string)
    end
  end

  describe "Defaults" do
     it "default address_type to be current" do
       expect(subject.address_type).to eq("current")
     end
   end
end
