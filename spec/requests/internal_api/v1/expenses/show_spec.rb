# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Expense#show", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client: client_1) }
  let(:expense_category) { create(:expense_category, company:) }
  let(:vendor) { create(:vendor, company:) }
  let(:expense) { create(:expense, company:, expense_category:, vendor:) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "#show" do
      before do
        send_request :get, internal_api_v1_expense_path(expense)
      end

      it "returns success" do
        expect(response).to have_http_status(:ok)
      end

      it "returns expected data in the response" do
        expected_response = {
          "amount": expense[:amount].to_s,
          "type": expense[:expense_type],
          "vendorName": vendor.name,
          "categoryName": expense_category.name,
          "description": expense[:description]

        }
        expect(json_response.slice("amount", "type", "vendorName", "categoryName", "description"))
          .to eq(JSON.parse(expected_response.to_json))
      end
    end
  end

  context "when the user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_expense_path(expense)
    end

    it "is not be permitted to create a expense" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when the user is an book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      send_request :get, internal_api_v1_expense_path(expense)
    end

    it "is not be permitted to create a expense" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to create a expense" do
      send_request :get, internal_api_v1_expense_path(expense)
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
