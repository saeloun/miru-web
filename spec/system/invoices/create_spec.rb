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

      expect_invoice_line_item("Manual item", description: "Local save check")

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

  it "keeps send failure feedback clear after creating a new invoice" do
    allow(InvoicePayment::PdfGeneration)
      .to receive(:process)
      .and_raise(StandardError, "PDF generation failed")

    with_forgery_protection do
      visit_new_invoice_for(client)

      fill_in "invoiceNumber", with: "INV-SEND-FAIL-001"
      add_manual_line_item(
        name: "Send failure item",
        rate: "100",
        quantity: "01:00",
        description: "PDF failure path"
      )

      expect do
        click_button "Send Invoice"
        expect(page).to have_text(
          "Invoice was saved as a draft, but sending failed: Failed to generate PDF",
          wait: 10
        )
      end.to change(Invoice, :count).by(1)

      invoice = Invoice.find_by!(invoice_number: "INV-SEND-FAIL-001")
      expect(invoice).to be_draft
      expect(page).to have_current_path("/invoices/#{invoice.id}/edit", ignore_query: true, wait: 10)
      expect(page).to have_no_text("Invoice created successfully")

      expect do
        click_button "Send Invoice"
        expect(page).to have_text(
          "Invoice was saved as a draft, but sending failed: Failed to generate PDF",
          wait: 10
        )
      end.not_to change(Invoice, :count)

      expect(page).to have_no_text("Invoice number has already been taken")
    end
  end

  it "shows the manual entry name in the invoice preview before saving" do
    with_forgery_protection do
      visit_new_invoice_for(client)

      fill_in "invoiceNumber", with: "INV-MANUAL-PREVIEW-001"
      add_manual_line_item(
        name: "Manual preview item",
        rate: "100",
        quantity: "02:00",
        description: "Preview name check"
      )

      show_invoice_preview

      within "[data-testid='invoice-preview']" do
        expect(page).to have_text("Manual preview item", wait: 10)
        expect(page).to have_text("Preview name check", wait: 10)
      end
    end
  end

  it "shows real company details in the preview instead of fallback placeholders" do
    company.addresses.first.update!(address_line_1: "100 Market St", city: "San Francisco", state: "CA", country: "USA", pin: "94105")
    company.update!(
      business_phone: "+14155552671",
      tax_id: "TAX-123",
      ein: "12-3456789",
      bank_name: "QA Bank",
      bank_account_number: "12345678"
    )
    client.update!(ein: "98-7654321")

    with_forgery_protection do
      visit_new_invoice_for(client)

      show_invoice_preview

      within "[data-testid='invoice-preview']" do
        expect(page).to have_text(company.name, wait: 10)
        expect(page).to have_text("100 Market St", wait: 10)
        expect(page).to have_text("TAX-123", wait: 10)
        expect(page).to have_text("EIN: 12-3456789", wait: 10)
        expect(page).to have_text("EIN: 98-7654321", wait: 10)
        expect(page).not_to have_text("support@getmiru.com", wait: 1)
      end
    end
  end

  it "auto-generates the first invoice number for a client without invoices" do
    with_forgery_protection do
      visit_new_invoice_for(client)

      expect(page).to have_field("invoiceNumber", with: "INV-#{client.id.to_s.chars.last(3).join.rjust(3, '0')}-001", wait: 10)

      add_manual_line_item(
        name: "First invoice item",
        rate: "125",
        quantity: "01:00"
      )

      save_invoice

      expect(page).to have_text("Invoice created successfully", wait: 10)
      invoice = Invoice.find_by!(client:, invoice_number: "INV-#{client.id.to_s.chars.last(3).join.rjust(3, '0')}-001")
      expect(page).to have_current_path("/invoices/#{invoice.id}/edit", ignore_query: true, wait: 10)
      expect_invoice_editor_loaded
    end
  end

  it "keeps manual invoice number edits until the client changes" do
    beta_client = create(:client, company:, name: "Beta Labs")

    with_forgery_protection do
      visit_new_invoice_for(client)

      expect(page).to have_field("invoiceNumber", with: "INV-#{client.id.to_s.chars.last(3).join.rjust(3, '0')}-001", wait: 10)

      fill_in "invoiceNumber", with: "INV-CUSTOM-001"
      expect(page).to have_field("invoiceNumber", with: "INV-CUSTOM-001", wait: 2)

      fill_in "invoiceNumber", with: ""
      expect(page).to have_field("invoiceNumber", with: "", wait: 2)

      fill_in "invoiceNumber", with: "INV-CUSTOM-002"
      expect(page).to have_field("invoiceNumber", with: "INV-CUSTOM-002", wait: 2)

      select_invoice_client(beta_client.name)

      expect(page).to have_button(beta_client.name, wait: 10)
      expect(page).to have_field("invoiceNumber", with: "INV-#{beta_client.id.to_s.chars.last(3).join.rjust(3, '0')}-001", wait: 10)
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

      expect_invoice_line_item("Committed item")
      expect_invoice_line_item("Pending item")
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

  it "creates an invoice with multiple configured taxes" do
    create(:tax_configuration, company:, name: "CGST", calculation_method: "percentage", value: 9)
    create(:tax_configuration, company:, name: "SGST", calculation_method: "percentage", value: 9)

    with_forgery_protection do
      visit_new_invoice_for(client)

      fill_in "invoiceNumber", with: "INV-CONFIGURED-TAX-001"
      add_manual_line_item(
        name: "Taxable implementation",
        rate: "100",
        quantity: "10:00",
        description: "GST taxable work"
      )

      find("label", text: "CGST", wait: 10).click
      find("label", text: "SGST", wait: 10).click

      show_invoice_preview
      within "[data-testid='invoice-preview']" do
        expect(page).to have_text("$1,000.00", wait: 10)
        expect(page).to have_text("$1,180.00", wait: 10)
        expect(page).to have_text("CGST", wait: 10)
        expect(page).to have_text("SGST", wait: 10)
        expect(page).to have_text(formatted_invoice_currency(90, currency), wait: 10)
      end
      show_invoice_editor

      save_invoice

      expect(page).to have_text("Invoice created successfully", wait: 10)

      invoice = Invoice.find_by!(invoice_number: "INV-CONFIGURED-TAX-001")
      expect(invoice.tax.to_f).to eq(180.0)
      expect(invoice.amount.to_f).to eq(1180.0)
      expect(invoice.invoice_taxes.pluck(:name, :amount)).to match_array([
        ["CGST", 90.to_d],
        ["SGST", 90.to_d]
      ])
      expect(
        parsed_last_invoice_mutation_request_body
          .dig("invoice", "invoice_taxes_attributes")
          .pluck("name")
      ).to match_array(["CGST", "SGST"])
    end
  end

  it "applies a custom date filter in the time entry picker without leaving the invoice form" do
    project = create(:project, client:, billable: true)
    create(:project_member, project:, user:, hourly_rate: 95)
    create(
      :timesheet_entry,
      project:,
      user:,
      bill_status: "unbilled",
      duration: 120,
      note: "Filterable entry",
      work_date: Date.new(2026, 4, 5)
    )

    with_forgery_protection do
      visit_new_invoice_for(client)

      click_button "LINE ITEMS"
      find("[data-testid='invoice-manual-entry-name']", wait: 10).click
      click_button "Select Time Entries"
      all("[role='combobox']", wait: 10).last.click
      find("[role='option']", text: "Custom", wait: 10).click
      expect(page).to have_field("from-input", wait: 10)
      fill_in "from-input", with: "01 Apr 2026"
      fill_in "to-input", with: "10 Apr 2026"
      find("button.sidebar__apply", text: /Done/i, wait: 10).click
      find("button", text: "APPLY", wait: 10).click

      expect(page).to have_current_path(/\/invoices\/new/, wait: 10)
      expect(page).not_to have_text("404", wait: 1)
      expect(page).to have_text("Filterable entry", wait: 10)
    end
  end

  it "creates grouped project invoice line items from selected time entries" do
    employee = create(:user, current_workspace_id: company.id, first_name: "Nina", last_name: "Sharp")
    create(:employment, company:, user: employee)
    employee.add_role :employee, company

    platform_project = create(:project, client:, name: "Platform Build", billable: true)
    mobile_project = create(:project, client:, name: "Mobile App", billable: true)
    create(:project_member, project: platform_project, user: employee, hourly_rate: 100)
    create(:project_member, project: mobile_project, user: employee, hourly_rate: 125)
    platform_entries = [
      create(:timesheet_entry, user: employee, project: platform_project, bill_status: :unbilled, duration: 120, note: "API work"),
      create(:timesheet_entry, user: employee, project: platform_project, bill_status: :unbilled, duration: 60, note: "Review work")
    ]
    mobile_entry = create(:timesheet_entry, user: employee, project: mobile_project, bill_status: :unbilled, duration: 90, note: "Mobile QA")

    with_forgery_protection do
      visit_new_invoice_for(client)

      fill_in "invoiceNumber", with: "INV-PROJECT-GROUP-001"
      click_button "LINE ITEMS"
      find("[data-testid='invoice-manual-entry-name']", wait: 10).click
      click_button "Select Time Entries"
      check "Group by project"
      click_button "APPLY"

      expect(page).to have_text("Platform Build", wait: 10)
      expect(page).to have_text("Mobile App", wait: 10)

      find("thead input.custom__checkbox", visible: :all, wait: 10).click
      click_button "ADD ENTRIES"

      expect_invoice_line_item("Platform Build")
      expect_invoice_line_item("Mobile App")
      expect(page).to have_css("[data-testid='invoice-line-item-quantity'][value='03:00']", wait: 10)
      expect(page).to have_css("[data-testid='invoice-line-item-quantity'][value='01:30']", wait: 10)

      save_invoice

      expect(page).to have_text("Invoice created successfully", wait: 10)

      invoice = Invoice.find_by!(invoice_number: "INV-PROJECT-GROUP-001")
      platform_line_item = invoice.invoice_line_items.find_by!(name: "Platform Build")
      mobile_line_item = invoice.invoice_line_items.find_by!(name: "Mobile App")

      expect(platform_line_item.quantity).to eq(180)
      expect(platform_line_item.linked_timesheet_entry_ids).to match_array(platform_entries.map(&:id))
      expect(mobile_line_item.quantity).to eq(90)
      expect(mobile_line_item.linked_timesheet_entry_ids).to eq([mobile_entry.id])
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
          client.update!(currency: base_currency)
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

  it "uses the client currency for preview totals and persists it on save" do
    company.update!(base_currency: "USD")
    client.update!(currency: "EUR")
    create(:exchange_rate, from_currency: "EUR", to_currency: "USD", rate: 1.2, date: Date.current)

    with_forgery_protection do
      visit_new_invoice_for(client)

      fill_in "invoiceNumber", with: "INV-EUR-UI-001"
      add_manual_line_item(
        name: "Euro design review",
        rate: "150",
        quantity: "02:00",
        description: "Client-currency invoice"
      )

      expect_invoice_preview_totals(
        currency: "EUR",
        subtotal: 300.0,
        total_due: 300.0
      )
      expect(page).not_to have_text("$300.00")

      save_invoice

      expect(page).to have_text("Invoice created successfully", wait: 10)

      response_body = JSON.parse(last_invoice_mutation_response.fetch("body"))
      invoice = Invoice.find_by!(invoice_number: "INV-EUR-UI-001")

      expect(invoice.currency).to eq("EUR")
      expect(response_body["currency"]).to eq("EUR")
      expect(page).to have_current_path("/invoices/#{invoice.id}/edit", ignore_query: true, wait: 10)
      expect_invoice_preview_totals(
        currency: "EUR",
        subtotal: 300.0,
        total_due: 300.0
      )
    end
  end

  it "updates preview currency when switching from a USD client to a EUR client" do
    eur_client = create(:client, company:, name: "Euro Labs", currency: "EUR")

    with_forgery_protection do
      visit_new_invoice_for(client)

      fill_in "invoiceNumber", with: "INV-SWITCH-001"
      add_manual_line_item(
        name: "Currency switch check",
        rate: "100",
        quantity: "02:00",
        description: "USD before switch"
      )
      expect_invoice_preview_totals(
        currency: "USD",
        subtotal: 200.0,
        total_due: 200.0
      )

      select_invoice_client(eur_client.name)
      expect(page).to have_button(eur_client.name, wait: 10)
      expect_invoice_preview_totals(
        currency: "EUR",
        subtotal: 200.0,
        total_due: 200.0
      )
      expect(page).not_to have_text("$200.00")
    end
  end

  it "persists the switched client currency when saving after changing clients" do
    eur_client = create(:client, company:, name: "Euro Save Labs", currency: "EUR")
    switched_invoice_number = "INV-#{eur_client.id.to_s.chars.last(3).join.rjust(3, '0')}-001"
    create(:exchange_rate, from_currency: "EUR", to_currency: "USD", rate: 1.2, date: Date.current)

    with_forgery_protection do
      visit_new_invoice_for(client)

      fill_in "invoiceNumber", with: "INV-SWITCH-SAVE-001"
      add_manual_line_item(
        name: "Currency switch save check",
        rate: "100",
        quantity: "02:00",
        description: "USD before switch"
      )

      select_invoice_client(eur_client.name)
      expect(page).to have_button(eur_client.name, wait: 10)
      expect(page).to have_field("invoiceNumber", with: switched_invoice_number, wait: 10)
      expect_invoice_preview_totals(
        currency: "EUR",
        subtotal: 200.0,
        total_due: 200.0
      )

      install_invoice_request_capture
      page.send_keys(:escape)
      click_button "Save", match: :first

      expect(page).to have_text("Invoice created successfully", wait: 10)

      response_body = JSON.parse(last_invoice_mutation_response.fetch("body"))
      invoice = Invoice.find_by!(invoice_number: switched_invoice_number)

      expect(invoice.client_id).to eq(eur_client.id)
      expect(invoice.currency).to eq("EUR")
      expect(response_body["currency"]).to eq("EUR")
      expect(page).to have_current_path("/invoices/#{invoice.id}/edit", ignore_query: true, wait: 10)
      expect_invoice_preview_totals(
        currency: "EUR",
        subtotal: 200.0,
        total_due: 200.0
      )
    end
  end

  it "uses the INR client currency in the editor and persisted invoice" do
    inr_client = create(:client, company:, name: "India Labs", currency: "INR")
    create(:exchange_rate, from_currency: "INR", to_currency: "USD", rate: 0.012, date: Date.current)

    with_forgery_protection do
      visit_new_invoice_for(inr_client)

      fill_in "invoiceNumber", with: "INV-INR-UI-001"
      add_manual_line_item(
        name: "India delivery",
        rate: "150",
        quantity: "02:00",
        description: "INR invoice"
      )

      expect_invoice_preview_totals(
        currency: "INR",
        subtotal: 300.0,
        total_due: 300.0
      )
      expect(page).not_to have_text("$300.00")

      save_invoice

      expect(page).to have_text("Invoice created successfully", wait: 10)

      response_body = JSON.parse(last_invoice_mutation_response.fetch("body"))
      invoice = Invoice.find_by!(invoice_number: "INV-INR-UI-001")

      expect(invoice.currency).to eq("INR")
      expect(response_body["currency"]).to eq("INR")
      expect(page).to have_current_path("/invoices/#{invoice.id}/edit", ignore_query: true, wait: 10)
      expect_invoice_preview_totals(
        currency: "INR",
        subtotal: 300.0,
        total_due: 300.0
      )
    end
  end

  it "shows a reopened draft invoice in the client's updated currency" do
    invoice = create(:invoice, company:, client:, status: :draft, currency: "USD", invoice_number: "INV-DRAFT-REOPEN-001")
    create(
      :invoice_line_item,
      invoice:,
      name: "Draft audit",
      description: "Currency refresh check",
      rate: 150,
      quantity: 120,
      date: Date.current
    )
    client.update!(currency: "EUR")

    with_forgery_protection do
      visit_invoice_editor(invoice)

      expect_invoice_preview_totals(
        currency: "EUR",
        subtotal: 300.0,
        total_due: 300.0
      )
      expect(page).not_to have_text("$300.00")
    end
  end
end
