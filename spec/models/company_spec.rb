# frozen_string_literal: true

require "rails_helper"

RSpec.describe Company, type: :model do
  subject { create(:company) }

  describe "Associations" do
    it { is_expected.to have_many(:users).through(:employments) }
    it { is_expected.to have_many(:employments).dependent(:destroy) }
    it { is_expected.to have_many(:clients).dependent(:destroy) }
    it { is_expected.to have_many(:projects).through(:clients).dependent(:destroy) }
    it { is_expected.to have_one_attached(:logo) }
    it { is_expected.to have_many(:current_workspace_users).dependent(:nullify) }
    it { is_expected.to have_many(:addresses).dependent(:destroy) }
    it { is_expected.to have_many(:devices).dependent(:destroy) }
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
    let(:company) { create(:company) }
    let(:user_1) { create(:user) }
    let(:user_2) { create(:user) }
    let(:client_1) { create(:client, company:) }
    let(:client_2) { create(:client, company:) }
    let(:project_1) { create(:project, client: client_1) }
    let(:project_2) { create(:project, client: client_2) }
    let(:params) do
      {
        client_id: nil,
        user_id: nil,
        billable: nil,
        search: nil
      }
    end
    let(:result) do
      [
        {
          clientName: client_1.name, id: project_1.id, isBillable: project_1.billable,
          minutesSpent: project_1.timesheet_entries.sum(:duration), name: project_1.name,
          client_logo: ""
        },
        {
          clientName: client_2.name, id: project_2.id, isBillable: project_2.billable,
          minutesSpent: project_2.timesheet_entries.sum(:duration), name: project_2.name,
          client_logo: ""
        }
      ]
    end

    before do
      create(:employment, company_id: company.id, user_id: user_1.id)
      create(:employment, company_id: company.id, user_id: user_2.id)
      create(:project_member, user_id: user_1.id, project_id: project_1.id)
      create(:project_member, user_id: user_1.id, project_id: project_2.id)
      create(:project_member, user_id: user_2.id, project_id: project_1.id)
      create(:project_member, user_id: user_2.id, project_id: project_2.id)
      create_list(:timesheet_entry, 5, user: user_1, project: project_1)
      create_list(:timesheet_entry, 5, user: user_1, project: project_2)
      create_list(:timesheet_entry, 5, user: user_2, project: project_1)
      create_list(:timesheet_entry, 5, user: user_2, project: project_2)
    end

    describe "#client_details" do
      subject { company.client_details(time_frame) }

      let(:result) do
        [
          {
            id: client_1.id,
            name: client_1.name,
            email: client_1.email,
            phone: client_1.phone,
            address: client_1.address,
            minutes_spent: client_1.total_hours_logged(time_frame)
          },
          {
            id: client_2.id,
            name: client_2.name,
            email: client_2.email,
            phone: client_2.phone,
            address: client_2.address,
            minutes_spent: client_2.total_hours_logged(time_frame)
          }
        ]
      end

      context "when time_frame is last_week" do
        let(:time_frame) { "last_week" }

        it "returns the total hours logged for all the clients of a Company in the last_week" do
          expect(subject).to match_array(result)
        end
      end

      context "when time_frame is week" do
        let(:time_frame) { "week" }

        it "returns the total hours logged for all the clients of a Company in that week" do
          expect(subject).to match_array(result)
        end
      end

      context "when time_frame is month" do
        let(:time_frame) { "month" }

        it "returns the total hours logged for all the clients of a Company in that week" do
          expect(subject).to match_array(result)
        end
      end

      context "when time_frame is year" do
        let(:time_frame) { "year" }

        it "returns the total hours logged for all the clients of a Company in that week" do
          expect(subject).to match_array(result)
        end
      end
    end

    describe "#client_list" do
      it "returns list of all the clients of a company" do
        expect(company.client_list).to match_array [
          a_hash_including(id: client_1.id),
          a_hash_including(id: client_2.id)
        ]
      end
    end

    describe "#user_details" do
      it "return list of all users of a company" do
        expect(company.user_details).to match_array [
          a_hash_including(id: user_1.id, name: user_1.full_name),
          a_hash_including(id: user_2.id, name: user_2.full_name),
        ]
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
      subject { company.project_list(*params.values) }

      context "when no filters or search are applied" do
        it "returns list of all projects" do
          expect(subject).to match_array(result)
        end
      end

      context "when Search with project name" do
        before { params[:search] = project_1.name }

        it "returns projects with names matching search" do
          expect(subject).to match_array(result)
        end
      end

      context "when Search with client name" do
        before { params[:search] = client_1.name }

        let(:result) do
          [{
            clientName: client_1.name, id: project_1.id, isBillable: project_1.billable,
            minutesSpent: project_1.timesheet_entries.sum(:duration), name: project_1.name
          }]
        end

        it "returns projects with clients_name matching search" do
          expect(subject).to match_array(result)
        end
      end

      context "when billable filter is applied" do
        before { params[:billable] = false }

        it "returns projects which are non billable" do
          expect(subject).to match_array(result)
        end
      end

      context "when team member filter is applied" do
        before { params[:user_id] = user_1.id }

        it "returns projects which have user_1 as it's team member" do
          expect(subject).to match_array(result)
        end
      end

      context "when client filter is applied" do
        before { params[:client_id] = [client_1.id] }

        let(:result) do
          [{
            clientName: client_1.name, id: project_1.id, isBillable: project_1.billable,
            minutesSpent: project_1.timesheet_entries.sum(:duration), name: project_1.name
          }]
        end

        it "returns projects which belongs to client_1" do
          expect(subject).to match_array(result)
        end
      end

      context "when all filters and search both are applied" do
        let(:params) do
          {
            client_id: [client_2.id],
            user_id: [user_1.id],
            billable: nil,
            serach: project_2.name
          }
        end
        let(:result) do
          [{
            clientName: client_2.name, id: project_2.id, isBillable: project_2.billable,
            minutesSpent: project_2.timesheet_entries.sum(:duration), name: project_2.name
          }]
        end

        it "returns projects as per filters and search" do
          expect(subject).to match_array(result)
        end
      end
    end

    describe "#project_list_query" do
      subject { company.project_list_query(params[:client_id], params[:user_id], params[:billable]) }

      let(:result) { [project_1, project_1, project_2, project_2] }

      context "when no arguments are passed" do
        it "returns list of all projects" do
          expect(subject).to match_array(result)
        end
      end

      context "when client_id argument is passed" do
        before { params[:client_id] = [client_1.id] }

        let(:result) { [project_1, project_1] }

        it "returns projects which belongs to client_1" do
          expect(subject).to match_array(result)
        end
      end

      context "when user_id argument is passed" do
        before { params[:user_id] = [user_1.id] }

        let(:result) { [project_1, project_2] }

        it "returns projects which have user_1 as team member" do
          expect(subject).to match_array(result)
        end
      end

      context "when billable argument is passed" do
        before { params[:billable] = [true] }

        it "returns projects which are billable" do
          expect(subject).to match_array([])
        end
      end

      context "when all argument are passed" do
        let(:params) do
          {
            client_id: [client_2.id],
            user_id: [user_1.id],
            billable: [false]
          }
        end

        it "returns projects as per db_query where condition" do
          expect(subject).to match_array([project_2])
        end
      end
    end
  end
end
