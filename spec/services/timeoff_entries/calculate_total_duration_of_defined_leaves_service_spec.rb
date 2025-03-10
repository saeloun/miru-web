# frozen_string_literal: true

require "rails_helper"

RSpec.describe TimeoffEntries::CalculateTotalDurationOfDefinedLeavesService do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:today) { Date.current }
  let!(:leave) { create(:leave, company:, year: today.year) }
  let!(:leave_types) do
    [
      create_leave_type("Annual", 2, :days, :per_month, LeaveType.icons[:calendar], LeaveType.colors[:chart_blue], 5),
      create_leave_type("Annual", 2, :days, :per_week, LeaveType.icons[:cake], LeaveType.colors[:chart_pink], 2),
      create_leave_type("Annual", 2, :days, :per_quarter, LeaveType.icons[:car], LeaveType.colors[:chart_green], 2),
      create_leave_type("Annual", 2, :days, :per_year, LeaveType.icons[:medicine], LeaveType.colors[:chart_orange], 2)
    ]
  end

  let!(:timeoff_entries) do # rubocop:disable RSpec/LetSetup
    [
      create(:timeoff_entry, duration: 60, leave_date: today, user:, leave_type: leave_types[0]),
      create(:timeoff_entry, duration: 90, leave_date: today, user:, leave_type: leave_types[1]),
      create(:timeoff_entry, duration: 120, leave_date: today, user:, leave_type: leave_types[2]),
      create(:timeoff_entry, duration: 150, leave_date: today, user:, leave_type: leave_types[3]),
    ]
  end

  let(:working_hours_per_day) { company.working_hours.to_i / company.working_days.to_i }
  let(:leave_type) { leave_types[0] }
  let(:service) {
    TimeoffEntries::CalculateTotalDurationOfDefinedLeavesService.new(
      today - 1.year,
      leave_type.allocation_value,
      leave_type.allocation_period.to_sym,
      leave_type.allocation_frequency.to_sym,
      today.year,
      working_hours_per_day,
      company.working_days
    )
  }

  describe "#initialize" do
    it "checks preset values in initialize method" do
      expect(service.current_date).to eq(today)
      expect(service.current_year).to eq(today.year)
      expect(service.current_month).to eq(today.month)
      expect(service.current_week).to eq(today.cweek)
    end
  end

  describe "#process" do
    it "returns leave balance for days per month when joining date is previous year" do
      total_days = service.process

      expect(total_days).to eq(today.month * 2)
    end
  end

  private

    def create_leave_type(name, allocation_value, allocation_period,
      allocation_frequency, icon, color, carry_forward_days)
      create(
        :leave_type,
        name:,
        allocation_period:,
        allocation_frequency:,
        allocation_value:,
        icon:,
        color:,
        carry_forward_days:,
        leave:
      )
    end
end
