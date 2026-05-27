# frozen_string_literal: true

require "rails_helper"

RSpec.describe TimesheetEntryPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }
  let(:scope) { Pundit.policy_scope!(user, TimesheetEntry) }
  let!(:timesheet_entry) { create(:timesheet_entry, project:) }

  subject { described_class }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
    end

    permissions :create? do
      it "is permitted to create timesheet entry" do
        expect(subject).to permit(user, TimesheetEntry)
      end
    end

    permissions :update? do
      it "is permitted to update" do
        expect(subject).to permit(user, timesheet_entry)
      end

      it "is permitted to update entries outside the edit window" do
        timesheet_entry.update!(work_date: 31.days.ago.to_date)
        expect(subject).to permit(user, timesheet_entry)
      end

      it "is not permitted to update billed entries" do
        timesheet_entry.update_column(:bill_status, TimesheetEntry.bill_statuses[:billed])
        expect(subject).not_to permit(user, timesheet_entry)
      end

      it "is not permitted to update timesheet_entry in different company" do
        client.update(company_id: company2.id)
        expect(subject).not_to permit(user, timesheet_entry)
      end
    end

    permissions :show?, :index? do
      it "is permitted to show" do
        expect(subject).to permit(user, timesheet_entry)
      end
    end

    permissions :destroy? do
      it "is permitted to destroy" do
        expect(subject).to permit(user, timesheet_entry)
      end

      it "is permitted to destroy entries outside the edit window" do
        timesheet_entry.update!(work_date: 31.days.ago.to_date)
        expect(subject).to permit(user, timesheet_entry)
      end

      it "is not permitted to destroy billed entries" do
        timesheet_entry.update_column(:bill_status, TimesheetEntry.bill_statuses[:billed])
        expect(subject).not_to permit(user, timesheet_entry)
      end

      it "is not permitted to destroy timesheet_entry in different company" do
        client.update(company_id: company2.id)
        expect(subject).not_to permit(user, timesheet_entry)
      end
    end

    describe "scope" do
      it "allows current workspace timesheet entries" do
        expect(scope.to_a).to match_array([timesheet_entry])
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
    end

    permissions :create? do
      it "is permitted to create timesheet_entry" do
        expect(subject).to permit(user, TimesheetEntry)
      end
    end

    permissions :update? do
      context "when entry belongs to same user" do
        let(:timesheet_entry) { create(:timesheet_entry, user:, project:) }

        context "when entry is not billed" do
          it "is permitted to update the entry" do
            expect(subject).to permit(user, timesheet_entry)
          end

          it "is not permitted to update entries outside the edit window" do
            timesheet_entry.update!(work_date: 31.days.ago.to_date)
            expect(subject).not_to permit(user, timesheet_entry)
          end

          it "is permitted to update an entry exactly at the boundary (work_date == cutoff)" do
            # work_date < edit_days.days.ago is strict less-than, so the boundary day is editable
            timesheet_entry.update!(work_date: 30.days.ago.to_date)
            expect(subject).to permit(user, timesheet_entry)
          end

          it "is not permitted when company has a custom edit window and entry exceeds it" do
            company.update!(timesheet_edit_days: 7)
            timesheet_entry.update!(work_date: 8.days.ago.to_date)
            expect(subject).not_to permit(user, timesheet_entry)
          end

          it "is permitted when company has a custom edit window and entry is within it" do
            company.update!(timesheet_edit_days: 7)
            timesheet_entry.update!(work_date: 6.days.ago.to_date)
            expect(subject).to permit(user, timesheet_entry)
          end
        end

        context "when entry is billed" do
          before { timesheet_entry.update(bill_status: :billed) }

          it "is not permitted to update the entry" do
            expect(subject).not_to permit(user, timesheet_entry)
          end
        end
      end

      it "is not permitted to update" do
        expect(subject).not_to permit(user, timesheet_entry)
      end

      it "is not permitted to update timesheet_entry in different company" do
        client.update(company_id: company2.id)
        expect(subject).not_to permit(user, timesheet_entry)
      end
    end

    permissions :show?, :index? do
      it "is permitted to show" do
        expect(subject).to permit(user, timesheet_entry)
      end
    end

    permissions :destroy? do
      it "is not permitted to destroy" do
        expect(subject).not_to permit(user, timesheet_entry)
      end

      it "is not permitted to destroy own entries outside the edit window" do
        timesheet_entry.update!(user:, work_date: 31.days.ago.to_date)
        expect(subject).not_to permit(user, timesheet_entry)
      end

      it "is not permitted to destroy client in different company" do
        client.update(company_id: company2.id)
        expect(subject).not_to permit(user, timesheet_entry)
      end
    end

    describe "scope" do
      it "allows timesheet entries only for the user" do
        timesheet_entry.update!(user:)
        user1 = create(:user, current_workspace_id: company.id)
        timesheet_entry1 = create(:timesheet_entry, project:, user: user1)

        expect(scope.to_a).to match_array([timesheet_entry])
        expect(scope.to_a).not_to include(timesheet_entry1)
      end
    end
  end

  context "when user is an owner" do
    before do
      create(:employment, company:, user:)
      user.add_role :owner, company
    end

    permissions :update?, :destroy? do
      it "permits recent entries" do
        expect(subject).to permit(user, timesheet_entry)
      end

      it "permits entries outside the edit window (owners bypass the window)" do
        timesheet_entry.update!(work_date: 31.days.ago.to_date)
        expect(subject).to permit(user, timesheet_entry)
      end

      it "does not permit billed entries" do
        timesheet_entry.update_column(:bill_status, TimesheetEntry.bill_statuses[:billed])
        expect(subject).not_to permit(user, timesheet_entry)
      end
    end
  end
end
