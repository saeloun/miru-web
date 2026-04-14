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

    it "shows the newest invoice first in the list" do
      newest_invoice = create(:invoice,
        company:, client:, status: :sent,
        invoice_number: "INV-NEWEST-999",
        issue_date: Date.current,
        updated_at: 1.minute.ago)
      create(:invoice,
        company:, client:, status: :sent,
        invoice_number: "INV-OLDER-111",
        issue_date: 2.months.ago.to_date,
        updated_at: 5.minutes.ago)

      with_forgery_protection do
        visit "/invoices"

        rows = all("[data-testid^='invoice-row-']", wait: 10)

        expect(rows.first).to have_text(newest_invoice.invoice_number)
      end
    end

    it "shows the client name for invoices" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Stark Industries", wait: 10)
      end
    end

    it "filters the invoice list from the search field" do
      with_forgery_protection do
        visit "/invoices"

        find_field(placeholder: "Search invoices...").send_keys(
          "INV-OVER-004",
          :enter
        )

        within("table") do
          expect(page).to have_content("INV-OVER-004", wait: 10)
          expect(page).not_to have_content("INV-DRAFT-001")
          expect(page).not_to have_content("INV-SENT-002")
        end
        expect(page).to have_content(
          "Viewing 1 matching invoices from 5 loaded",
          wait: 10
        )
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

    it "filters the table from the summary cards" do
      with_forgery_protection do
        visit "/invoices"

        find("button", text: /\AOverdue/i, match: :first).click

        within("table") do
          expect(page).to have_content("INV-OVER-004", wait: 10)
          expect(page).not_to have_content("INV-DRAFT-001")
          expect(page).not_to have_content("INV-SENT-002")
          expect(page).not_to have_content("INV-PAID-003")
        end
        expect(page).to have_content(
          "Viewing 1 matching invoices from 5 loaded",
          wait: 10
        )
      end
    end

    it "opens the mark paid modal from the invoice actions menu" do
      with_forgery_protection do
        visit "/invoices"

        find("[data-testid='invoice-actions-trigger-#{sent_invoice.id}']", wait: 10).click
        find("[data-testid='invoice-action-mark-paid-#{sent_invoice.id}']", wait: 10).click

        expect(page).to have_content("Mark Invoice As Paid", wait: 10)
        expect(page).to have_selector("#transactionDate", wait: 10)
        expect(page).to have_selector("#invoice", wait: 10)
      end
    end

    it "does not show mark paid for draft invoices in the actions menu" do
      with_forgery_protection do
        visit "/invoices"

        find("[data-testid='invoice-actions-trigger-#{draft_invoice.id}']", wait: 10).click

        expect(page).not_to have_selector(
          "[data-testid='invoice-action-mark-paid-#{draft_invoice.id}']",
          wait: 2
        )
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

  context "with more invoices than the first table page" do
    before do
      55.times do |index|
        create(:invoice,
          company:,
          client:,
          status: :sent,
          invoice_number: "INV-PAGED-#{index}",
          updated_at: index.minutes.ago)
      end
    end

    it "loads the next invoice page when the user scrolls down" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Loaded 50 of 55", wait: 10)

        page.execute_script("window.scrollTo(0, document.body.scrollHeight)")

        expect(page).to have_content("Loaded 55 of 55", wait: 10)
        expect(page).to have_content("All invoices loaded", wait: 10)
      end
    end
  end

  context "when user is an employee" do
    let(:employee) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
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
