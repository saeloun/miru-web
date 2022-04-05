# frozen_string_literal: true

require "rails_helper"

RSpec.describe TimesheetEntryPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }
  let(:scope) { Pundit.policy_scope!(user, TimesheetEntry) }

  subject { described_class }

  context "when user is admin" do
    before do
      create(:company_user, company:, user:)
      @timesheet_entry = create(:timesheet_entry, project:)
      user.add_role :admin, company
    end

    permissions :create? do
      it "is permitted to create timesheet entry" do
        expect(subject).to permit(user, TimesheetEntry)
      end
    end

    permissions :update? do
      it "is permitted to update" do
        expect(subject).to permit(user, @timesheet_entry)
      end

      it "is not permitted to update timesheet_entry in different company" do
        client.update(company_id: company2.id)
        expect(subject).not_to permit(user, @timesheet_entry)
      end
    end

    permissions :show? do
      it "is permitted to show" do
        expect(subject).to permit(user, @timesheet_entry)
      end
    end

    permissions :destroy? do
      it "is permitted to destroy" do
        expect(subject).to permit(user, @timesheet_entry)
      end

      it "is not permitted to destroy timesheet_entry in different company" do
        client.update(company_id: company2.id)
        expect(subject).not_to permit(user, @timesheet_entry)
      end
    end

    describe "scope" do
      it "allows current workspace timesheet entries" do
        expect(scope.to_a).to match_array([@timesheet_entry])
      end
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company:, user:)
      @timesheet_entry = create(:timesheet_entry, project:)
      user.add_role :employee, company
    end

    permissions :create? do
      it "is not permitted to create timesheet_entry" do
        expect(subject).to permit(user, TimesheetEntry)
      end
    end

    permissions :update? do
      it "is not permitted to update" do
        expect(subject).not_to permit(user, @timesheet_entry)
      end

      it "is not permitted to update timesheet_entry in different company" do
        client.update(company_id: company2.id)
        expect(subject).not_to permit(user, @timesheet_entry)
      end
    end

    permissions :show? do
      it "is permitted to show" do
        expect(subject).to permit(user, @timesheet_entry)
      end
    end

    permissions :destroy? do
      it "is not permitted to destroy" do
        expect(subject).not_to permit(user, @timesheet_entry)
      end

      it "is not permitted to destroy client in different company" do
        client.update(company_id: company2.id)
        expect(subject).not_to permit(user, @timesheet_entry)
      end
    end
  end
end
