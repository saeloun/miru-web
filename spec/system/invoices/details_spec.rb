# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Invoice detail view", type: :system, js: true do
  let(:company) { create(:company, name: "Wayne Enterprises", base_currency: "USD") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "Gotham City Council") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  it "shows the key details for a draft invoice" do
    invoice = create(:invoice,
      company:,
      client:,
      status: :draft,
      invoice_number: "INV-2024-001",
      issue_date: Date.new(2024, 1, 15),
      due_date: Date.new(2024, 2, 15))
    create(:invoice_line_item,
      invoice:,
      name: "Backend Development",
      description: "API integration work",
      rate: 150.00,
      quantity: 20,
      date: Date.new(2024, 1, 10),
      timesheet_entry: create(:timesheet_entry,
        user:,
        project: create(:project, client:),
        duration: 480.0,
        work_date: Date.new(2024, 1, 10)))

    with_forgery_protection do
      visit "/invoices/#{invoice.id}"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Invoice Number", wait: 10)
      expect(page).to have_content("#INV-2024-001", wait: 10)
      expect(page).to have_content("Gotham City Council", wait: 10)
      expect(page).to have_content("$50.00", wait: 10)
      expect(page).to have_content("Description", wait: 10)
        expect(page).to have_content("API integration work", wait: 10)
        expect(page).to have_content("Draft", wait: 10, normalize_ws: true)
      end
    end

    it "shows a compact client analytics summary on invoice details" do
      paid_invoice = create(:invoice,
        company:,
        client:,
        status: :paid,
        invoice_number: "INV-2024-010",
        amount: 1200.00,
        amount_paid: 1200.00,
        amount_due: 0,
        issue_date: Date.current - 30.days,
        due_date: Date.current - 10.days)
      create(:payment,
        invoice: paid_invoice,
        amount: 1200.00,
        base_currency_amount: 1200.00,
        status: :paid,
        transaction_date: Date.current - 15.days,
        transaction_type: :bank_transfer)

      invoice = create(:invoice,
        company:,
        client:,
        status: :draft,
        invoice_number: "INV-2024-011",
        amount: 800.00,
        amount_due: 800.00,
        issue_date: Date.current,
        due_date: Date.current + 15.days)

      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("CLIENT ANALYTICS", wait: 10)
        expect(page).to have_content("Total revenue", wait: 10)
        expect(page).to have_content("Average invoice", wait: 10)
        expect(page).to have_content("Payment cycle", wait: 10)
        expect(page).to have_content("Payment frequency", wait: 10)
      end
    end

  it "shows a zero subtotal when line items total to zero" do
    invoice = create(:invoice,
      company:,
      client:,
      status: :draft,
      invoice_number: "INV-2024-005",
      issue_date: Date.new(2024, 1, 15),
      due_date: Date.new(2024, 2, 15))
    create(:invoice_line_item,
      invoice:,
      name: "Pro bono support",
      description: "No-charge work",
      rate: 0.00,
      quantity: 60,
      date: Date.new(2024, 1, 10))

    with_forgery_protection do
      visit "/invoices/#{invoice.id}"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("INV-2024-005", wait: 10)
      expect(page).to have_content("$0.00", wait: 10)
    end
  end

  it "falls back to the stored amount when an invoice has no line items" do
    invoice = create(:invoice,
      company:,
      client:,
      status: :draft,
      invoice_number: "INV-2024-006",
      amount: 3500.00,
      amount_due: 3500.00,
      outstanding_amount: 3500.00,
      issue_date: Date.new(2024, 1, 15),
      due_date: Date.new(2024, 2, 15))

    with_forgery_protection do
      visit "/invoices/#{invoice.id}"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("INV-2024-006", wait: 10)
      expect(page).to have_content("3,500", wait: 10)
    end
  end

  {
    sent: "INV-2024-002",
    paid: "INV-2024-003"
  }.each do |status, invoice_number|
    it "shows #{status} status on invoice detail" do
      invoice = create(:invoice,
        company:,
        client:,
        status:,
        invoice_number:,
        amount: 3500.00,
        amount_due: status == :paid ? 0.00 : 3500.00,
        amount_paid: status == :paid ? 3500.00 : 0.00,
        outstanding_amount: status == :sent ? 3500.00 : 0.00,
        issue_date: Date.new(2024, 2, 1),
        due_date: Date.new(2024, 3, 1))

      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content(invoice_number, wait: 10)
        expect(page).to have_content(status.to_s.capitalize, wait: 10, normalize_ws: true)
      end
    end
  end

  it "opens the mark paid modal from the invoice detail page for sent invoices" do
    invoice = create(:invoice,
      company:,
      client:,
      status: :sent,
      invoice_number: "INV-2024-007",
      amount: 3500.00,
      amount_due: 3500.00,
      outstanding_amount: 3500.00,
      issue_date: Date.new(2024, 2, 1),
      due_date: Date.new(2024, 3, 1))

    with_forgery_protection do
      visit "/invoices/#{invoice.id}"

      expect(page).to have_css("#react-root", wait: 10)
      click_button "Mark as Paid"

      expect(page).to have_content("Mark Invoice As Paid", wait: 10)
      expect(page).to have_selector("#transactionDate", wait: 10)
      expect(page).to have_selector("#invoice", wait: 10)
    end
  end

  it "restricts employees from viewing invoice details" do
    employee = create(:user, current_workspace_id: company.id)
    invoice = create(:invoice,
      company:,
      client:,
      status: :draft,
      invoice_number: "INV-2024-004",
      amount: 1000.00,
      amount_due: 1000.00)
    create(:employment, company:, user: employee)
    employee.add_role :employee, company
    sign_in(employee)

    with_forgery_protection do
      visit "/invoices/#{invoice.id}"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).not_to have_content("INV-2024-004", wait: 5)
    end
  end
end
