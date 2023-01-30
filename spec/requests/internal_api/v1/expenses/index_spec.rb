# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Expense#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client: client_1) }
  let(:expense_category) { create(:expense_category, company:) }
  let(:expense_category_2) { create(:expense_category, company:) }

  let(:vendor) { create(:vendor, company:) }
  let(:expense1) { create(:expense, company:, expense_category:, vendor:) }
  let(:expense2) { create(:expense, company:, expense_category: expense_category_2) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
      expense1.reindex
      expense2.reindex
      Expense.reindex
    end

    describe "#index" do
      before do
        send_request :get, internal_api_v1_expenses_path
      end

      it "returns success" do
        expect(response).to have_http_status(:ok)
      end

      it "returns expenses data in the response" do
        expected_data = [expense2, expense1].map do | expense|
                          {
                            "id" => expense.id,
                            "amount" => expense.amount.to_f,
                            "date" => expense.date.strftime("%m.%d.%Y"),
                            "expenseType" => expense.expense_type,
                            "categoryName" => expense.expense_category.name,
                            "vendorName" => expense.vendor&.name
                          }
                        end
        expect(json_response["expenses"]).to eq(expected_data)
      end

      it "returns pagination information in the response" do
        expect(json_response["pagy"]).to eq(
          { "pages" => 1, "first" => true, "prev" => nil, "next" => nil, "last" => true })
      end

      it "returns list of vendors in the response" do
        expect(json_response["vendors"]).to eq(
          [{ "id" => vendor.id, "name" => vendor.name }])
      end

      it "returns list of categories in the response" do
        expect(json_response["categories"]).to eq(
          [{ "id" => expense_category.id, "name" => expense_category.name, "default" => false },
           { "id" => expense_category_2.id, "name" => expense_category_2.name, "default" => false }])
      end
    end
  end

  context "when the user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_expenses_path
    end

    it "is not be permitted to view a expenses" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when the user is an book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      send_request :get, internal_api_v1_expenses_path
    end

    it "is not be permitted to view expenses" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to view expenses" do
      send_request :get, internal_api_v1_expenses_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
