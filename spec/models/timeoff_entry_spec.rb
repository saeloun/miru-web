# frozen_string_literal: true

require "rails_helper"

RSpec.describe TimeoffEntry, type: :model do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:holiday) { create(:holiday, year: Date.current.year, company:) }
  let(:national_holiday) { create(:holiday_info, date: Date.current, category: "national", holiday:) }
  let(:optional_holiday) {
  create(:holiday_info, name: "Mahashivaratri", date: Date.current, category: "optional", holiday:)
}
  let(:second_optional_holiday) {
  create(:holiday_info, name: "Sankranthi", date: Date.current, category: "optional", holiday:)
}
  let(:previous_year_holiday) { create(:holiday, year: Date.current.year - 1, company:) }
  let(:previous_year_national_holiday) { create(
    :holiday_info,
    date: Date.current - 1.year, category: "national", holiday: previous_year_holiday)
  }

  describe "validations" do
    before do
      @timeoff_entry = create(
        :timeoff_entry,
        user_id: user.id,
        leave_type_id: nil,
        holiday_info_id: optional_holiday.id,
        duration: 400,
        leave_date: Date.current
      )

      @entry_with_second_optional_holiday = build(
        :timeoff_entry,
        user_id: user.id,
        leave_type_id: nil,
        holiday_info_id: second_optional_holiday.id,
        duration: 400,
        leave_date: Date.current,
      )

      @entry_with_optional_holiday = build(
        :timeoff_entry,
        user_id: user.id,
        leave_type_id: nil,
        holiday_info_id: optional_holiday.id,
        duration: 400,
        leave_date: Date.current + 1,
      )

      @entry_with_second_optional_holiday_in_same_quarter = build(
        :timeoff_entry,
        user_id: user.id,
        leave_type_id: nil,
        holiday_info_id: second_optional_holiday.id,
        duration: 400,
        leave_date: Date.current + 1,
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
    it { is_expected.to belong_to(:custom_leave).optional(true) }
  end

  describe "custom leave validations" do
    let(:leave) { create(:leave, company:, year: Date.current.year) }
    let(:custom_leave) { create(:custom_leave, leave:, name: "Special Leave", allocation_value: 5) }

    it "is valid with only custom_leave_id" do
      timeoff_entry = build(
        :timeoff_entry,
        user:,
        leave_type: nil,
        holiday_info: nil,
        custom_leave:,
        duration: 480,
        leave_date: Date.current
      )
      expect(timeoff_entry).to be_valid
    end

    it "is not valid with both leave_type_id and custom_leave_id" do
      leave_type = create(:leave_type, leave:)
      timeoff_entry = build(
        :timeoff_entry,
        user:,
        leave_type:,
        custom_leave:,
        duration: 480,
        leave_date: Date.current
      )
      expect(timeoff_entry).not_to be_valid
      expect(timeoff_entry.errors[:base]).to include("Choose only one of leave type, holiday info, or custom leave")
    end

    it "is not valid without any leave type, holiday info, or custom leave" do
      timeoff_entry = build(
        :timeoff_entry,
        user:,
        leave_type: nil,
        holiday_info: nil,
        custom_leave: nil,
        duration: 480,
        leave_date: Date.current
      )
      expect(timeoff_entry).not_to be_valid
      expect(timeoff_entry.errors[:base]).to include(
        "Either leave type, holiday info, or custom leave must be present"
      )
    end
  end
end
