# frozen_string_literal: true

require "rails_helper"

RSpec.describe Clients::IndexService do
  let(:company) { create(:company) }
  let(:admin_user) { create(:user, current_workspace_id: company.id) }
  let(:owner_user) { create(:user, current_workspace_id: company.id) }
  let(:bookkeeper_user) { create(:user, current_workspace_id: company.id) }
  let(:employee_user) { create(:user, current_workspace_id: company.id) }

  let(:client_1) { create(:client, company:) }
  let(:client_2) { create(:client, company:) }
  let(:client_3) { create(:client, company:) }

  let!(:project_1) { create(:project, client: client_1) }
  let!(:project_2) { create(:project, client: client_2) }
  let(:project_3) { create(:project, client: client_3) }

  before do
    create(:employment, company:, user: admin_user)
    create(:employment, company:, user: owner_user)
    create(:employment, company:, user: bookkeeper_user)
    create(:employment, company:, user: employee_user)

    admin_user.add_role :admin, company
    owner_user.add_role :owner, company
    bookkeeper_user.add_role :bookkeeper, company
    employee_user.add_role :employee, company
  end

  describe "#user_can_see_all_clients?" do
    it "returns true for admin users" do
      service = described_class.new(company, admin_user, nil, nil)

      expect(service.send(:user_can_see_all_clients?)).to be true
    end

    it "returns true for owner users" do
      service = described_class.new(company, owner_user, nil, nil)

      expect(service.send(:user_can_see_all_clients?)).to be true
    end

    it "returns true for bookkeeper users" do
      service = described_class.new(company, bookkeeper_user, nil, nil)

      expect(service.send(:user_can_see_all_clients?)).to be true
    end

    it "returns false for employee users" do
      service = described_class.new(company, employee_user, nil, nil)

      expect(service.send(:user_can_see_all_clients?)).to be false
    end
  end

  describe "#user_assigned_clients" do
    context "when employee has no project assignments" do
      it "returns empty relation" do
        service = described_class.new(company, employee_user, nil, nil)

        expect(service.send(:user_assigned_clients)).to be_empty
      end
    end

    context "when employee has active project assignments" do
      before do
        create(:project_member, user: employee_user, project: project_1)
        create(:project_member, user: employee_user, project: project_2)
      end

      it "returns only clients from assigned projects" do
        service = described_class.new(company, employee_user, nil, nil)

        expect(service.send(:user_assigned_clients)).to match_array([client_1, client_2])
      end

      it "does not return clients from unassigned projects" do
        service = described_class.new(company, employee_user, nil, nil)

        expect(service.send(:user_assigned_clients)).not_to include(client_3)
      end
    end

    context "when employee has soft-deleted project assignments" do
      before do
        pm1 = create(:project_member, user: employee_user, project: project_1)
        create(:project_member, user: employee_user, project: project_2)
        pm1.discard # Soft delete
      end

      it "returns only clients from active project assignments" do
        service = described_class.new(company, employee_user, nil, nil)

        expect(service.send(:user_assigned_clients)).to eq([client_2])
      end

      it "does not return clients from soft-deleted project assignments" do
        service = described_class.new(company, employee_user, nil, nil)

        expect(service.send(:user_assigned_clients)).not_to include(client_1)
      end
    end

    context "when employee is assigned to multiple projects of same client" do
      before do
        project_4 = create(:project, client: client_1)
        create(:project_member, user: employee_user, project: project_1)
        create(:project_member, user: employee_user, project: project_4)
      end

      it "returns client only once (distinct)" do
        service = described_class.new(company, employee_user, nil, nil)

        clients = service.send(:user_assigned_clients)
        expect(clients.count).to eq(1)
        expect(clients.first).to eq(client_1)
      end
    end

    context "when employee is assigned to projects from different companies (cross-tenant)" do
      let(:other_company) { create(:company) }
      let(:other_client) { create(:client, company: other_company) }
      let(:other_project) { create(:project, client: other_client) }

      before do
        create(:project_member, user: employee_user, project: project_1)
        create(:project_member, user: employee_user, project: other_project)
      end

      it "returns only clients from current company" do
        service = described_class.new(company, employee_user, nil, nil)

        clients = service.send(:user_assigned_clients)
        expect(clients).to include(client_1)
        expect(clients).not_to include(other_client)
      end

      it "does not leak clients from other companies" do
        service = described_class.new(company, employee_user, nil, nil)

        expect(service.send(:user_assigned_clients).pluck(:company_id)).to all(eq(company.id))
      end
    end
  end

  describe "#clients_list" do
    context "when user is admin" do
      it "returns all company clients" do
        service = described_class.new(company, admin_user, nil, nil)

        # We need to stub the includes to test the base query
        allow_any_instance_of(ActiveRecord::Relation).to receive(:includes).and_return(company.clients)

        clients = service.send(:clients_list)
        expect(clients).to match_array([client_1, client_2, client_3])
      end
    end

    context "when user is employee with assignments" do
      before do
        create(:project_member, user: employee_user, project: project_1)
      end

      it "returns only assigned clients" do
        service = described_class.new(company, employee_user, nil, nil)

        # Stub includes to return the base query result
        allow_any_instance_of(ActiveRecord::Relation).to receive(:includes) { |relation| relation }

        clients = service.send(:clients_list)
        expect(clients).to include(client_1)
        expect(clients).not_to include(client_2, client_3)
      end
    end
  end

  describe "#process" do
    let(:time_frame) { "week" }

    context "when user is admin" do
      before do
        create_list(:timesheet_entry, 3, user: admin_user, project: project_1)
      end

      it "returns data for all company clients" do
        service = described_class.new(company, admin_user, nil, time_frame)
        result = service.process

        expect(result).to have_key(:client_details)
        expect(result).to have_key(:total_minutes)
        expect(result).to have_key(:overdue_outstanding_amount)
      end
    end

    context "when user is employee with no assignments" do
      it "returns empty client details" do
        service = described_class.new(company, employee_user, nil, time_frame)
        result = service.process

        expect(result[:client_details]).to be_empty
        expect(result[:total_minutes]).to eq(0)
      end
    end
  end
end
