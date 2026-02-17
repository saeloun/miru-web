# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Expense#show", type: :request do
  let(:company) { create(:company) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client: client_1) }
  let(:expense_category) { create(:expense_category, company:) }
  let(:vendor) { create(:vendor, company:) }
  let(:expense) { create(:expense, :with_receipts, company:, expense_category:, vendor:) }

  let(:book_keeper) { create(:user, current_workspace_id: company.id) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user: book_keeper)
    book_keeper.add_role :book_keeper, company

    create(:employment, company:, user: admin)
    admin.add_role :admin, company

    create(:employment, company:, user: employee)
    employee.add_role :employee, company
  end

  context "when user is an admin" do
    before do
      sign_in admin
    end

    describe "#show" do
      before do
        send_request :get, api_v1_expense_path(expense)
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
          "description": expense[:description],
          "receipts": expense.attached_receipts_urls
        }
        expect(json_response.slice("amount", "type", "vendorName", "categoryName", "description", "receipts"))
          .to eq(JSON.parse(expected_response.to_json))
      end
    end
  end

  context "when the user is an employee" do
    before do
      sign_in employee
      send_request :get, api_v1_expense_path(expense)
    end

    it "is not be permitted to create a expense" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when the user is an book keeper" do
    before do
      sign_in book_keeper
      send_request :get, api_v1_expense_path(expense)
    end

    it "is not be permitted to create a expense" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to create a expense" do
      send_request :get, api_v1_expense_path(expense)
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
