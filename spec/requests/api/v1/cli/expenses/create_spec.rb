# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Cli::Expenses#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:cli_token) { CliSession.issue_for(user:, company:).last }

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
        currency: "INR",
        category_name: "Meals",
        vendor_name: "Cafe"
      }
    }, headers: cli_auth_headers(cli_token)

    expect(response).to have_http_status(:created)
    expect(json_response["notice"]).to eq(I18n.t("expenses.create"))
    expect(json_response.dig("expense", "category_name")).to eq("Meals")
    expect(json_response.dig("expense", "currency")).to eq("INR")
    expect(Expense.last.user).to eq(user)
    expect(Expense.last.currency).to eq("INR")
  end

  it "creates an expense for an employee" do
    user.add_role :employee, company

    send_request :post, api_v1_cli_expenses_path, params: {
      expense: {
        amount: 42.25,
        date: Date.current.iso8601,
        expense_type: "business",
        category_name: "Meals"
      }
    }, headers: cli_auth_headers(cli_token)

    expect(response).to have_http_status(:created)
    expect(Expense.last.user).to eq(user)
  end

  it "authorizes against the CLI session workspace" do
    privileged_company = create(:company)
    create(:employment, company: privileged_company, user:)
    user.add_role :client, company
    user.add_role :admin, privileged_company
    user.update!(current_workspace_id: privileged_company.id)

    expect do
      send_request :post, api_v1_cli_expenses_path, params: {
        expense: {
          amount: 42.25,
          date: Date.current.iso8601,
          expense_type: "business",
          category_name: "Meals"
        }
      }, headers: cli_auth_headers(cli_token)
    end.not_to change(Expense, :count)

    expect(response).to have_http_status(:forbidden)
    expect(user.reload.current_workspace_id).to eq(privileged_company.id)
  end
end
