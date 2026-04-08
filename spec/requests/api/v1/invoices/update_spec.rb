# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices#update", type: :request do
  let_it_be(:company) { create(:company) }
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
end
