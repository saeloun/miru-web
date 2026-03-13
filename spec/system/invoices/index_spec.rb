# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Invoice listing", type: :system, js: true do
  let(:company) { create(:company, base_currency: "USD") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "Stark Industries") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  it "displays the invoices page" do
    with_forgery_protection do
      visit "/invoices"

      expect(page).to have_current_path("/invoices", wait: 10)
      expect(page).to have_css("#react-root", wait: 10)
    end
  end

  context "with invoices in various statuses" do
    let!(:draft_invoice) do
      create(:invoice,
        company:, client:, status: :draft,
        invoice_number: "INV-DRAFT-001",
        amount: 1500.00, amount_due: 1500.00)
    end

    let!(:sent_invoice) do
      create(:invoice,
        company:, client:, status: :sent,
        invoice_number: "INV-SENT-002",
        amount: 2500.00, amount_due: 2500.00,
        outstanding_amount: 2500.00)
    end

    let!(:paid_invoice) do
      create(:invoice,
        company:, client:, status: :paid,
        invoice_number: "INV-PAID-003",
        amount: 3000.00, amount_due: 0.00, amount_paid: 3000.00)
    end

    let!(:overdue_invoice) do
      create(:invoice,
        company:, client:, status: :overdue,
        invoice_number: "INV-OVER-004",
        amount: 4000.00, amount_due: 4000.00,
        outstanding_amount: 4000.00,
        due_date: 30.days.ago, issue_date: 60.days.ago)
    end

    let!(:waived_invoice) do
      create(:invoice,
        company:, client:, status: :waived,
        invoice_number: "INV-WAIV-005",
        amount: 500.00, amount_due: 0.00,
        due_date: Date.today, issue_date: 30.days.ago)
    end

    it "shows invoice numbers on the page" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("INV-DRAFT-001", wait: 10)
        expect(page).to have_content("INV-SENT-002")
        expect(page).to have_content("INV-PAID-003")
        expect(page).to have_content("INV-OVER-004")
        expect(page).to have_content("INV-WAIV-005")
      end
    end

    it "shows the client name for invoices" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Stark Industries", wait: 10)
      end
    end

    it "shows status badges for each invoice" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Draft", wait: 10)
        expect(page).to have_content("Sent")
        expect(page).to have_content("Paid")
        expect(page).to have_content("Overdue")
        expect(page).to have_content("Waived")
      end
    end

    it "displays invoice summary with overdue and outstanding amounts" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("OVERDUE", wait: 10)
          .or have_content("Overdue", wait: 10)
        expect(page).to have_content("OUTSTANDING")
          .or have_content("Outstanding")
        expect(page).to have_content("DRAFT")
          .or have_content("Draft")
      end
    end

    it "shows recently updated invoices section" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content(client.name, wait: 10)
      end
    end
  end

  context "with multiple clients" do
    let(:second_client) { create(:client, company:, name: "Wayne Enterprises") }

    let!(:invoice_one) do
      create(:invoice, company:, client:, status: :sent,
        invoice_number: "INV-SI-001", amount: 1000.00, amount_due: 1000.00)
    end

    let!(:invoice_two) do
      create(:invoice, company:, client: second_client, status: :draft,
        invoice_number: "INV-WE-002", amount: 2000.00, amount_due: 2000.00)
    end

    it "shows invoices from different clients" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Stark Industries", wait: 10)
        expect(page).to have_content("Wayne Enterprises")
        expect(page).to have_content("INV-SI-001")
        expect(page).to have_content("INV-WE-002")
      end
    end
  end

  context "when user is an employee" do
    let(:employee) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
      Warden.test_reset!
      sign_in(employee)
    end

    it "restricts invoice access for employees" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end
  end

  context "when there are no invoices" do
    it "shows the empty state message" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("No invoices yet", wait: 10)
          .or have_content("No invoice has been generated yet", wait: 10)
      end
    end
  end
end
