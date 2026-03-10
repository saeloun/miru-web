# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Cli::Expenses#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:cli_token) { CliSession.issue_for(user:, company:).last }
  let!(:category) { create(:expense_category, company:, name: "Travel") }
  let!(:vendor) { create(:vendor, company:, name: "Jetway") }
  let!(:expense) do
    create(
      :expense,
      company:,
      user: user,
      expense_category: category,
      vendor: vendor,
      description: "Flight to client workshop",
      amount: 125.50
    )
  end

  before do
    create(:employment, company:, user:)
  end

  it "returns expenses, vendors, and categories for an admin" do
    user.add_role :admin, company

    send_request :get, api_v1_cli_expenses_path, params: { query: "Flight" }, headers: cli_auth_headers(cli_token)

    expect(response).to have_http_status(:ok)
    expect(json_response["expenses"]).to contain_exactly(include("id" => expense.id, "category_name" => "Travel"))
    expect(json_response["vendors"]).to contain_exactly(include("id" => vendor.id, "name" => "Jetway"))
    expect(json_response["categories"]).to contain_exactly(include("id" => category.id, "name" => "Travel"))
  end

  it "returns only the employee's own expenses" do
    user.add_role :employee, company
    create(
      :expense,
      company:,
      expense_category: category,
      vendor: vendor,
      description: "Another team expense",
      amount: 18.25
    )

    send_request :get, api_v1_cli_expenses_path, headers: cli_auth_headers(cli_token)

    expect(response).to have_http_status(:ok)
    expect(json_response["expenses"]).to contain_exactly(include("id" => expense.id))
  end
end
