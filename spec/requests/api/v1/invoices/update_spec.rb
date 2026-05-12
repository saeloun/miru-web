# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices#update", type: :request do
  let_it_be(:company) { create(:company, :with_logo) }
  let_it_be(:client) { create(:client, company:) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:invoice) { create(:invoice, company:, client:, invoice_number: "INV-UP-001") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in user
  end

  it "removes deleted line items and preserves kept ones" do
    kept_line_item = create(:invoice_line_item,
      invoice:,
      timesheet_entry: nil,
      name: "Keep me",
      description: "Keep description",
      rate: 100,
      quantity: 60)
    removed_line_item = create(:invoice_line_item,
      invoice:,
      timesheet_entry: nil,
      name: "Remove me",
      description: "Remove description",
      rate: 50,
      quantity: 30)

    send_request :patch, api_v1_invoice_path(invoice), params: {
      invoice: {
        client_id: client.id,
        invoice_number: "INV-UP-001",
        issue_date: invoice.issue_date.iso8601,
        due_date: invoice.due_date.iso8601,
        status: "draft",
        currency: company.base_currency,
        invoice_line_items_attributes: [
          {
            id: kept_line_item.id,
            name: "Keep me",
            description: "Keep description updated",
            date: kept_line_item.date.iso8601,
            rate: 125,
            quantity: 90
          },
          {
            id: removed_line_item.id,
            name: "Remove me",
            description: "Remove description",
            date: removed_line_item.date.iso8601,
            rate: 50,
            quantity: 30,
            _destroy: true
          }
        ]
      }
    }, headers: auth_headers(user)

    expect(response).to have_http_status(:ok)

    invoice.reload
    expect(invoice.invoice_line_items.pluck(:name)).to eq(["Keep me"])

    kept_line_item.reload
    expect(kept_line_item.description).to eq("Keep description updated")
    expect(kept_line_item.rate).to eq(125)
    expect(kept_line_item.quantity).to eq(90)
    expect(invoice.invoice_line_items.find_by(id: removed_line_item.id)).to be_nil
  end

  it "updates an existing line item and creates a new one without duplicating the existing record" do
    existing_line_item = create(:invoice_line_item,
      invoice:,
      timesheet_entry: nil,
      name: "Existing item",
      description: "Existing description",
      rate: 100,
      quantity: 60)

    send_request :patch, api_v1_invoice_path(invoice), params: {
      invoice: {
        client_id: client.id,
        invoice_number: "INV-UP-001",
        issue_date: invoice.issue_date.iso8601,
        due_date: invoice.due_date.iso8601,
        status: "draft",
        currency: company.base_currency,
        invoice_line_items_attributes: [
          {
            id: existing_line_item.id,
            name: "Existing item updated",
            description: "Existing description updated",
            date: existing_line_item.date.iso8601,
            rate: 125,
            quantity: 90
          },
          {
            name: "New item",
            description: "New line item",
            date: Date.current.iso8601,
            rate: 80,
            quantity: 30
          }
        ]
      }
    }, headers: auth_headers(user)

    expect(response).to have_http_status(:ok)

    invoice.reload
    existing_line_item.reload

    expect(invoice.invoice_line_items.count).to eq(2)
    expect(invoice.invoice_line_items.group(:name).count).to eq(
      "Existing item updated" => 1,
      "New item" => 1
    )
    expect(existing_line_item.description).to eq("Existing description updated")
    expect(existing_line_item.rate).to eq(125)
    expect(existing_line_item.quantity).to eq(90)
  end

  it "recalculates totals after deleting one line item, updating another, and adding a new one" do
    kept_line_item = create(:invoice_line_item,
      invoice:,
      timesheet_entry: nil,
      name: "Keep me",
      description: "Keep description",
      rate: 100,
      quantity: 60)
    removed_line_item = create(:invoice_line_item,
      invoice:,
      timesheet_entry: nil,
      name: "Remove me",
      description: "Remove description",
      rate: 80,
      quantity: 30)

    send_request :patch, api_v1_invoice_path(invoice), params: {
      invoice: {
        client_id: client.id,
        invoice_number: "INV-UP-001",
        issue_date: invoice.issue_date.iso8601,
        due_date: invoice.due_date.iso8601,
        status: "draft",
        currency: company.base_currency,
        discount: 15,
        tax: 5,
        invoice_line_items_attributes: [
          {
            id: kept_line_item.id,
            name: "Keep me",
            description: "Keep description updated",
            date: kept_line_item.date.iso8601,
            rate: 120,
            quantity: 90
          },
          {
            id: removed_line_item.id,
            name: "Remove me",
            description: "Remove description",
            date: removed_line_item.date.iso8601,
            rate: 80,
            quantity: 30,
            _destroy: true
          },
          {
            name: "Add me",
            description: "New line item",
            date: Date.current.iso8601,
            rate: 70,
            quantity: 60
          }
        ]
      }
    }, headers: auth_headers(user)

    expect(response).to have_http_status(:ok)

    invoice.reload
    expect(invoice.invoice_line_items.find_by(id: removed_line_item.id)).to be_nil
    expect(invoice.amount.to_f).to eq(240.0)
    expect(invoice.amount_due.to_f).to eq(240.0)
    expect(json_response["amount"].to_f).to eq(240.0)
    expect(json_response["amountDue"].to_f).to eq(240.0)
  end

  it "returns company data needed by the editor preview" do
    company.addresses.first.update!(address_line_1: "100 Market St", city: "San Francisco", state: "CA", country: "USA", pin: "94105")
    company.update!(
      business_phone: "+14155552671",
      tax_id: "TAX-123",
      bank_name: "QA Bank",
      bank_account_number: "12345678",
      bank_routing_number: "987654321",
      bank_swift_code: "QABKUS33",
      ein: "12-3456789",
      us_taxpayer_id: "US-TIN-1234"
    )

    send_request :patch, api_v1_invoice_path(invoice), params: {
      invoice: {
        client_id: client.id,
        invoice_number: "INV-UP-001",
        issue_date: invoice.issue_date.iso8601,
        due_date: invoice.due_date.iso8601,
        status: "draft",
        currency: company.base_currency,
        invoice_line_items_attributes: [
          {
            name: "Updated item",
            description: "Updated line item",
            date: Date.current.iso8601,
            rate: 80,
            quantity: 60
          }
        ]
      }
    }, headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(json_response.dig("company", "name")).to eq(company.name)
    expect(json_response.dig("company", "phoneNumber")).to eq(company.business_phone)
    expect(json_response.dig("company", "taxId")).to eq(company.tax_id)
    expect(json_response.dig("company", "ein")).to eq(company.ein)
    expect(json_response.dig("company", "usTaxpayerId")).to eq(company.us_taxpayer_id)
    expect(json_response.dig("company", "logo")).to end_with(company.company_logo)
    expect(json_response.dig("company", "bankName")).to eq(company.bank_name)
    expect(json_response.dig("company", "bankAccountNumber")).to eq(company.bank_account_number)
    expect(json_response.dig("company", "bankRoutingNumber")).to eq(company.bank_routing_number)
    expect(json_response.dig("company", "bankSwiftCode")).to eq(company.bank_swift_code)
    expect(
      json_response.dig("company", "address", "addressLine1") ||
      json_response.dig("company", "address", "address_line_1")
    ).to eq(company.current_address.address_line_1)
  end
end
