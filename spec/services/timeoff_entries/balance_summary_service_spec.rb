# frozen_string_literal: true

require "rails_helper"

RSpec.describe TimeoffEntries::BalanceSummaryService do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:year) { Date.current.year }
  let!(:leave) { create(:leave, company:, year:) }
  let!(:leave_type) do
    create(:leave_type,
      leave:,
      name: "Annual",
      allocation_value: 20,
      allocation_period: :days,
      allocation_frequency: :per_year,
      color: :chart_blue,
      icon: :vacation)
  end
  let!(:timeoff_entry) do
    create(:timeoff_entry,
      user:,
      leave_type:,
      leave_date: Date.current,
      duration: 240)
  end

  before do
    create(:employment, company:, user:, joined_at: Date.current - 1.year, resigned_at: nil)
    user.add_role :admin, company
  end

  it "returns leave and holiday balance payloads" do
    result = described_class.process(
      current_user: user,
      current_company: company,
      user_id: user.id,
      year:
    )

    expect(result).to include(:leave_balance, :optional_timeoff_entries, :national_timeoff_entries)
    expect(result[:leave_balance].first).to include(
      id: leave_type.id,
      name: leave_type.name,
      type: "leave",
      timeoff_entries_duration: timeoff_entry.duration
    )
  end
end
