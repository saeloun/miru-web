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

  context "when admin views a draft invoice" do
    let!(:invoice) do
      create(:invoice,
        company:, client:,
        status: :draft,
        invoice_number: "INV-2024-001",
        amount: 5000.00,
        amount_due: 5000.00,
        issue_date: Date.new(2024, 1, 15),
        due_date: Date.new(2024, 2, 15))
    end

    let!(:line_item_one) do
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
    end

    let!(:line_item_two) do
      create(:invoice_line_item,
        invoice:,
        name: "Frontend Development",
        description: "React component work",
        rate: 125.00,
        quantity: 16,
        date: Date.new(2024, 1, 12),
        timesheet_entry: create(:timesheet_entry,
          user:,
          project: create(:project, client:),
          duration: 480.0,
          work_date: Date.new(2024, 1, 12)))
    end

    it "loads the invoice detail page" do
      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "shows the invoice number" do
      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("INV-2024-001", wait: 10)
      end
    end

    it "shows the client name" do
      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Gotham City Council", wait: 10)
      end
    end

    it "shows the invoice amount" do
      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("5,000", wait: 10)
      end
    end

    it "shows line item names" do
      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Backend Development", wait: 10)
        expect(page).to have_content("Frontend Development", wait: 10)
      end
    end

    it "shows line item descriptions" do
      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("API integration work", wait: 10)
        expect(page).to have_content("React component work", wait: 10)
      end
    end

    it "shows the invoice status" do
      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("draft", wait: 10, normalize_ws: true)
      end
    end
  end

  context "when admin views a sent invoice" do
    let!(:sent_invoice) do
      create(:invoice,
        company:, client:,
        status: :sent,
        invoice_number: "INV-2024-002",
        amount: 3500.00,
        amount_due: 3500.00,
        outstanding_amount: 3500.00,
        issue_date: Date.new(2024, 2, 1),
        due_date: Date.new(2024, 3, 1))
    end

    it "shows the sent status" do
      with_forgery_protection do
        visit "/invoices/#{sent_invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("INV-2024-002", wait: 10)
        expect(page).to have_content("sent", wait: 10, normalize_ws: true)
      end
    end
  end

  context "when admin views a paid invoice" do
    let!(:paid_invoice) do
      create(:invoice,
        company:, client:,
        status: :paid,
        invoice_number: "INV-2024-003",
        amount: 2000.00,
        amount_due: 0.00,
        amount_paid: 2000.00,
        issue_date: Date.new(2024, 1, 1),
        due_date: Date.new(2024, 2, 1))
    end

    it "shows the paid status" do
      with_forgery_protection do
        visit "/invoices/#{paid_invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("INV-2024-003", wait: 10)
        expect(page).to have_content("paid", wait: 10, normalize_ws: true)
      end
    end
  end

  context "when employee tries to view an invoice" do
    let(:employee) { create(:user, current_workspace_id: company.id) }
    let!(:invoice) do
      create(:invoice,
        company:, client:,
        status: :draft,
        invoice_number: "INV-2024-004",
        amount: 1000.00,
        amount_due: 1000.00)
    end

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
      Warden.test_reset!
      sign_in(employee)
    end

    it "restricts access to the invoice detail page" do
      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).not_to have_content("INV-2024-004", wait: 5)
      end
    end
  end

  context "when book keeper views an invoice" do
    let(:book_keeper) { create(:user, current_workspace_id: company.id) }
    let!(:invoice) do
      create(:invoice,
        company:, client:,
        status: :sent,
        invoice_number: "INV-2024-005",
        amount: 7500.00,
        amount_due: 7500.00,
        outstanding_amount: 7500.00)
    end

    before do
      create(:employment, company:, user: book_keeper)
      book_keeper.add_role :book_keeper, company
      Warden.test_reset!
      sign_in(book_keeper)
    end

    it "allows viewing the invoice details" do
      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("INV-2024-005", wait: 10)
        expect(page).to have_content("Gotham City Council", wait: 10)
      end
    end
  end
end
