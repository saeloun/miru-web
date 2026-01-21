# frozen_string_literal: true

require "rails_helper"

RSpec.describe TimeoffEntryPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:leave) { create(:leave, company:) }
  let(:leave_type) { create(
    :leave_type, name: "Annual Leave", color: LeaveType.colors.keys.sample,
    icon: LeaveType.icons.keys.sample, allocation_period: LeaveType.allocation_periods[:months],
    allocation_frequency: LeaveType.allocation_frequencies[:per_year], allocation_value: 10, carry_forward_days: 5,)
}
  let(:timeoff_entry) { create(:timeoff_entry, user:, leave_type:, leave_date: Date.current) }

  subject { described_class }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
    end

    permissions :index?, :create? do
      it "is permitted to access timeoff_entries" do
        expect(subject).to permit(user, timeoff_entry)
      end
    end

    permissions :update?, :destroy? do
      it "is permitted to update or destroy timeoff_entries" do
        expect(subject).to permit(user, timeoff_entry)
      end
    end
  end

  context "when user is an owner" do
    before do
      create(:employment, company:, user:)
      user.add_role :owner, company
    end

    permissions :index?, :create? do
      it "is permitted to access timeoff_entries" do
        expect(subject).to permit(user, timeoff_entry)
      end
    end

    permissions :update?, :destroy? do
      it "is permitted to update or destroy timeoff_entries" do
        expect(subject).to permit(user, timeoff_entry)
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
    end

    context "when leave date is in the current week" do
      it "is permitted to update or destroy timeoff_entries" do
        expect(described_class).to permit(user, timeoff_entry)
      end
    end

    context "when leave date is in the past week" do
      let(:past_timeoff_entry) { create(:timeoff_entry, user:, leave_type:, leave_date: 1.week.ago) }

      it "is not permitted to update or destroy timeoff_entries" do
        expect(subject).not_to permit(user, past_timeoff_entry)
      end
    end

    context "when leave date is in the future" do
      let(:future_timeoff_entry) { create(:timeoff_entry, user:, leave_type:, leave_date: 1.week.from_now) }

      it "is permitted to update or destroy timeoff_entries" do
        expect(subject).to permit(user, future_timeoff_entry)
      end
    end
  end

  context "when user has no role" do
    permissions :index?, :create?, :update?, :destroy? do
      it "is not permitted to access timeoff_entries" do
        expect(subject).not_to permit(user, timeoff_entry)
      end
    end
  end

  context "when leave date is past the week" do
    let(:past_timeoff_entry) { create(:timeoff_entry, user:, leave_type:, leave_date: 1.week.ago) }

    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
    end

    permissions :update?, :destroy? do
      it "is permitted for admin or owner to update or destroy" do
        expect(subject).to permit(user, past_timeoff_entry)
      end
    end
  end
end
