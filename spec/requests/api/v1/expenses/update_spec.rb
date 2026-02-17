# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Expense#update", type: :request do
  let(:company) { create(:company) }
  let(:expense_category) { create(:expense_category, company:) }
  let(:vendor) { create(:vendor, company:) }
  let(:expense) { create(:expense, company:, expense_category:, vendor:) }

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

    it "updates the expense" do
      send_request :patch,
        api_v1_expense_path(expense),
        params: {
          expense: {
            description: "Updated description",
            amount: 420.50
          }
        },
        headers: auth_headers(admin)

      expect(response).to have_http_status(:ok)
      expect(json_response["notice"]).to eq(I18n.t("expenses.update"))

      expense.reload
      expect(expense.description).to eq("Updated description")
      expect(expense.amount.to_f).to eq(420.50)
    end
  end

  context "when the user is an employee" do
    before do
      sign_in employee
      send_request :patch, api_v1_expense_path(expense), params: { expense: {} }, headers: auth_headers(employee)
    end

    it "is not permitted to update an expense" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when the user is a book keeper" do
    before do
      sign_in book_keeper
      send_request :patch, api_v1_expense_path(expense), params: { expense: {} }, headers: auth_headers(book_keeper)
    end

    it "is not permitted to update an expense" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not permitted to update an expense" do
      send_request :patch, api_v1_expense_path(expense), params: { expense: {} }

      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
