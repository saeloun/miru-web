# frozen_string_literal: true

require "rails_helper"

RSpec.describe GenerateInvoicePolicy, type: :policy do
  let(:company) { create(:company) }
  let(:company2) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }
  let(:timesheet_entry) { create(:timesheet_entry, project:) }

  subject { described_class }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
    end

    permissions :index? do
      it "is permitted to view details" do
        expect(subject).to permit(user, client)
      end
    end
  end

  context "when user is an owner" do
    before do
      create(:employment, company:, user:)
      user.add_role :owner, company
    end

    permissions :index? do
      it "is permitted to view details" do
        expect(subject).to permit(user, client)
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
    end

    permissions :index? do
      it "is not permitted to view details" do
        expect(subject).not_to permit(user, client)
      end
    end
  end
end
