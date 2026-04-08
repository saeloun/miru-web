# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Invoice creation", type: :system, js: true do
  let(:currency) { "USD" }
  let(:company) { create(:company, base_currency: currency) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "Acme Labs") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  it "saves a new invoice with a manual line item draft" do
    with_forgery_protection do
      visit_new_invoice_for(client)

      fill_in "invoiceNumber", with: "INV-MANUAL-001"
      add_manual_line_item(
        name: "Manual item",
        rate: "100",
        quantity: "02:00",
        description: "Local save check"
      )

      expect(page).to have_text("Manual item", wait: 10)
      expect(page).to have_text("Local save check", wait: 10)

      save_invoice

      expect(page).to have_text("Invoice created successfully", wait: 10)

      invoice = Invoice.find_by!(invoice_number: "INV-MANUAL-001")
      expect(page).to have_current_path("/invoices/#{invoice.id}/edit", ignore_query: true, wait: 10)
      line_item = invoice.invoice_line_items.last

      expect(line_item.name).to eq("Manual item")
      expect(line_item.description).to eq("Local save check")
      expect(line_item.quantity).to eq(120)
      expect(line_item.rate).to eq(100)
      expect(line_item.date).to be_present
    end
  end

  it "auto-generates the first invoice number for a client without invoices" do
    with_forgery_protection do
      visit_new_invoice_for(client)

      expect(page).to have_field("invoiceNumber", with: "INV-#{client.id.to_s.rjust(3, '0')}-001", wait: 10)

      add_manual_line_item(
        name: "First invoice item",
        rate: "125",
        quantity: "01:00"
      )

      save_invoice

      expect(page).to have_text("Invoice created successfully", wait: 10)
      invoice = Invoice.find_by!(client:, invoice_number: "INV-#{client.id.to_s.rjust(3, '0')}-001")
      expect(page).to have_current_path("/invoices/#{invoice.id}/edit", ignore_query: true, wait: 10)
      expect_invoice_editor_loaded
    end
  end

  it "saves committed and pending manual line items exactly once" do
    with_forgery_protection do
      visit_new_invoice_for(client)

      fill_in "invoiceNumber", with: "INV-MULTI-001"

      add_manual_line_item(
        name: "Committed item",
        rate: "150",
        quantity: "01:30",
        description: "Committed before save"
      )
      commit_pending_manual_line_item(name: "Committed item")

      add_manual_line_item(
        name: "Pending item",
        rate: "200",
        quantity: "00:45",
        description: "Still pending at save"
      )

      save_invoice

      expect(last_invoice_mutation_response).to include(
        "method" => "POST",
        "status" => 200,
        "ok" => true
      ), -> { last_invoice_mutation_response.inspect }
      expect(page).to have_text("Invoice created successfully", wait: 10)

      payload_line_items =
        parsed_last_invoice_mutation_request_body
          .dig("invoice", "invoice_line_items_attributes")
      expect(payload_line_items.pluck("name")).to eq(
        ["Committed item", "Pending item"]
      )

      invoice = Invoice.find_by!(invoice_number: "INV-MULTI-001")
      expect(page).to have_current_path("/invoices/#{invoice.id}/edit", ignore_query: true, wait: 10)
      expect_invoice_editor_loaded
      expect(invoice.invoice_line_items.pluck(:name)).to eq(
        ["Committed item", "Pending item"]
      )
      expect(invoice.invoice_line_items.group(:name).count).to eq(
        "Committed item" => 1,
        "Pending item" => 1
      )

      visit_invoice_editor(invoice)

      expect(page).to have_text("Committed item", wait: 10)
      expect(page).to have_text("Pending item", wait: 10)
      expect(invoice.invoice_line_items.count).to eq(2)
    end
  end

  it "recalculates totals after removing a picked entry and replacing it with manual items" do
    employee = create(:user, current_workspace_id: company.id, first_name: "Nina", last_name: "Sharp")
    create(:employment, company:, user: employee)
    employee.add_role :employee, company
    project = create(:project, client:, billable: true)
    create(:timesheet_entry,
      user: employee,
      project:,
      work_date: Date.current,
      duration: 120,
      bill_status: :unbilled,
      note: "Picked entry to remove later")

    with_forgery_protection do
      visit_new_invoice_for(client)

      fill_in "invoiceNumber", with: "INV-REPLACE-001"
      add_timesheet_line_item(description: "Picked entry to remove later")
      remove_invoice_line_item("Nina Sharp")
      add_manual_line_item(
        name: "Replacement build review",
        rate: "125",
        quantity: "02:30",
        description: "Manual replacement"
      )
      commit_pending_manual_line_item(name: "Replacement build review")
      add_manual_line_item(
        name: "Follow-up QA",
        rate: "80",
        quantity: "01:00",
        description: "Pending final check"
      )
      fill_in "discount", with: "20"
      fill_in "tax", with: "15"

      expect_invoice_preview_totals(
        currency:,
        subtotal: 392.50,
        total_due: 387.50,
        discount: 20,
        tax: 15
      )

      save_invoice

      expect(page).to have_text("Invoice created successfully", wait: 10)

      invoice = Invoice.find_by!(invoice_number: "INV-REPLACE-001")
      expect(page).to have_current_path("/invoices/#{invoice.id}/edit", ignore_query: true, wait: 10)
      expect_invoice_editor_loaded
      expect(invoice.invoice_line_items.pluck(:name)).to eq(
        ["Replacement build review", "Follow-up QA"]
      )
      expect(invoice.amount.to_f).to eq(387.5)
      expect(invoice.amount_due.to_f).to eq(387.5)
    end
  end

  {
    "USD" => { subtotal: 410.0, total_due: 395.0 },
    "EUR" => { subtotal: 410.0, total_due: 395.0 },
    "INR" => { subtotal: 410.0, total_due: 395.0 }
  }.each do |base_currency, totals|
    context "when the company base currency is #{base_currency}" do
      let(:currency) { base_currency }

      it "shows preview totals in #{base_currency} format before saving" do
        with_forgery_protection do
          visit_new_invoice_for(client)

          fill_in "invoiceNumber", with: "INV-#{base_currency}-001"
          add_manual_line_item(
            name: "#{base_currency} strategy block",
            rate: "205",
            quantity: "02:00",
            description: "Currency formatting check"
          )
          fill_in "discount", with: "25"
          fill_in "tax", with: "10"

          expect_invoice_preview_totals(
            currency:,
            subtotal: totals[:subtotal],
            total_due: totals[:total_due],
            discount: 25,
            tax: 10
          )

          save_invoice

          invoice = Invoice.find_by!(invoice_number: "INV-#{base_currency}-001")
          expect(page).to have_current_path("/invoices/#{invoice.id}/edit", ignore_query: true, wait: 10)
          expect_invoice_editor_loaded
          expect(invoice.amount.to_f).to eq(395.0)
          expect(invoice.amount_due.to_f).to eq(395.0)
        end
      end
    end
  end
end
