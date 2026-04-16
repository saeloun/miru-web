# frozen_string_literal: true

require "rails_helper"

RSpec.describe TimeoffEntryPolicy, type: :policy do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }
  let(:leave_record) { create(:leave, company:) }
  let(:leave_type) { create(:leave_type, leave: leave_record) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:client_user) { create(:user, current_workspace_id: company.id) }
  let(:record) { create(:timeoff_entry, user: employee, leave_type:) }
  let(:other_workspace_user) { create(:user, current_workspace_id: other_company.id) }

  before do
    owner.add_role :owner, company
    admin.add_role :admin, company
    employee.add_role :employee, company
    client_user.add_role :client, company
    other_workspace_user.add_role :admin, other_company
  end

  permissions :index?, :create? do
    it "permits owner, admin, and employee" do
      expect(described_class).to permit(owner, record)
      expect(described_class).to permit(admin, record)
      expect(described_class).to permit(employee, record)
    end

    it "forbids client" do
      expect(described_class).not_to permit(client_user, record)
    end
  end

  permissions :update?, :destroy? do
    it "permits owner and admin in the same workspace" do
      expect(described_class).to permit(owner, record)
      expect(described_class).to permit(admin, record)
    end

    it "permits employee for their own recent entries" do
      expect(described_class).to permit(employee, record)
    end

    it "forbids employee for entries older than a week" do
      record.update!(leave_date: 8.days.ago.to_date)
      expect(described_class).not_to permit(employee, record)
    end

    it "forbids owner for entries older than a week" do
      record.update!(leave_date: 8.days.ago.to_date)
      expect(described_class).not_to permit(owner, record)
      expect(described_class).to permit(admin, record)
    end

    it "forbids employee from editing another employee entry" do
      another_employee = create(:user, current_workspace_id: company.id)
      another_employee.add_role :employee, company
      expect(described_class).not_to permit(another_employee, record)
    end

    it "forbids client and other workspace users" do
      expect(described_class).not_to permit(client_user, record)
      expect(described_class).not_to permit(other_workspace_user, record)
    end
  end
end
