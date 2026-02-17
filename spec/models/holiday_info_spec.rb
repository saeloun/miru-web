# frozen_string_literal: true

# == Schema Information
#
# Table name: holiday_infos
#
#  id           :bigint           not null, primary key
#  category     :integer          default("national"), not null
#  date         :date             not null
#  discarded_at :datetime
#  name         :string           not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  holiday_id   :bigint           not null
#
# Indexes
#
#  index_holiday_infos_on_date          (date)
#  index_holiday_infos_on_discarded_at  (discarded_at)
#  index_holiday_infos_on_holiday_id    (holiday_id)
#
# Foreign Keys
#
#  fk_rails_...  (holiday_id => holidays.id)
#
require "rails_helper"

RSpec.describe HolidayInfo, type: :model do
  let(:holiday) { create(:holiday) }
  let(:national_holiday_info) { create(:holiday_info, category: "national") }
  let(:optional_holiday_info) { create(:holiday_info, category: "optional") }

  describe "associations" do
    it { is_expected.to belong_to(:holiday) }
  end

  describe "enums" do
    it { is_expected.to define_enum_for(:category).with_values(national: 0, optional: 1) }
  end

  describe "validations" do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_length_of(:name).is_at_most(30) }
    it { is_expected.to allow_value("Valid Name").for(:name) }
    it { is_expected.not_to allow_value("Invalid Name!").for(:name) }
    it { is_expected.to validate_presence_of(:date) }
    it { is_expected.to validate_presence_of(:category) }

    it "validates the year of the date" do
      invalid_holiday_info = build(:holiday_info, holiday:, date: "2022-01-01")
      invalid_holiday_info.valid?
      expect(invalid_holiday_info.errors[:date]).to include("must have the same year as the associated holiday")
    end
  end

  describe "scopes" do
    it "returns holiday_infos for a specific year and category" do
      national_holiday_info
      optional_holiday_info
      result = HolidayInfo.for_year_and_category(holiday.year, "national")
      expect(result).to include(national_holiday_info)
      expect(result).not_to include(optional_holiday_info)
    end
  end
end
