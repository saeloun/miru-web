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
    it "returns all company clients" do
      service = described_class.new(company, admin_user, nil)

      expect(service.send(:client_list)).to match_array([client_1, client_2])
    end
  end

  describe "#client_ids" do
    it "returns all company client ids" do
      service = described_class.new(company, admin_user, nil)

      expect(service.send(:client_ids)).to match_array([client_1.id, client_2.id])
    end
  end
end
