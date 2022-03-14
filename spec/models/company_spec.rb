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
      is_expected.to validate_numericality_of(:standard_price).
      is_greater_than_or_equal_to(0)
    end
  end

  describe "Public methods" do
    describe "#client_hours_logged" do
      let (:company) { create(:company) }
      let (:user) { create(:user) }
      let!(:client_1) { create(:client, company: company) }
      let!(:client_2) { create(:client, company: company) }
      let!(:project_1) { create(:project, client: client_1) }
      let!(:project_2) { create(:project, client: client_2) }
      let!(:project_1_timesheet_entry) { create_list(:timesheet_entry, 5, user: user, project: project_1) }
      let!(:project_2_timesheet_entry) { create_list(:timesheet_entry, 5, user: user, project: project_2) }
      context "When time_frame is last_week / week / month / year" do
        it "returns the total hours logged for all the clients of a Company in that week" do
          result = [client_1, client_2].map { |client| { id: client.id, name: client.name, email: client.email, hours_spend: client.project_total_hours("week") } }
          expect(company.client_hours_logged("week")).to eq(result)
        end
        it "returns the total hours logged for all the clients of a Company in that month" do
          result = [client_1, client_2].map { |client| { id: client.id, name: client.name, email: client.email, hours_spend: client.project_total_hours("month") } }
          expect(company.client_hours_logged("month")).to eq(result)
        end
        it "returns the total hours logged for all the clients of a Company in that month" do
          result = [client_1, client_2].map { |client| { id: client.id, name: client.name, email: client.email, hours_spend: client.project_total_hours("year") } }
          expect(company.client_hours_logged("year")).to eq(result)
        end
        it "returns the total hours logged for all the clients of a Company in the last_week" do
          result = [client_1, client_2].map { |client| { id: client.id, name: client.name, email: client.email, hours_spend: client.project_total_hours("last_week") } }
          expect(company.client_hours_logged("last_week")).to eq(result)
        end
      end
    end
  end
end
