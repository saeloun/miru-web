# frozen_string_literal: true

require "rails_helper"

RSpec.describe TimeoffEntries::IndexDecorator do
  let(:company) { create(:company) }
  let(:current_user) { create(:user) }
  let(:user) { create(:user) }
  let(:year) { Date.current.year }
  let(:service) { described_class.new(current_user, company, user_id, year) }
  let(:user_id) { user.id }

  before do
    create(:employment, user: current_user, company: company)
    create(:employment, user: user, company: company)
  end

  describe "#process" do
    subject { service.process }

    context "with timeoff entries and leave types" do
      let!(:leave) { create(:leave, company: company, year: year) }
      let!(:leave_type1) { create(:leave_type, leave: leave, name: "Annual", allocation_value: 20, allocation_period: "days", allocation_frequency: "per_month", color: "chart_blue", icon: "calendar") }
      let!(:leave_type2) { create(:leave_type, leave: leave, name: "Sick", allocation_value: 10, allocation_period: "days", allocation_frequency: "per_month", color: "chart_green", icon: "medicine") }

      let!(:timeoff_entry1) do
        create(:timeoff_entry,
          user: user,
          leave_type: leave_type1,
          leave_date: Date.current,
          duration: 480 # 1 day
        )
      end

      let!(:timeoff_entry2) do
        create(:timeoff_entry,
          user: user,
          leave_type: leave_type2,
          leave_date: 1.week.ago,
          duration: 240 # 0.5 day
        )
      end

      it "returns correct structure" do
        result = subject

        expect(result).to have_key(:timeoff_entries)
        expect(result).to have_key(:employees)
        expect(result).to have_key(:leave_balance)
        expect(result).to have_key(:total_timeoff_entries_duration)
        expect(result).to have_key(:optional_timeoff_entries)
        expect(result).to have_key(:national_timeoff_entries)
      end

      it "includes timeoff entries ordered by leave date" do
        result = subject
        entries = result[:timeoff_entries]

        expect(entries.size).to eq(2)
        expect(entries.first.id).to eq(timeoff_entry1.id)
        expect(entries.last.id).to eq(timeoff_entry2.id)
      end

      it "calculates leave balance correctly" do
        result = subject
        balance = result[:leave_balance]

        expect(balance).to be_an(Array)
        expect(balance.size).to eq(2)

        annual_balance = balance.find { |b| b[:name] == "Annual" }
        expect(annual_balance[:total_days]).to eq(20)
        expect(annual_balance[:used_days]).to eq(1.0)
        expect(annual_balance[:remaining_days]).to eq(19.0)

        sick_balance = balance.find { |b| b[:name] == "Sick" }
        expect(sick_balance[:total_days]).to eq(10)
        expect(sick_balance[:used_days]).to eq(0.5)
        expect(sick_balance[:remaining_days]).to eq(9.5)
      end

      it "includes employees without client role" do
        result = subject

        expect(result[:employees]).to include(current_user)
        expect(result[:employees]).to include(user)
      end
    end

    context "with holiday timeoff entries" do
      let!(:holiday) { create(:holiday, company: company, year: year) }
      let!(:optional_holiday) { create(:holiday_info, holiday: holiday, category: "optional", date: Date.current) }
      let!(:national_holiday) { create(:holiday_info, holiday: holiday, category: "national", date: 1.week.from_now) }

      let!(:optional_entry) do
        create(:timeoff_entry,
          user: user,
          holiday_info: optional_holiday,
          leave_date: Date.current,
          leave_type: nil
        )
      end

      let!(:national_entry) do
        create(:timeoff_entry,
          user: user,
          holiday_info: national_holiday,
          leave_date: 1.week.from_now,
          leave_type: nil
        )
      end

      it "categorizes holiday entries correctly" do
        result = subject

        expect(result[:optional_timeoff_entries].size).to eq(1)
        expect(result[:optional_timeoff_entries].first.id).to eq(optional_entry.id)

        expect(result[:national_timeoff_entries].size).to eq(1)
        expect(result[:national_timeoff_entries].first.id).to eq(national_entry.id)
      end
    end

    context "when user_id is not provided" do
      let(:user_id) { nil }

      let!(:leave) { create(:leave, company: company, year: year) }
      let!(:leave_type) { create(:leave_type, leave: leave, allocation_period: "days", allocation_frequency: "per_month", color: "chart_orange", icon: "cake") }
      let!(:timeoff_entry) do
        create(:timeoff_entry,
          user: current_user,
          leave_type: leave_type,
          leave_date: Date.current
        )
      end

      it "uses current_user instead" do
        result = subject

        expect(result[:timeoff_entries]).to include(timeoff_entry)
      end
    end

    context "with discarded timeoff entries" do
      let!(:leave) { create(:leave, company: company, year: year) }
      let!(:leave_type) { create(:leave_type, leave: leave, allocation_period: "days", allocation_frequency: "per_month", color: "chart_pink", icon: "vacation") }
      let!(:active_entry) { create(:timeoff_entry, user: user, leave_type: leave_type, leave_date: Date.current) }
      let!(:discarded_entry) do
        create(:timeoff_entry,
          user: user,
          leave_type: leave_type,
          leave_date: Date.current,
          discarded_at: Time.current
        )
      end

      it "excludes discarded entries" do
        result = subject

        expect(result[:timeoff_entries].size).to eq(1)
        expect(result[:timeoff_entries].first.id).to eq(active_entry.id)
      end

      it "excludes discarded entries from leave balance calculation" do
        result = subject
        balance = result[:leave_balance]

        leave_balance = balance.find { |b| b[:id] == leave_type.id }
        expect(leave_balance[:used_days]).to eq(active_entry.duration / 480.0)
      end
    end
  end
end
