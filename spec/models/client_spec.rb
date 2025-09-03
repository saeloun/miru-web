# frozen_string_literal: true

# == Schema Information
#
# Table name: clients
#
#  id           :bigint           not null, primary key
#  address      :string
#  currency     :string           default("USD"), not null
#  discarded_at :datetime
#  email        :string
#  name         :string           not null
#  phone        :string
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#  company_id   :bigint           not null
#  stripe_id    :string
#
# Indexes
#
#  index_clients_on_company_id            (company_id)
#  index_clients_on_discarded_at          (discarded_at)
#  index_clients_on_email_and_company_id  (email,company_id) UNIQUE
#  index_clients_on_email_trgm            (email) USING gin
#  index_clients_on_name_and_company_id   (name,company_id) UNIQUE
#  index_clients_on_name_trgm             (name) USING gin
#
# Foreign Keys
#
#  fk_rails_...  (company_id => companies.id)
#
require "rails_helper"

RSpec.describe Client, type: :model do
  subject { create(:client) }

  describe "Validations" do
    it { is_expected.to validate_presence_of(:name) }

    it "validates case-insensitive uniqueness of name within the scope of company_id" do
      existing_client = create(:client)
      new_client = build(:client, name: existing_client.name.upcase, company: existing_client.company)
      expect(new_client).not_to be_valid
      expect(new_client.errors[:name]).to include("The client #{existing_client.name.upcase} already exists")
    end

    
    it { is_expected.to validate_length_of(:name).is_at_most(30) }
    it { is_expected.to validate_length_of(:phone).is_at_most(15) }
  end

  describe "Associations" do
    it { is_expected.to have_many(:projects) }
    it { is_expected.to have_many(:timesheet_entries) }
    it { is_expected.to have_many(:addresses).dependent(:destroy) }
    it { is_expected.to belong_to(:company) }
  end

  describe "Public methods" do
    describe "#total_hours_logged" do
      let(:company) { create(:company) }
      let(:user) { create(:user) }
      let(:client) { create(:client, company:) }
      let(:project_1) { create(:project, client:) }
      let(:project_2) { create(:project, client:) }
      let(:results) do
      end

      before do
        create_list(:timesheet_entry, 5, user:, project: project_1)
        create_list(:timesheet_entry, 5, user:, project: project_2)
      end

      context "when time_frame is last week" do
        let(:time_frame) { "last_week" }

        it "returns the total hours logged for a client in the last week" do
          range = 1.week.ago.beginning_of_week..1.week.ago.end_of_week
          result = ([project_1, project_2].map { |project|
            project.timesheet_entries.where(work_date: range).sum(:duration)
          }).sum
          expect(client.total_hours_logged(time_frame)).to eq(result)
        end
      end

      context "when time_frame in a week" do
        let(:time_frame) { "week" }

        it "returns the total hours logged for a client in that week" do
          range = 0.week.ago.beginning_of_week..0.week.ago.end_of_week
          result = ([project_1, project_2].map { |project|
            project.timesheet_entries.where(work_date: range).sum(:duration)
          }).sum
          expect(client.total_hours_logged(time_frame)).to eq(result)
        end
      end

      context "when time_frame in a month" do
        let(:time_frame) { "month" }

        it "returns the total hours logged for a client in that month" do
          range = 0.month.ago.beginning_of_week..0.month.ago.end_of_week
          result = ([project_1, project_2].map { |project|
            project.timesheet_entries.where(work_date: range).sum(:duration)
          }).sum
          expect(client.total_hours_logged(time_frame)).to eq(result)
        end
      end

      context "when time_frame in a year" do
        let(:time_frame) { "year" }

        it "returns the total hours logged for a client in that year" do
          range = 0.year.ago.beginning_of_week..0.year.ago.end_of_week
          result = ([project_1, project_2].map { |project|
            project.timesheet_entries.where(work_date: range).sum(:duration)
          }).sum
          expect(client.total_hours_logged(time_frame)).to eq(result)
        end
      end
    end

    describe "#strip_attributes" do
      let(:company) { create(:company) }
      let(:user) { create(:user) }

      it "strips the whitespaces for the client name" do
        client = build(:client, company:, name: " Client with whitespace ")
        client.save!
        expect(client.name).to eq(client.name.strip)
      end
    end

    describe "#project_details" do
      let(:company) { create(:company) }
      let(:user) { create(:user) }
      let(:client) { create(:client, company:) }
      let(:project_1) { create(:project, client:) }
      let(:project_2) { create(:project, client:) }
      let(:results) do
        range = DateRangeService.new(timeframe: time_frame).process
        [project_1, project_2].map do | project |
          {
            id: project.id, name: project.name, billable: project.billable, team: project.project_member_full_names,
            minutes_spent: project.timesheet_entries.where(work_date: range).sum(:duration)
          }
        end
      end

      before do
        create_list(:timesheet_entry, 5, user:, project: project_1)
        create_list(:timesheet_entry, 5, user:, project: project_2)
      end

      context "when time_frame is last_week" do
        let(:time_frame) { "last_week" }

        it "returns the hours_logged for a project in the last week" do
          expect(client.project_details(time_frame)).to match_array(results)
        end
      end

      context "when time_frame is week" do
        let(:time_frame) { "week" }

        it "returns the hours_logged for a project in that week" do
          expect(client.project_details(time_frame)).to match_array(results)
        end
      end

      context "when time_frame is month" do
        let(:time_frame) { "month" }

        it "returns the hours_logged for a project in that month" do
          expect(client.project_details(time_frame)).to match_array(results)
        end
      end

      context "when time_frame is year" do
        let(:time_frame) { "year" }

        it "returns the hours_logged for a project in that year" do
          expect(client.project_details(time_frame)).to match_array(results)
        end
      end
    end

    describe "#client_overdue_and_outstanding_calculation" do
      let(:company) { create(:company) }
      let(:user) { create(:user) }
      let(:client) { create(:client, company:) }

      before do
        create_list(:invoice, 5, client:)
      end

      it "return outstanding_amount overdue_amount amounts" do
        currency = client.company.base_currency
        client_currency = client.currency
        status_and_amount = client.invoices.group_by(&:status).transform_values { |invoices|
          invoices.sum { |invoice|
            invoice.base_currency_amount.to_f > 0.00 ? invoice.base_currency_amount : invoice.amount
          }
        }
        status_and_amount.default = 0
        outstanding_amount = status_and_amount["sent"] + status_and_amount["viewed"] + status_and_amount["overdue"]
        result = {
          overdue_amount: status_and_amount["overdue"],
          outstanding_amount:,
          currency:,
          client_currency:
        }
        expect(client.client_overdue_and_outstanding_calculation).to match_array(result)
      end
    end

    describe "#register_on_stripe!" do
      let(:company) { create(:company) }
      let(:user) { create(:user) }
      let(:client) { create(:client, company:) }

      context "when associated stripe connected account doesn't exist" do
        it "raises ActiveRecord::RecordNotFound" do
          expect { client.register_on_stripe! }.to raise_error(ActiveRecord::RecordNotFound)
        end
      end

      context "when associated stripe connected account exists" do
        let(:stripe_connected_account) { build(:stripe_connected_account, company:) }

        it "creates customer for the connected account" do
          allow(Stripe::Account).to receive(:create)
            .and_return(OpenStruct.new({ id: stripe_connected_account.account_id }))
          allow(Stripe::Customer).to receive(:create)
            .and_return(OpenStruct.new({ id: 123 }))
          stripe_connected_account.save!
          expect(client.register_on_stripe!).to eq(true)
        end
      end
    end
  end
end
