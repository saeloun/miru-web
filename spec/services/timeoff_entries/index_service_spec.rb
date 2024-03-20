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
      allocation_period: :days,
      allocation_frequency: :per_month,
      carry_forward_days: 5,
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

    it "returns leave balance" do
      summary_object = {
        id: leave_type.id,
        name: leave_type.name,
        icon: leave_type.icon,
        color: leave_type.color,
        total_leave_type_days: 6,
        timeoff_entries_duration: 60,
        net_duration: 2820,
        net_days: 5
      }

      expect(@data[:leave_balance][0]).to eq(summary_object)
    end
  end
end
