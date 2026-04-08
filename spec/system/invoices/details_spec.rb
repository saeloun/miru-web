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
      amount: 5000.00,
      amount_due: 5000.00,
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
      expect(page).to have_content("5,000", wait: 10)
      expect(page).to have_content("Description", wait: 10)
      expect(page).to have_content("API integration work", wait: 10)
      expect(page).to have_content("Draft", wait: 10, normalize_ws: true)
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
