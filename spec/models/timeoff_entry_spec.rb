# frozen_string_literal: true

# == Schema Information
#
# Table name: timeoff_entries
#
#  id              :bigint           not null, primary key
#  discarded_at    :datetime
#  duration        :integer          not null
#  leave_date      :date             not null
#  note            :text             default("")
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  holiday_info_id :bigint
#  leave_type_id   :bigint
#  user_id         :bigint           not null
#
# Indexes
#
#  index_timeoff_entries_on_discarded_at     (discarded_at)
#  index_timeoff_entries_on_holiday_info_id  (holiday_info_id)
#  index_timeoff_entries_on_leave_type_id    (leave_type_id)
#  index_timeoff_entries_on_user_id          (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (leave_type_id => leave_types.id)
#  fk_rails_...  (user_id => users.id)
#
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
  end
end
