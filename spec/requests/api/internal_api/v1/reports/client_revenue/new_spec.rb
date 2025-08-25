# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Reports::ClientRevenuesController::#new", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client_1) { create(:client, company:) }
  let(:client_2) { create(:client, company:) }
  let(:client_3) { create(:client, company:, name: "john") }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      create(:project, billable: true, client: client_1)
      create(:project, billable: true, client: client_2)
      user.add_role :admin, company
      sign_in user
      send_request :get, new_api_v1_reports_client_revenue_path, headers: auth_headers(user)
    end

    it_behaves_like "Api::V1::Reports::ClientRevenuesController::#new success response"
  end

  context "when user is an owner" do
    before do
      create(:employment, company:, user:)
      create(:project, billable: true, client: client_1)
      create(:project, billable: true, client: client_2)
      user.add_role :owner, company
      sign_in user
      send_request :get, new_api_v1_reports_client_revenue_path, headers: auth_headers(user)
    end

    it_behaves_like "Api::V1::Reports::ClientRevenuesController::#new success response"
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, new_api_v1_reports_client_revenue_path, headers: auth_headers(user)
    end

    it "is not permitted to get billable clients list" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      send_request :get, new_api_v1_reports_client_revenue_path, headers: auth_headers(user)
    end

    it "is not permitted to get billable clients list" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not permitted to get billable clients list" do
      send_request :get, new_api_v1_reports_client_revenue_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
