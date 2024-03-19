# frozen_string_literal: true

require "rails_helper"

RSpec.describe TimeoffEntry, type: :model do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:holiday) { create(:holiday, year: Date.current.year, company:) }
  let(:national_holiday) { create(:holiday_info, date: Date.current, category: "national", holiday:) }
  let(:optional_holiday) { create(:holiday_info, date: Date.current, category: "optional", holiday:) }

  describe "validations" do
    it { is_expected.to validate_presence_of(:duration) }

    it do
      expect(subject).to validate_numericality_of(:duration)
        .is_less_than_or_equal_to(6000000)
        .is_greater_than_or_equal_to(0)
    end

    it { is_expected.to validate_presence_of(:leave_date) }

    it "is not valid if it exceeds the maximum number of permitted optional holidays" do # rubocop:disable RSpec/ExampleLength
      existing_timeoff_entry = create(
        :timeoff_entry,
        user_id: user.id,
        leave_type_id: nil,
        holiday_info_id: optional_holiday.id,
        duration: 400,
        leave_date: Date.current
      )

      new_time_off_entry = build(
        :timeoff_entry,
        user_id: user.id,
        leave_type_id: nil,
        holiday_info_id: optional_holiday.id,
        duration: 400,
        leave_date: Date.current,
      )

      expect(new_time_off_entry).not_to be_valid
      expect(new_time_off_entry.errors[:base]).to include(
        "You have exceeded the maximum number of permitted optional holidays")
    end
  end

  describe "associations" do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:leave_type).optional(true) }
    it { is_expected.to belong_to(:holiday_info).optional(true) }
  end
end
