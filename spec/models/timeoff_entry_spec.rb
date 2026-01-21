# frozen_string_literal: true

require "rails_helper"

RSpec.describe TimeoffEntry, type: :model do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:holiday) { create(:holiday, year: Date.current.year, company:, no_of_allowed_optional_holidays: 1) }
  let(:national_holiday) { create(:holiday_info, date: Date.current, category: "national", holiday:) }
  let(:optional_holiday) {
  create(
    :holiday_info, name: "Mahashivaratri", date: Date.current.beginning_of_year + 10.days, category: "optional",
    holiday:)
}
  let(:second_optional_holiday) {
  create(
    :holiday_info, name: "Sankranthi", date: Date.current.beginning_of_year + 20.days, category: "optional",
    holiday:)
}
  let(:third_optional_holiday) {
  create(:holiday_info, name: "Diwali", date: Date.current.beginning_of_year + 30.days, category: "optional", holiday:)
}
  let(:previous_year_holiday) { create(:holiday, year: Date.current.year - 1, company:) }
  let(:previous_year_national_holiday) { create(
    :holiday_info,
    date: Date.current - 1.year, category: "national", holiday: previous_year_holiday)
  }

  describe "validations" do
    before do
      # First optional holiday entry (saved)
      @timeoff_entry = create(
        :timeoff_entry,
        user_id: user.id,
        leave_type_id: nil,
        holiday_info_id: optional_holiday.id,
        duration: 400,
        leave_date: Date.current.beginning_of_year + 10.days
      )

      # Second optional holiday on same day (should fail with "same day" error)
      @entry_with_second_optional_holiday = build(
        :timeoff_entry,
        user_id: user.id,
        leave_type_id: nil,
        holiday_info_id: second_optional_holiday.id,
        duration: 400,
        leave_date: Date.current.beginning_of_year + 10.days,
      )

      # Same optional holiday on different day (should fail with "already applied" error)
      @entry_with_optional_holiday = build(
        :timeoff_entry,
        user_id: user.id,
        leave_type_id: nil,
        holiday_info_id: optional_holiday.id,
        duration: 400,
        leave_date: Date.current.beginning_of_year + 11.days,
      )

      # Third optional holiday in same quarter (should fail with "exceeded maximum" error)
      @entry_with_second_optional_holiday_in_same_quarter = build(
        :timeoff_entry,
        user_id: user.id,
        leave_type_id: nil,
        holiday_info_id: third_optional_holiday.id,
        duration: 400,
        leave_date: Date.current.beginning_of_year + 30.days,
      )

      @national_time_off_entry = build(
        :timeoff_entry,
        user_id: user.id,
        leave_type_id: nil,
        holiday_info_id: previous_year_national_holiday.id,
        duration: 400,
        leave_date: Date.current,
      )
    end

    it { is_expected.to validate_presence_of(:duration) }

    it do
      expect(subject).to validate_numericality_of(:duration)
        .is_less_than_or_equal_to(6000000)
        .is_greater_than_or_equal_to(0)
    end

    it { is_expected.to validate_presence_of(:leave_date) }

    it "is not valid if leave date and holiday are not from same year" do
      expect(@national_time_off_entry).not_to be_valid
      expect(@national_time_off_entry.errors[:base]).to include(
        "Can not apply for a leave by selecting holiday from another year")
    end

    it "is not valid if adding two holidays on the same day" do
      expect(@entry_with_second_optional_holiday).not_to be_valid
      expect(@entry_with_second_optional_holiday.errors[:base]).to include(
        "You are adding two holidays on the same day, please recheck")
    end

    it "is valid to edit an existing holiday without triggering the same-day validation" do
      @timeoff_entry.holiday_info_id = national_holiday.id
      expect(@timeoff_entry).to be_valid
    end

    it "is not valid if apply for same holiday again" do
      expect(@entry_with_optional_holiday).not_to be_valid
      expect(@entry_with_optional_holiday.errors[:base]).to include(
        "You already applied for this holiday, please recheck")
    end

    it "is not valid if it exceeds the maximum number of permitted optional holidays" do
      expect(@entry_with_second_optional_holiday_in_same_quarter).not_to be_valid
      expect(@entry_with_second_optional_holiday_in_same_quarter.errors[:base]).to include(
        "You have exceeded the maximum number of permitted optional holidays")
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:leave_type).optional(true) }
    it { is_expected.to belong_to(:holiday_info).optional(true) }
  end
end
