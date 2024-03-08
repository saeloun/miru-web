# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Expenses::ExpensesSummary#index", type: :request do
  let(:company) { create(:company, base_currency: "USD") }
  let(:expense_category) { create(:expense_category, default: true) }
  let(:expense_category_2) { create(:expense_category, company:) }

  let(:vendor) { create(:vendor, company:) }
  let(:expense1) { create(:expense, company:, expense_category:, vendor:) }
  let(:expense2) { create(:expense, company:, expense_category: expense_category_2) }

  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is admin" do
    describe "#index" do
      before do
        create(:employment, company:, user:)
        user.add_role :admin, company
        sign_in user
        expense1.reindex
        expense2.reindex
        Expense.reindex
        send_request :get, internal_api_v1_expenses_expenses_summary_index_path, headers: auth_headers(user)
      end

      it "returns success" do
        expect(response).to have_http_status(:ok)
      end

      it "returns expenses summary" do
        expect(json_response["expenses_summary"]).to have_key("default_categories_sum")
        expect(json_response["expenses_summary"]).to have_key("company_categories_sum")
        expect(json_response["expenses_summary"]).to have_key("total_sum")

        expect(json_response["expenses_summary"]["default_categories_sum"]).to eq(
          {
            expense_category.name => FormatAmountService.new(company.base_currency, expense1.amount).process
          })
        expect(json_response["expenses_summary"]["company_categories_sum"]).to eq(
          {
            expense_category_2.name => FormatAmountService.new(company.base_currency, expense2.amount).process
          })
        expect(json_response["expenses_summary"]["total_sum"]).to eq(
          FormatAmountService.new(
            company.base_currency,
            expense1.amount + expense2.amount).process
        )
      end
    end
  end

  context "when user is employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      expense1.reindex
      expense2.reindex
      Expense.reindex
      send_request :get, internal_api_v1_expenses_expenses_summary_index_path, headers: auth_headers(user)
    end

    it "is not be permitted to view expenses summary" do
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
