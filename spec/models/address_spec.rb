# frozen_string_literal: true

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
end
