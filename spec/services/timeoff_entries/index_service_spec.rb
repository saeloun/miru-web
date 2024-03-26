# frozen_string_literal: true

require "rails_helper"

RSpec.describe TimeoffEntries::IndexService do # rubocop:disable RSpec/FilePath
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:leave) { create(:leave, company:, year: Date.today.year) }
  let!(:leave_type) {
    create(
      :leave_type,
      name: "Annual",
      allocation_value: 2,
      icon: LeaveType.icons[:calendar],
      color: LeaveType.colors[:chart_blue],
      allocation_period: :days,
      allocation_frequency: :per_month,
      carry_forward_days: 5,
      leave:
    )
  }
  let!(:leave_type_days_per_week) {
    create(
      :leave_type,
      name: "Annual",
      icon: LeaveType.icons[:cake],
      color: LeaveType.colors[:chart_pink],
      allocation_value: 2,
      allocation_period: :days,
      allocation_frequency: :per_week,
      carry_forward_days: 2,
      leave:
    )
  }

  let!(:leave_type_days_per_quarter) {
    create(
      :leave_type,
      name: "Annual",
      icon: LeaveType.icons[:car],
      color: LeaveType.colors[:chart_green],
      allocation_value: 2,
      allocation_period: :days,
      allocation_frequency: :per_quarter,
      carry_forward_days: 2,
      leave:
    )
  }

  let!(:leave_type_days_per_year) {
    create(
      :leave_type,
      name: "Annual",
      icon: LeaveType.icons[:medicine],
      color: LeaveType.colors[:chart_orange],
      allocation_value: 2,
      allocation_period: :days,
      allocation_frequency: :per_year,
      carry_forward_days: 2,
      leave:
    )
  }

  let!(:timeoff_entry) { # rubocop:disable RSpec/LetSetup
      create(
        :timeoff_entry,
        duration: 60,
        leave_date: Date.today,
        user:,
        leave_type:)
    }

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
      create(:employment, company:, user:)
      user.add_role :admin, company

      params = {
        user_id: user.id,
        year: Date.today.year
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

    it "returns leave balance for days per month" do
      summary_object = {
        id: leave_type.id,
        name: leave_type.name,
        icon: leave_type.icon,
        color: leave_type.color,
        total_leave_type_days: 6,
        timeoff_entries_duration: 60,
        net_duration: 2820,
        net_days: 5,
        type: "leave"
      }
      expect(@data[:leave_balance][0]).to eq(summary_object)
    end

    it "returns leave balance for days per week" do
      current_week = Date.today.cweek
      expected_net_days = current_week * 2
      expected_net_duration = expected_net_days * 8 * 60
      summary_object = {
        id: leave_type_days_per_week.id,
        name: leave_type_days_per_week.name,
        icon: leave_type_days_per_week.icon,
        color: leave_type_days_per_week.color,
        total_leave_type_days: expected_net_days,
        timeoff_entries_duration: 0,
        type: "leave",
        net_duration: expected_net_duration,
        net_days: expected_net_days
      }

      expect(@data[:leave_balance][1]).to eq(summary_object)
    end

    it "returns leave balance for days per quarter" do
      summary_object = {
        id: leave_type_days_per_quarter.id,
        name: leave_type_days_per_quarter.name,
        icon: leave_type_days_per_quarter.icon,
        color: leave_type_days_per_quarter.color,
        total_leave_type_days: 2,
        timeoff_entries_duration: 0,
        net_duration: 960,
        net_days: 2,
        type: "leave"
      }

      expect(@data[:leave_balance][2]).to eq(summary_object)
    end

    it "returns leave balance for days per year" do
      summary_object = {
        id: leave_type_days_per_year.id,
        name: leave_type_days_per_year.name,
        icon: leave_type_days_per_year.icon,
        color: leave_type_days_per_year.color,
        total_leave_type_days: 2,
        timeoff_entries_duration: 0,
        net_duration: 960,
        net_days: 2,
        type: "leave"
      }

      expect(@data[:leave_balance][3]).to eq(summary_object)
    end
  end

  describe "#process days per month when joining date is current year" do
    before do
      create(:employment, company:, user:, joined_at: Date.new(Time.current.year, 1, 16), resigned_at: nil)
      user.add_role :admin, company

      params = {
        user_id: user.id,
        year: Date.today.year
      }

      service = TimeoffEntries::IndexService.new(user, company, params[:user_id], params[:year])
      @data = service.process
    end

    it "returns leave balance for days per month" do
      summary_object = {
        id: leave_type.id,
        name: leave_type.name,
        icon: leave_type.icon,
        color: leave_type.color,
        total_leave_type_days: 5,
        timeoff_entries_duration: 60,
        net_duration: 2340,
        net_days: 4,
        type: "leave"
      }

      expect(@data[:leave_balance][0]).to eq(summary_object)
    end
  end

  describe "#process days per week when joining date is current year" do
    before do
      create(:employment, company:, user:, joined_at: Date.new(Time.current.year, 1, 5), resigned_at: nil)
      user.add_role :admin, company

      params = {
        user_id: user.id,
        year: Date.today.year
      }

      service = TimeoffEntries::IndexService.new(user, company, params[:user_id], params[:year])
      @data = service.process
    end

    it "returns leave balance for days per week" do # rubocop:disable RSpec/ExampleLength
      allocation_value_per_week = 2
      current_week = Date.today.cweek
      joining_date = Date.new(Time.current.year, 1, 5)
      total_weeks_since_joining = current_week - joining_date.cweek
      first_week_adjustment = joining_date.wday >= 3 && joining_date.wday <= 5 ? (allocation_value_per_week / 2) :
        allocation_value_per_week
      expected_net_days = first_week_adjustment + (allocation_value_per_week * total_weeks_since_joining)
      expected_net_duration = expected_net_days * 8 * 60
      summary_object = {
        id: leave_type_days_per_week.id,
        name: leave_type_days_per_week.name,
        icon: leave_type_days_per_week.icon,
        color: leave_type_days_per_week.color,
        total_leave_type_days: expected_net_days,
        timeoff_entries_duration: 0,
        type: "leave",
        net_duration: expected_net_duration,
        net_days: expected_net_days

      }

      expect(@data[:leave_balance][1]).to eq(summary_object)
    end
  end

  describe "#process days per quarter when joining date is current year" do
    before do
      create(:employment, company:, user:, joined_at: Date.new(Time.current.year, 2, 17), resigned_at: nil)
      user.add_role :admin, company

      params = {
        user_id: user.id,
        year: Date.today.year
      }

      service = TimeoffEntries::IndexService.new(user, company, params[:user_id], params[:year])
      @data = service.process
    end

    it "returns leave balance for days per quarter" do
      summary_object = {
        id: leave_type_days_per_quarter.id,
        name: leave_type_days_per_quarter.name,
        icon: leave_type_days_per_quarter.icon,
        color: leave_type_days_per_quarter.color,
        total_leave_type_days: 1,
        timeoff_entries_duration: 0,
        net_duration: 480,
        net_days: 1,
        type: "leave"
      }

      expect(@data[:leave_balance][2]).to eq(summary_object)
    end
  end

  describe "#process days per year when joining date is current year" do
    before do
      create(:employment, company:, user:, joined_at: Date.new(Time.current.year, 1, 5), resigned_at: nil)
      user.add_role :admin, company

      params = {
        user_id: user.id,
        year: Date.today.year
      }

      service = TimeoffEntries::IndexService.new(user, company, params[:user_id], params[:year])
      @data = service.process
    end

    it "returns leave balance for days per year" do
      summary_object = {
        id: leave_type_days_per_year.id,
        name: leave_type_days_per_year.name,
        icon: leave_type_days_per_year.icon,
        color: leave_type_days_per_year.color,
        total_leave_type_days: 2,
        timeoff_entries_duration: 0,
        net_duration: 960,
        net_days: 2,
        type: "leave"
      }

      expect(@data[:leave_balance][3]).to eq(summary_object)
    end
  end
end
