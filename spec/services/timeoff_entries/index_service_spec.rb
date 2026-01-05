# frozen_string_literal: true

require "rails_helper"

RSpec.describe TimeoffEntries::IndexService do # rubocop:disable RSpec/FilePath
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:leave) { create(:leave, company:, year: Date.today.year) }
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
      create(:timeoff_entry, duration: 60, leave_date: Date.today, user:, leave_type: leave_types[0]),
      create(:timeoff_entry, duration: 90, leave_date: Date.today, user:, leave_type: leave_types[1]),
      create(:timeoff_entry, duration: 120, leave_date: Date.today, user:, leave_type: leave_types[2]),
      create(:timeoff_entry, duration: 150, leave_date: Date.today, user:, leave_type: leave_types[3]),
    ]
  end

  let(:working_hours_per_day) { company.working_hours.to_i / company.working_days.to_i }

  describe "#initialize" do
    it "checks preset values in initialize method" do
      params = {
        user_id: user.id,
        year: Date.today.year
      }

      service = TimeoffEntries::IndexService.new(user, company, params[:user_id], params[:year])

      expect(service.current_user.present?).to be true
      expect(service.current_company.present?).to be true
      expect(service.user_id.present?).to be true
      expect(service.year.present?).to be true
    end
  end

  describe "#process" do
    before do
      @joined_at = Date.today - 1.year
      @year = Date.today.year
      create(:employment, company:, user:, joined_at: @joined_at, resigned_at: nil)
      user.add_role :admin, company

      params = {
        user_id: user.id,
        year: @year
      }

      service = TimeoffEntries::IndexService.new(user, company, params[:user_id], params[:year])
      @data = service.process
    end

    it "checks for all timeoff entries of current user" do
      timeoff_entries ||= company.timeoff_entries.includes([:leave_type])
        .where(user_id: user.id)
        .order(leave_date: :desc)

      expect(@data[:timeoff_entries]).to eq(timeoff_entries)
    end

    it "returns all the employees if the current user is admin" do
      expect(@data[:employees]).to eq(company.users)
    end

    it "returns total timeoff entries duration" do
      timeoff_entries_duration ||= company.timeoff_entries.includes([:leave_type])
        .where(user_id: user.id)
        .order(leave_date: :desc)
        .sum(:duration)

      expect(@data[:total_timeoff_entries_duration]).to eq(timeoff_entries_duration)
    end

    it "returns leave balance for days per month when joining date is previous year" do # rubocop:disable RSpec/ExampleLength
      leave_type = leave_types[0]
      total_days = calculate_leave_type_days(@joined_at, leave_type, @year)
      timeoff_entries_duration = leave_type.timeoff_entries.sum(:duration)
      net_duration = (total_days * working_hours_per_day * 60) - timeoff_entries_duration
      net_hours = net_duration / 60
      net_days = net_hours / working_hours_per_day
      extra_hours = net_hours % working_hours_per_day

      summary_object = {
        id: leave_type.id,
        name: leave_type.name,
        icon: leave_type.icon,
        color: leave_type.color,
        total_leave_type_days: total_days,
        timeoff_entries_duration:,
        net_duration:,
        net_days:,
        label: "#{net_days} days #{extra_hours} hours",
        type: "leave"
      }

      expect(@data[:leave_balance][0]).to eq(summary_object)
    end

    it "returns leave balance for days per week when joining date is previous year" do # rubocop:disable RSpec/ExampleLength
      leave_type = leave_types[1]
      total_days = calculate_leave_type_days(@joined_at, leave_type, @year)
      timeoff_entries_duration = leave_type.timeoff_entries.sum(:duration)
      net_duration = (total_days * working_hours_per_day * 60) - timeoff_entries_duration
      net_hours = net_duration / 60
      net_days = net_hours / working_hours_per_day
      extra_hours = net_hours % working_hours_per_day

      summary_object = {
        id: leave_type.id,
        name: leave_type.name,
        icon: leave_type.icon,
        color: leave_type.color,
        total_leave_type_days: total_days,
        timeoff_entries_duration:,
        net_duration:,
        net_days:,
        label: "#{net_days} days #{extra_hours} hours",
        type: "leave"
      }

      expect(@data[:leave_balance][1]).to eq(summary_object)
    end

    it "returns leave balance for days per quarter when joining date is previous year" do # rubocop:disable RSpec/ExampleLength
      leave_type = leave_types[2]
      total_days = calculate_leave_type_days(@joined_at, leave_type, @year)
      timeoff_entries_duration = leave_type.timeoff_entries.sum(:duration)
      net_duration = (total_days * working_hours_per_day * 60) - timeoff_entries_duration
      net_hours = net_duration / 60
      net_days = net_hours / working_hours_per_day
      extra_hours = net_hours % working_hours_per_day

      summary_object = {
        id: leave_type.id,
        name: leave_type.name,
        icon: leave_type.icon,
        color: leave_type.color,
        total_leave_type_days: total_days,
        timeoff_entries_duration:,
        net_duration:,
        net_days:,
        label: "#{net_days} days #{extra_hours} hours",
        type: "leave"
      }

      expect(@data[:leave_balance][2]).to eq(summary_object)
    end

    it "returns leave balance for days per year when joining date is previous year" do # rubocop:disable RSpec/ExampleLength
      leave_type = leave_types[3]
      total_days = calculate_leave_type_days(@joined_at, leave_type, @year)
      timeoff_entries_duration = leave_type.timeoff_entries.sum(:duration)
      net_duration = (total_days * working_hours_per_day * 60) - timeoff_entries_duration
      net_hours = net_duration / 60
      net_days = net_hours / working_hours_per_day
      extra_hours = net_hours % working_hours_per_day

      summary_object = {
        id: leave_type.id,
        name: leave_type.name,
        icon: leave_type.icon,
        color: leave_type.color,
        total_leave_type_days: total_days,
        timeoff_entries_duration:,
        net_duration:,
        net_days:,
        label: "#{net_days} days #{extra_hours} hours",
        type: "leave"
      }

      expect(@data[:leave_balance][3]).to eq(summary_object)
    end
  end

  describe "#process when joining date is current year" do
    before do
      @joined_at = Date.new(Time.current.year, 1, 16)
      @year = Date.today.year

      create(:employment, company:, user:, joined_at: @joined_at, resigned_at: nil)
      user.add_role :admin, company

      params = {
        user_id: user.id,
        year: @year
      }

      service = TimeoffEntries::IndexService.new(user, company, params[:user_id], params[:year])

      @data = service.process
    end

    it "returns leave balance for days per month when joining date is current year" do # rubocop:disable RSpec/ExampleLength
      leave_type = leave_types[0]
      total_days = calculate_leave_type_days(@joined_at, leave_type, @year)
      timeoff_entries_duration = leave_type.timeoff_entries.sum(:duration)
      net_duration = (total_days * working_hours_per_day * 60) - timeoff_entries_duration
      net_hours = net_duration / 60
      net_days = net_hours / working_hours_per_day
      extra_hours = net_hours % working_hours_per_day

      label = if net_hours < working_hours_per_day
        "#{net_hours} hours"
      else
        "#{net_days} days #{extra_hours} hours"
      end

      summary_object = {
        id: leave_type.id,
        name: leave_type.name,
        icon: leave_type.icon,
        color: leave_type.color,
        total_leave_type_days: total_days,
        timeoff_entries_duration:,
        net_duration:,
        net_days:,
        label:,
        type: "leave"
      }

      expect(@data[:leave_balance][0]).to eq(summary_object)
    end

    it "returns leave balance for days per week when joining date is current year" do # rubocop:disable RSpec/ExampleLength
      leave_type = leave_types[1]
      total_days = calculate_leave_type_days(@joined_at, leave_type, @year)
      timeoff_entries_duration = leave_type.timeoff_entries.sum(:duration)
      net_duration = (total_days * working_hours_per_day * 60) - timeoff_entries_duration
      net_hours = net_duration / 60
      net_days = net_hours / working_hours_per_day
      extra_hours = net_hours % working_hours_per_day

      summary_object = {
        id: leave_type.id,
        name: leave_type.name,
        icon: leave_type.icon,
        color: leave_type.color,
        total_leave_type_days: total_days,
        timeoff_entries_duration:,
        net_duration:,
        net_days:,
        label: "Overdrawn by #{net_hours.abs / working_hours_per_day} days " \
               "#{net_hours.abs % working_hours_per_day} hours",
        type: "leave"
      }

      expect(@data[:leave_balance][1]).to eq(summary_object)
    end

    it "returns leave balance for days per quarter when joining date is current year" do # rubocop:disable RSpec/ExampleLength
      leave_type = leave_types[2]
      total_days = calculate_leave_type_days(@joined_at, leave_type, @year)
      timeoff_entries_duration = leave_type.timeoff_entries.sum(:duration)
      net_duration = (total_days * working_hours_per_day * 60) - timeoff_entries_duration
      net_hours = net_duration / 60
      net_days = net_hours / working_hours_per_day
      extra_hours = net_hours % working_hours_per_day

      summary_object = {
        id: leave_type.id,
        name: leave_type.name,
        icon: leave_type.icon,
        color: leave_type.color,
        total_leave_type_days: total_days,
        timeoff_entries_duration:,
        net_duration:,
        net_days:,
        label: "#{net_days} days #{extra_hours} hours",
        type: "leave"
      }

      expect(@data[:leave_balance][2]).to eq(summary_object)
    end

    it "returns leave balance for days per year when joining date is current year" do # rubocop:disable RSpec/ExampleLength
      leave_type = leave_types[3]
      total_days = calculate_leave_type_days(@joined_at, leave_type, @year)
      timeoff_entries_duration = leave_type.timeoff_entries.sum(:duration)
      net_duration = (total_days * working_hours_per_day * 60) - timeoff_entries_duration
      net_hours = net_duration / 60
      net_days = net_hours / working_hours_per_day
      extra_hours = net_hours % working_hours_per_day

      summary_object = {
        id: leave_type.id,
        name: leave_type.name,
        icon: leave_type.icon,
        color: leave_type.color,
        total_leave_type_days: total_days,
        timeoff_entries_duration:,
        net_duration:,
        net_days:,
        label: "#{net_days} days #{extra_hours} hours",
        type: "leave"
      }

      expect(@data[:leave_balance][3]).to eq(summary_object)
    end
  end

  describe "#process with zero leave balance" do
    let(:zero_balance_leave_type) do
      create(
        :leave_type,
        name: "Zero Balance Leave",
        allocation_period: :days,
        allocation_frequency: :per_year,
        allocation_value: 1,
        icon: LeaveType.icons[:vacation],
        color: LeaveType.colors[:chart_purple],
        carry_forward_days: 0,
        leave:
      )
    end

    before do
      @joined_at = Date.today - 1.year
      @year = Date.today.year
      create(:employment, company:, user:, joined_at: @joined_at, resigned_at: nil)
      user.add_role :admin, company

      # Create timeoff entry that exactly matches the allocation (1 day = working_hours_per_day hours)
      create(
        :timeoff_entry,
        duration: working_hours_per_day * 60,
        leave_date: Date.today,
        user:,
        leave_type: zero_balance_leave_type
      )

      service = TimeoffEntries::IndexService.new(user, company, user.id, @year)
      @data = service.process
    end

    it "returns '0 hours' label when balance is exactly zero" do
      leave_balance_entry = @data[:leave_balance].find { |lb| lb[:id] == zero_balance_leave_type.id }

      expect(leave_balance_entry[:net_duration]).to eq(0)
      expect(leave_balance_entry[:label]).to eq("0 hours")
    end
  end

  describe "#process with negative leave balance (overdrawn)" do
    let(:overdrawn_leave_type) do
      create(
        :leave_type,
        name: "Overdrawn Leave",
        allocation_period: :days,
        allocation_frequency: :per_year,
        allocation_value: 1,
        icon: LeaveType.icons[:baby],
        color: LeaveType.colors[:chart_light_blue],
        carry_forward_days: 0,
        leave:
      )
    end

    before do
      @joined_at = Date.today - 1.year
      @year = Date.today.year
      create(:employment, company:, user:, joined_at: @joined_at, resigned_at: nil)
      user.add_role :admin, company
    end

    context "when overdrawn by hours only" do
      before do
        # Allocation is 1 day, take 1 day + 2 hours (overdrawn by 2 hours)
        overdrawn_hours = 2
        create(
          :timeoff_entry,
          duration: (working_hours_per_day + overdrawn_hours) * 60,
          leave_date: Date.today,
          user:,
          leave_type: overdrawn_leave_type
        )

        service = TimeoffEntries::IndexService.new(user, company, user.id, @year)
        @data = service.process
      end

      it "returns 'Overdrawn by X hours' label for small negative balance" do
        leave_balance_entry = @data[:leave_balance].find { |lb| lb[:id] == overdrawn_leave_type.id }

        expect(leave_balance_entry[:net_duration]).to be_negative
        expect(leave_balance_entry[:label]).to eq("Overdrawn by 2 hours")
      end
    end

    context "when overdrawn by days and hours" do
      before do
        # Allocation is 1 day, take 3 days + 2 hours (overdrawn by 2 days 2 hours)
        overdrawn_days = 2
        overdrawn_hours = 2
        total_overdrawn_minutes = ((working_hours_per_day * (1 + overdrawn_days)) + overdrawn_hours) * 60
        create(
          :timeoff_entry,
          duration: total_overdrawn_minutes,
          leave_date: Date.today,
          user:,
          leave_type: overdrawn_leave_type
        )

        service = TimeoffEntries::IndexService.new(user, company, user.id, @year)
        @data = service.process
      end

      it "returns 'Overdrawn by X days Y hours' label for larger negative balance" do
        leave_balance_entry = @data[:leave_balance].find { |lb| lb[:id] == overdrawn_leave_type.id }

        expect(leave_balance_entry[:net_duration]).to be_negative
        expect(leave_balance_entry[:label]).to eq("Overdrawn by 2 days 2 hours")
      end
    end
  end

  private

    def create_leave_type(name, allocation_value, allocation_period, allocation_frequency, icon, color,
carry_forward_days)
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

    def calculate_leave_type_days(joined_at, leave_type, year)
      TimeoffEntries::CalculateTotalDurationOfDefinedLeavesService.new(
        joined_at,
        leave_type.allocation_value,
        leave_type.allocation_period.to_sym,
        leave_type.allocation_frequency.to_sym,
        year,
        working_hours_per_day,
        company.working_days
      ).process
    end
end
