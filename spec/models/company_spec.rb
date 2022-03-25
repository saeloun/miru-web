# frozen_string_literal: true

require "rails_helper"

RSpec.describe Company, type: :model do
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
              id: client.id, name: client.name, email: client.email,
              minutes_spent: client.total_hours_logged(time_frame)
            }
          end
          expect(company.client_details(time_frame)).to eq(result)
        end
      end

      context "when time_frame is week" do
        let(:time_frame) { "week" }

        it "returns the total hours logged for all the clients of a Company in that week" do
          result = [client_1, client_2].map do |client|
            {
              id: client.id,
              name: client.name, email: client.email, minutes_spent: client.total_hours_logged(time_frame)
            }
          end
          expect(company.client_details(time_frame)).to eq(result)
        end
      end

      context "when time_frame is month" do
        let(:time_frame) { "month" }

        it "returns the total hours logged for all the clients of a Company in that week" do
          result = [client_1, client_2].map do |client|
            {
              id: client.id, name: client.name, email: client.email,
              minutes_spent: client.total_hours_logged(time_frame)
            }
          end
          expect(company.client_details(time_frame)).to eq(result)
        end
      end

      context "when time_frame is year" do
        let(:time_frame) { "year" }

        it "returns the total hours logged for all the clients of a Company in that week" do
          result = [client_1, client_2].map do |client|
            {
              id: client.id, name: client.name, email: client.email,
              minutes_spent: client.total_hours_logged(time_frame)
            }
          end
          expect(company.client_details(time_frame)).to eq(result)
        end
      end
    end

    describe "#client_list" do
      let(:company) { create(:company) }
      let(:user) { create(:user) }
      let(:client) { create(:client, company:) }

      it "returns list of all the clients of a company" do
        result = [{ id: client.id, name: client.name, email: client.email, address: client.address }]
        expect(company.client_list).to eq(result)
      end
    end
  end
end
