# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Clients#index", type: :request do
  let(:company) { create(:company) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }
  let!(:visible_client) { create(:client, company: company, name: "Visible Client") }
  let!(:other_company_client) { create(:client, name: "Other Company Client") }
  let!(:latest_invoice) do
    create(:invoice,
      company:,
      client: visible_client,
      invoice_number: "VC-004",
      issue_date: Date.current,
      due_date: 30.days.from_now.to_date)
  end

  before do
    book_keeper.add_role(:book_keeper, company)
    sign_in book_keeper
  end

  it "allows a book keeper to fetch clients for the current company" do
    get "/api/v1/clients"

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch("client_details").pluck("name")).to include("Visible Client")
    expect(response.parsed_body.fetch("client_details").pluck("name")).not_to include("Other Company Client")
    visible_client_payload = response.parsed_body.fetch("client_details").find { |client| client["name"] == "Visible Client" }
    expect(visible_client_payload["previousInvoiceNumber"]).to eq(latest_invoice.invoice_number)
  end

  it "blocks employees from fetching the clients index" do
    employee = create(:user, current_workspace_id: company.id)
    assigned_client = create(:client, company: company, name: "Assigned Client")
    assigned_project = create(:project, client: assigned_client)
    create(:project_member, project: assigned_project, user: employee, hourly_rate: 100)
    create(:employment, company:, user: employee)
    employee.add_role(:employee, company)

    sign_in employee

    get "/api/v1/clients", headers: auth_headers(employee)

    expect(response).to have_http_status(:forbidden)
  end
end
