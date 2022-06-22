# frozen_string_literal: true

require "rails_helper"

RSpec.describe Device, type: :model do
  let(:device) { create(:device) }

  describe "Validations" do
    describe "Associations" do
      it { is_expected.to belong_to(:issued_by) }
      it { is_expected.to belong_to(:issued_to) }
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

    describe "Enums" do
      it {
  expect(subject).to define_enum_for(:device_type).with_values(
    laptop: "laptop",
    mobile: "mobile").backed_by_column_of_type(:string)
}
    end
  end
end
