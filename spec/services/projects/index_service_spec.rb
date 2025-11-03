# frozen_string_literal: true

require "rails_helper"

RSpec.describe Projects::IndexService do
  let(:company) { create(:company) }
  let(:admin_user) { create(:user, current_workspace_id: company.id) }
  let(:owner_user) { create(:user, current_workspace_id: company.id) }
  let(:bookkeeper_user) { create(:user, current_workspace_id: company.id) }
  let(:employee_user) { create(:user, current_workspace_id: company.id) }

  let(:client_1) { create(:client, company:) }
  let(:client_2) { create(:client, company:) }

  let!(:project_1) { create(:project, client: client_1) }
  let!(:project_2) { create(:project, client: client_2) }
  let(:project_3) { create(:project, client: client_1) }

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

  describe "#project_ids" do
    context "when user is an admin" do
      it "does not filter by project_ids in fetch_projects" do
        service = described_class.new(company, admin_user, nil)

        # Mock the search to verify the where conditions
        allow(Project).to receive(:search).and_call_original

        service.process

        # Verify that the where conditions don't include :id filter for admins
        expect(Project).to have_received(:search) do |_query, options|
          expect(options[:where]).not_to have_key(:id)
        end
      end
    end

    context "when user is an owner" do
      it "does not filter by project_ids in fetch_projects" do
        service = described_class.new(company, owner_user, nil)

        allow(Project).to receive(:search).and_call_original

        service.process

        expect(Project).to have_received(:search) do |_query, options|
          expect(options[:where]).not_to have_key(:id)
        end
      end
    end

    context "when user is a bookkeeper" do
      it "does not filter by project_ids in fetch_projects" do
        service = described_class.new(company, bookkeeper_user, nil)

        allow(Project).to receive(:search).and_call_original

        service.process

        expect(Project).to have_received(:search) do |_query, options|
          expect(options[:where]).not_to have_key(:id)
        end
      end
    end

    context "when user is an employee" do
      context "with no project assignments" do
        it "returns empty array" do
          service = described_class.new(company, employee_user, nil)

          expect(service.send(:project_ids)).to eq([])
        end
      end

      context "with active project assignments" do
        before do
          create(:project_member, user: employee_user, project: project_1)
          create(:project_member, user: employee_user, project: project_2)
        end

        it "returns only assigned project ids" do
          service = described_class.new(company, employee_user, nil)

          expect(service.send(:project_ids)).to match_array([project_1.id, project_2.id])
        end
      end

      context "with soft-deleted project assignments" do
        before do
          pm1 = create(:project_member, user: employee_user, project: project_1)
          create(:project_member, user: employee_user, project: project_2)
          pm1.discard # Soft delete
        end

        it "returns only active project ids" do
          service = described_class.new(company, employee_user, nil)

          expect(service.send(:project_ids)).to eq([project_2.id])
        end
      end

      context "with project assignments from different companies (cross-tenant)" do
        let(:other_company) { create(:company) }
        let(:other_client) { create(:client, company: other_company) }
        let(:other_project) { create(:project, client: other_client) }

        before do
          create(:project_member, user: employee_user, project: project_1)
          create(:project_member, user: employee_user, project: other_project)
        end

        it "returns only project ids from current company" do
          service = described_class.new(company, employee_user, nil)

          project_ids = service.send(:project_ids)
          expect(project_ids).to include(project_1.id)
          expect(project_ids).not_to include(other_project.id)
        end

        it "does not leak projects from other companies" do
          service = described_class.new(company, employee_user, nil)

          project_ids = service.send(:project_ids)
          projects = Project.where(id: project_ids)
          expect(projects.joins(:client).pluck("clients.company_id")).to all(eq(company.id))
        end
      end
    end
  end

  describe "#user_can_see_all_projects?" do
    it "returns true for admin users" do
      service = described_class.new(company, admin_user, nil)

      expect(service.send(:user_can_see_all_projects?)).to be true
    end

    it "returns true for owner users" do
      service = described_class.new(company, owner_user, nil)

      expect(service.send(:user_can_see_all_projects?)).to be true
    end

    it "returns true for bookkeeper users" do
      service = described_class.new(company, bookkeeper_user, nil)

      expect(service.send(:user_can_see_all_projects?)).to be true
    end

    it "returns false for employee users" do
      service = described_class.new(company, employee_user, nil)

      expect(service.send(:user_can_see_all_projects?)).to be false
    end
  end

  describe "#client_list" do
    context "when user can see all projects (admin/owner/bookkeeper)" do
      it "returns all company clients for admin" do
        service = described_class.new(company, admin_user, nil)

        expect(service.send(:client_list)).to match_array([client_1, client_2])
      end

      it "returns all company clients for owner" do
        service = described_class.new(company, owner_user, nil)

        expect(service.send(:client_list)).to match_array([client_1, client_2])
      end

      it "returns all company clients for bookkeeper" do
        service = described_class.new(company, bookkeeper_user, nil)

        expect(service.send(:client_list)).to match_array([client_1, client_2])
      end
    end

    context "when user is an employee" do
      context "with no project assignments" do
        it "returns empty array" do
          service = described_class.new(company, employee_user, nil)

          expect(service.send(:client_list)).to eq([])
        end
      end

      context "with active project assignments" do
        before do
          create(:project_member, user: employee_user, project: project_1)
          create(:project_member, user: employee_user, project: project_2)
        end

        it "returns only clients from assigned projects" do
          service = described_class.new(company, employee_user, nil)

          expect(service.send(:client_list)).to match_array([client_1, client_2])
        end
      end

      context "with project assignments to only one client" do
        before do
          create(:project_member, user: employee_user, project: project_1)
        end

        it "returns only that client" do
          service = described_class.new(company, employee_user, nil)

          expect(service.send(:client_list)).to eq([client_1])
        end
      end

      context "with multiple projects from the same client" do
        before do
          create(:project_member, user: employee_user, project: project_1)
          create(:project_member, user: employee_user, project: project_3)
        end

        it "returns distinct clients (no duplicates)" do
          service = described_class.new(company, employee_user, nil)

          expect(service.send(:client_list)).to eq([client_1])
        end
      end

      context "with soft-deleted project assignments" do
        before do
          pm1 = create(:project_member, user: employee_user, project: project_1)
          create(:project_member, user: employee_user, project: project_2)
          pm1.discard # Soft delete
        end

        it "returns only clients from active project assignments" do
          service = described_class.new(company, employee_user, nil)

          expect(service.send(:client_list)).to eq([client_2])
        end
      end

      context "with all project assignments soft-deleted" do
        before do
          pm1 = create(:project_member, user: employee_user, project: project_1)
          pm2 = create(:project_member, user: employee_user, project: project_2)
          pm1.discard
          pm2.discard
        end

        it "returns empty array" do
          service = described_class.new(company, employee_user, nil)

          expect(service.send(:client_list)).to eq([])
        end
      end
    end
  end

  describe "#client_ids" do
    it "returns all company client ids" do
      service = described_class.new(company, admin_user, nil)

      expect(service.send(:client_ids)).to match_array([client_1.id, client_2.id])
    end
  end
end
