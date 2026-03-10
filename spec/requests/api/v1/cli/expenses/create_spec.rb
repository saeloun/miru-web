# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Cli::Expenses#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:cli_token) { CliSession.issue_for(user:, company:).last }
  let!(:category) { create(:expense_category, company:, name: "Meals") }
  let!(:vendor) { create(:vendor, company:, name: "Cafe") }

  before do
    create(:employment, company:, user:)
  end

  it "creates an expense for an admin" do
    user.add_role :admin, company

    send_request :post, api_v1_cli_expenses_path, params: {
      expense: {
        amount: 42.25,
        date: Date.current.iso8601,
        description: "Lunch with client",
        expense_type: "business",
        expense_category_id: category.id,
        vendor_id: vendor.id
      }
    }, headers: cli_auth_headers(cli_token)

    expect(response).to have_http_status(:created)
    expect(json_response["notice"]).to eq(I18n.t("expenses.create"))
    expect(json_response.dig("expense", "category_name")).to eq("Meals")
    expect(Expense.last.user).to eq(user)
  end

  it "creates an expense for an employee" do
    user.add_role :employee, company

    send_request :post, api_v1_cli_expenses_path, params: {
      expense: {
        amount: 42.25,
        date: Date.current.iso8601,
        expense_type: "business",
        expense_category_id: category.id
      }
    }, headers: cli_auth_headers(cli_token)

    expect(response).to have_http_status(:created)
    expect(Expense.last.user).to eq(user)
  end
end
