# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Invoice editing", type: :system, js: true do
  let(:company) { create(:company, base_currency: "USD") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "Acme Labs") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  it "updates invoice details and an existing line item without duplicating it" do
    invoice = create(:invoice,
      company:,
      client:,
      invoice_number: "INV-EDIT-001",
      reference: "REF001")
    line_item = create(:invoice_line_item,
      invoice:,
      timesheet_entry: nil,
      name: "Initial item",
      description: "Initial description",
      rate: 100,
      quantity: 120)

    with_forgery_protection do
      visit_invoice_editor(invoice)

      fill_in "invoiceNumber", with: "INV-EDIT-002"
      fill_in "reference", with: "EDITREF2"
      update_invoice_line_item(
        original_name: "Initial item",
        name: "Updated item",
        rate: "125",
        quantity: "03:30",
        description: "Updated description"
      )

      save_invoice

      expect(last_invoice_mutation_response).to include(
        "method" => "PATCH",
        "status" => 200,
        "ok" => true
      ), -> { last_invoice_mutation_response.inspect }
      expect(page).to have_text("Invoice updated successfully", wait: 10)
      expect(page).to have_current_path("/invoices/#{invoice.id}/edit", ignore_query: true, wait: 10)

      invoice.reload
      line_item.reload

      expect(invoice.invoice_number).to eq("INV-EDIT-002")
      expect(invoice.reference).to eq("EDITREF2")
      expect(invoice.invoice_line_items.count).to eq(1)
      expect(line_item.name).to eq("Updated item")
      expect(line_item.description).to eq("Updated description")
      expect(line_item.rate).to eq(125)
      expect(line_item.quantity).to eq(210)
    end
  end

  it "persists added and deleted line items after reopening the editor" do
    invoice = create(:invoice,
      company:,
      client:,
      invoice_number: "INV-EDIT-DELETE-001")
    create(:invoice_line_item,
      invoice:,
      timesheet_entry: nil,
      name: "Keep me",
      description: "Retained line item",
      rate: 80,
      quantity: 60)
    removed_line_item = create(:invoice_line_item,
      invoice:,
      timesheet_entry: nil,
      name: "Remove me",
      description: "Deleted line item",
      rate: 50,
      quantity: 30)

    with_forgery_protection do
      visit_invoice_editor(invoice)

      remove_invoice_line_item("Remove me")
      add_manual_line_item(
        name: "Added item",
        rate: "140",
        quantity: "01:15",
        description: "Added after delete"
      )

      save_invoice

      expect(last_invoice_mutation_response).to include(
        "method" => "PATCH",
        "status" => 200,
        "ok" => true
      ), -> { last_invoice_mutation_response.inspect }
      expect(page).to have_text("Invoice updated successfully", wait: 10)

      invoice.reload
      expect(invoice.invoice_line_items.pluck(:name)).to contain_exactly("Keep me", "Added item")
      expect(invoice.invoice_line_items.find_by(id: removed_line_item.id)).to be_nil

      visit_invoice_editor(invoice)

      expect(page).to have_text("Keep me", wait: 10)
      expect(page).to have_text("Added item", wait: 10)
      expect(page).not_to have_text("Remove me")
      expect(invoice.invoice_line_items.count).to eq(2)
    end
  end

  it "updates an existing line item and adds one new line item without duplicating either" do
    invoice = create(:invoice,
      company:,
      client:,
      invoice_number: "INV-EDIT-MULTI-001")
    existing_line_item = create(:invoice_line_item,
      invoice:,
      timesheet_entry: nil,
      name: "Original item",
      description: "Original description",
      rate: 90,
      quantity: 60)

    with_forgery_protection do
      visit_invoice_editor(invoice)

      update_invoice_line_item(
        original_name: "Original item",
        name: "Original item updated",
        rate: "115",
        quantity: "02:15",
        description: "Updated existing description"
      )
      add_manual_line_item(
        name: "Brand new item",
        rate: "220",
        quantity: "00:30",
        description: "Added during edit"
      )

      save_invoice

      expect(last_invoice_mutation_response).to include(
        "method" => "PATCH",
        "status" => 200,
        "ok" => true
      ), -> { last_invoice_mutation_response.inspect }

      payload_line_items =
        parsed_last_invoice_mutation_request_body
          .dig("invoice", "invoice_line_items_attributes")
      expect(payload_line_items.pluck("name")).to eq(
        ["Original item updated", "Brand new item"]
      )

      invoice.reload
      existing_line_item.reload

      expect(invoice.invoice_line_items.count).to eq(2)
      expect(invoice.invoice_line_items.group(:name).count).to eq(
        "Original item updated" => 1,
        "Brand new item" => 1
      )
      expect(existing_line_item.description).to eq("Updated existing description")
      expect(existing_line_item.rate).to eq(115)
      expect(existing_line_item.quantity).to eq(135)

      visit_invoice_editor(invoice)

      expect(page).to have_text("Original item updated", wait: 10)
      expect(page).to have_text("Brand new item", wait: 10)
      expect(page).not_to have_field(type: "text", with: "Original item", wait: 1)
    end
  end

  it "recalculates totals after removing an entry-backed line item and replacing it with manual work" do
    invoice = create(:invoice,
      company:,
      client:,
      invoice_number: "INV-EDIT-TOTALS-001",
      discount: 0,
      tax: 0)
    create(:invoice_line_item,
      invoice:,
      timesheet_entry: nil,
      name: "Keep me",
      description: "Retained scope",
      rate: 100,
      quantity: 60)
    replaced_line_item = create(:invoice_line_item,
      invoice:,
      timesheet_entry: nil,
      name: "Replace me",
      description: "Will be removed",
      rate: 90,
      quantity: 120)

    with_forgery_protection do
      visit_invoice_editor(invoice)

      remove_invoice_line_item("Replace me")
      update_invoice_line_item(
        original_name: "Keep me",
        name: "Keep me",
        rate: "110",
        quantity: "01:30",
        description: "Retained scope updated"
      )
      add_manual_line_item(
        name: "Manual replacement",
        rate: "130",
        quantity: "00:45",
        description: "Replacement after delete"
      )
      fill_in "discount", with: "10"
      fill_in "tax", with: "5"

      expect_invoice_preview_totals(
        currency: company.base_currency,
        subtotal: 262.5,
        total_due: 257.5,
        discount: 10,
        tax: 5
      )

      save_invoice

      expect(page).to have_text("Invoice updated successfully", wait: 10)

      invoice.reload
      expect(invoice.invoice_line_items.find_by(id: replaced_line_item.id)).to be_nil
      expect(invoice.invoice_line_items.pluck(:name)).to eq(["Keep me", "Manual replacement"])
      expect(invoice.amount.to_f).to eq(257.5)
      expect(invoice.amount_due.to_f).to eq(257.5)

      visit_invoice_editor(invoice)
      expect_invoice_preview_totals(
        currency: company.base_currency,
        subtotal: 262.5,
        total_due: 257.5,
        discount: 10,
        tax: 5
      )
    end
  end
end
