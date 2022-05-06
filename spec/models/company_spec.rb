# frozen_string_literal: true

require "rails_helper"

RSpec.describe Company, type: :model do
  subject { create(:company) }

  describe "Associations" do
    it { is_expected.to have_many(:users).through(:company_users) }
    it { is_expected.to have_many(:company_users).dependent(:destroy) }
    it { is_expected.to have_many(:clients).dependent(:destroy) }
    it { is_expected.to have_many(:projects).through(:clients).dependent(:destroy) }
    it { is_expected.to have_one_attached(:logo) }
    it { is_expected.to have_many(:current_workspace_users).dependent(:nullify) }
  end

  describe "Validations" do
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:business_phone) }
    it { is_expected.to validate_presence_of(:standard_price) }
    it { is_expected.to validate_presence_of(:country) }
    it { is_expected.to validate_presence_of(:base_currency) }

    it do
      expect(subject).to validate_numericality_of(:standard_price).is_greater_than_or_equal_to(0)
    end
  end

  describe "Public methods" do
    describe "#client_details" do
      let(:company) { create(:company) }
      let(:user) { create(:user) }
      let(:client_1) { create(:client, company:) }
      let(:client_2) { create(:client, company:) }
      let(:project_1) { create(:project, client: client_1) }
      let(:project_2) { create(:project, client: client_2) }

      before do
        create_list(:timesheet_entry, 5, user:, project: project_1)
        create_list(:timesheet_entry, 5, user:, project: project_2)
      end

      context "when time_frame is last_week" do
        let(:time_frame) { "last_week" }

        it "returns the total hours logged for all the clients of a Company in the last_week" do
          result = [client_1, client_2].map do |client|
            {
              id: client.id, name: client.name, email: client.email, phone: client.phone, address: client.address,
              minutes_spent: client.total_hours_logged(time_frame)
            }
          end
          client_details = company.client_details(time_frame)
          expect(client_details).to include(result[0])
          expect(client_details).to include(result[1])
        end
      end

      context "when time_frame is week" do
        let(:time_frame) { "week" }

        it "returns the total hours logged for all the clients of a Company in that week" do
          result = [client_1, client_2].map do |client|
            {
              id: client.id,
              name: client.name, email: client.email,
              phone: client.phone, address: client.address, minutes_spent: client.total_hours_logged(time_frame)
            }
          end
          client_details = company.client_details(time_frame)
          expect(client_details).to include(result[0])
          expect(client_details).to include(result[1])
        end
      end

      context "when time_frame is month" do
        let(:time_frame) { "month" }

        it "returns the total hours logged for all the clients of a Company in that week" do
          result = [client_1, client_2].map do |client|
            {
              id: client.id, name: client.name, email: client.email, phone: client.phone, address: client.address,
              minutes_spent: client.total_hours_logged(time_frame)
            }
          end
          client_details = company.client_details(time_frame)
          expect(client_details).to include(result[0])
          expect(client_details).to include(result[1])
        end
      end

      context "when time_frame is year" do
        let(:time_frame) { "year" }

        it "returns the total hours logged for all the clients of a Company in that week" do
          result = [client_1, client_2].map do |client|
            {
              id: client.id, name: client.name, email: client.email, phone: client.phone, address: client.address,
              minutes_spent: client.total_hours_logged(time_frame)
            }
          end
          client_details = company.client_details(time_frame)
          expect(client_details).to include(result[0])
          expect(client_details).to include(result[1])
        end
      end
    end

    describe "#client_list" do
      let(:company) { create(:company) }
      let(:user) { create(:user) }
      let(:client) { create(:client, company:) }

      it "returns list of all the clients of a company" do
        result = [{
          id: client.id, name: client.name, email: client.email, phone: client.phone,
          address: client.address
        }]
        expect(company.client_list).to eq(result)
      end
    end

    describe "#user_details" do
      let(:company) { create(:company) }
      let(:user1) { create(:user) }
      let(:user2) { create(:user) }

      before do
        create(:company_user, company_id: company.id, user_id: user1.id)
        create(:company_user, company_id: company.id, user_id: user2.id)
      end

      it "return list of all users of a company" do
        result = [ { id: user1.id, name: user1.full_name }, { id: user2.id, name: user2.full_name }]
        expect(company.user_details).to match_array(result)
      end
    end

    describe "#overdue_and_outstanding_and_draft_amount" do
      let(:company) do
        create(:company, clients: create_list(:client_with_invoices, 5))
      end
      let(:user) { create(:user, current_workspace_id: company.id) }

      it "return invoice amounts" do
        status_and_amount = company.invoices.group(:status).sum(:amount)
        currency = company.base_currency
        status_and_amount.default = 0
        outstanding_amount = status_and_amount["sent"] + status_and_amount["viewed"]
        + status_and_amount["overdue"]
        result = {
          overdue_amount: status_and_amount["overdue"],
          outstanding_amount:,
          draft_amount: status_and_amount["draft"],
          currency:
        }
        expect(company.overdue_and_outstanding_and_draft_amount).to match_array(result)
      end
    end

    describe "#project_list" do
      let(:company) { create(:company) }
      let(:user_1) { create(:user) }
      let(:user_2) { create(:user) }
      let(:client_1) { create(:client, company:) }
      let(:client_2) { create(:client, company:) }
      let(:project_1) { create(:project, client: client_1) }
      let(:project_2) { create(:project, client: client_2) }

      before do
        create(:company_user, company_id: company.id, user_id: user_1.id)
        create(:company_user, company_id: company.id, user_id: user_2.id)
        create(:project_member, user_id: user_1.id, project_id: project_1.id)
        create(:project_member, user_id: user_1.id, project_id: project_2.id)
        create(:project_member, user_id: user_2.id, project_id: project_1.id)
        create(:project_member, user_id: user_2.id, project_id: project_2.id)
        create_list(:timesheet_entry, 5, user: user_1, project: project_1)
        create_list(:timesheet_entry, 5, user: user_1, project: project_2)
        create_list(:timesheet_entry, 5, user: user_2, project: project_1)
        create_list(:timesheet_entry, 5, user: user_2, project: project_2)
      end

      def project_detail_list(client_id = nil, user_id = nil, billable = nil, search)
        project_list = company.project_list_query(client_id, user_id, billable)
        minutes_spent = company.timesheet_entries.group(:project_id).sum(:duration)
        query = project_list.ransack({ name_or_client_name_or_is_billable_cont: search })
        project_list = query.result
        project_ids = project_list.map { |project| project.id }.uniq
        project_ids.map do |id|
          billable_array = []
          project_name_array = []
          client_name_array = []
          project_list.each do |project|
            if id == project.id
              billable_array.push(project.is_billable)
              client_name_array.push(project.client_name)
              project_name_array.push(project.project_name)
            end
          end
          {
            id:,
            name: project_name_array[0],
            clientName: client_name_array[0],
            isBillable: billable_array[0],
            minutesSpent: minutes_spent[id]
          }
        end
      end

      context "when no filters or search are applied" do
        it "returns list of all projects" do
          user_id, client_id, billable, search = nil
          result = project_detail_list(client_id, user_id, billable, search)
          project_details = company.project_list(client_id, user_id, billable, search)
          expect(project_details).to match_array(result)
        end
      end

      context "when Search with project name" do
        it "returns projects with names matching search" do
          user_id, client_id, billable = nil, search = project_1.name
          result = project_detail_list(client_id, user_id, billable, search)
          project_details = company.project_list(client_id, user_id, billable, search)
          expect(project_details).to match_array(result)
        end
      end

      context "when Search with client name" do
        it "returns projects with clients_name matching search" do
          user_id, client_id, billable = nil, search = client_1.name
          result = project_detail_list(client_id, user_id, billable, search)
          project_details = company.project_list(client_id, user_id, billable, search)
          expect(project_details).to match_array(result)
        end
      end

      context "when billable filter is applied" do
        it "returns projects which are non billable" do
          client_id, search, user_id = nil, billable = false
          result = project_detail_list(client_id, user_id, billable, search)
          project_details = company.project_list(client_id, user_id, billable, search)
          expect(project_details).to match_array(result)
        end
      end

      context "when team member filter is applied" do
        it "returns projects which have user_1 as it's team member" do
          client_id, search, billable = nil, user_id = [user_1.id]
          result = project_detail_list(client_id, user_id, billable, search)
          project_details = company.project_list(client_id, user_id, billable, search)
          expect(project_details).to match_array(result)
        end
      end

      context "when client filter is applied" do
        it "returns projects which belongs to client_1" do
          search, billable, user_id = nil, client_id = [client_1.id]
          result = project_detail_list(client_id, user_id, billable, search)
          project_details = company.project_list(client_id, user_id, billable, search)
          expect(project_details).to match_array(result)
        end
      end

      context "when all filters and search both are applied" do
        it "returns projects as per filters and search" do
          search = project_2.name, billable = false, user_id = [user_1.id], client_id = [client_2.id]
          result = project_detail_list(client_id, user_id, billable, search)
          project_details = company.project_list(client_id, user_id, billable, search)
          expect(project_details).to match_array(result)
        end
      end
    end

    describe "#project_list_query" do
      let(:company) { create(:company) }
      let(:user_1) { create(:user) }
      let(:user_2) { create(:user) }
      let(:client_1) { create(:client, company:) }
      let(:client_2) { create(:client, company:) }
      let(:project_1) { create(:project, client: client_1) }
      let(:project_2) { create(:project, client: client_2) }

      before do
        create(:company_user, company_id: company.id, user_id: user_1.id)
        create(:company_user, company_id: company.id, user_id: user_2.id)
        create(:project_member, user_id: user_1.id, project_id: project_1.id)
        create(:project_member, user_id: user_1.id, project_id: project_2.id)
        create(:project_member, user_id: user_2.id, project_id: project_1.id)
        create(:project_member, user_id: user_2.id, project_id: project_2.id)
        create_list(:timesheet_entry, 5, user: user_1, project: project_1)
        create_list(:timesheet_entry, 5, user: user_1, project: project_2)
        create_list(:timesheet_entry, 5, user: user_2, project: project_1)
        create_list(:timesheet_entry, 5, user: user_2, project: project_2)
      end

      def project_detail_list_query(client_id, user_id, billable)
        db_query = company.projects.kept.left_outer_joins(:project_members).joins(:client)
        db_query = db_query.where(project_members: { user_id: }) if user_id.present?
        db_query = db_query.where(client_id:) if client_id.present?
        db_query = db_query.where(projects: { billable: }) if billable.present?
        db_query.select(
          "projects.id as id,
             projects.name as project_name,
             projects.billable as is_billable,
             clients.name as client_name")
      end

      context "when no arguments are passed" do
        it "returns list of all projects" do
          user_id, client_id, billable = nil
          result = project_detail_list_query(client_id, user_id, billable)
          project_details = company.project_list_query(client_id, user_id, billable)
          expect(project_details).to match_array(result)
        end
      end

      context "when client_id argument is passed" do
        it "returns projects which belongs to client_1" do
          billable, user_id = nil, client_id = [client_1.id]
          result = project_detail_list_query(client_id, user_id, billable)
          project_details = company.project_list_query(client_id, user_id, billable)
          expect(project_details).to match_array(result)
        end
      end

      context "when user_id argument is passed" do
        it "returns projects which have user_1 as team member" do
          billable, client_id = nil, user_id = [user_1.id]
          result = project_detail_list_query(client_id, user_id, billable)
          project_details = company.project_list_query(client_id, user_id, billable)
          expect(project_details).to match_array(result)
        end
      end

      context "when billable argument is passed" do
        it "returns projects which are billable" do
          user_id, client_id = nil, billable = true
          result = project_detail_list_query(client_id, user_id, billable)
          project_details = company.project_list_query(client_id, user_id, billable)
          expect(project_details).to match_array(result)
        end
      end

      context "when all argument are passed" do
        it "returns projects as per db_query where condition" do
          billable = false, user_id = [user_1.id], client_id = [client_2.id]
          result = project_detail_list_query(client_id, user_id, billable)
          project_details = company.project_list_query(client_id, user_id, billable)
          expect(project_details).to match_array(result)
        end
      end
    end
  end
end
