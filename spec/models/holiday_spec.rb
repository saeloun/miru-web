# frozen_string_literal: true

require "rails_helper"

RSpec.describe Holiday, type: :model do
  subject { create(:holiday) }

  describe "associations" do
    it { is_expected.to belong_to(:company) }
    it { is_expected.to have_many(:holiday_infos).dependent(:destroy) }
  end

  describe "enums" do
    it {
  expect(subject).to define_enum_for(:time_period_optional_holidays).with_values(
    per_quarter: 0, per_year: 1,
    per_month: 2)
}
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:year) }
    it { is_expected.to validate_uniqueness_of(:year).scoped_to(:company_id) }

    it "validates that :year is an integer" do
      expect(subject).to validate_numericality_of(:year)
        .only_integer
        .is_greater_than_or_equal_to(1900)
        .is_less_than_or_equal_to(2099)
    end
  end
end
