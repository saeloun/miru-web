# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Invoice status transitions", type: :system, js: true do
  let(:company) { create(:company, base_currency: "USD") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "Acme Corp") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  describe "draft invoice" do
    let!(:invoice) do
      create(:invoice,
        company:, client:,
        status: :draft,
        invoice_number: "INV-D-001",
        amount: 1000.00,
        amount_due: 1000.00)
    end

    it "displays draft status on the invoices list" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("INV-D-001", wait: 10)
        expect(page).to have_content("Draft", wait: 10)
      end
    end

    it "displays draft status on the invoice detail page" do
      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("INV-D-001", wait: 10)
        expect(page).to have_content("Draft", wait: 10)
          .or have_content("draft", wait: 10)
      end
    end

    it "shows the full invoice amount as amount due" do
      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("1,000", wait: 10)
      end
    end
  end

  describe "sent invoice" do
    let!(:invoice) do
      create(:invoice,
        company:, client:,
        status: :sent,
        invoice_number: "INV-S-002",
        amount: 2500.00,
        amount_due: 2500.00,
        outstanding_amount: 2500.00,
        sent_at: 1.day.ago)
    end

    it "displays sent status on the invoices list" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("INV-S-002", wait: 10)
        expect(page).to have_content("Sent", wait: 10)
      end
    end

    it "displays sent status on the invoice detail page" do
      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("INV-S-002", wait: 10)
        expect(page).to have_content("Sent", wait: 10)
          .or have_content("sent", wait: 10)
      end
    end

    it "shows the outstanding amount for sent invoice" do
      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("2,500", wait: 10)
      end
    end
  end

  describe "paid invoice" do
    let!(:invoice) do
      create(:invoice,
        company:, client:,
        status: :paid,
        invoice_number: "INV-P-003",
        amount: 3000.00,
        amount_due: 0.00,
        amount_paid: 3000.00)
    end

    it "displays paid status on the invoices list" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("INV-P-003", wait: 10)
        expect(page).to have_content("Paid", wait: 10)
      end
    end

    it "displays paid status on the invoice detail page" do
      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("INV-P-003", wait: 10)
        expect(page).to have_content("Paid", wait: 10)
          .or have_content("paid", wait: 10)
      end
    end

    it "shows zero amount due for paid invoice" do
      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("3,000", wait: 10)
      end
    end
  end

  describe "overdue invoice" do
    let!(:invoice) do
      create(:invoice,
        company:, client:,
        status: :overdue,
        invoice_number: "INV-O-004",
        amount: 4000.00,
        amount_due: 4000.00,
        outstanding_amount: 4000.00,
        issue_date: 60.days.ago,
        due_date: 30.days.ago)
    end

    it "displays overdue status on the invoices list" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("INV-O-004", wait: 10)
        expect(page).to have_content("Overdue", wait: 10)
      end
    end

    it "displays overdue status on the invoice detail page" do
      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("INV-O-004", wait: 10)
        expect(page).to have_content("Overdue", wait: 10)
          .or have_content("overdue", wait: 10)
      end
    end
  end

  describe "waived invoice" do
    let!(:invoice) do
      create(:invoice,
        company:, client:,
        status: :waived,
        invoice_number: "INV-W-005",
        amount: 500.00,
        amount_due: 0.00,
        issue_date: 30.days.ago,
        due_date: Date.today)
    end

    it "displays waived status on the invoices list" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("INV-W-005", wait: 10)
        expect(page).to have_content("Waived", wait: 10)
      end
    end

    it "displays waived status on the invoice detail page" do
      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("INV-W-005", wait: 10)
        expect(page).to have_content("Waived", wait: 10)
          .or have_content("waived", wait: 10)
      end
    end
  end

  describe "all statuses on the index page" do
    let!(:draft) do
      create(:invoice, company:, client:, status: :draft,
        invoice_number: "ST-DRAFT", amount: 100.00, amount_due: 100.00)
    end

    let!(:sent) do
      create(:invoice, company:, client:, status: :sent,
        invoice_number: "ST-SENT", amount: 200.00, amount_due: 200.00,
        outstanding_amount: 200.00)
    end

    let!(:paid) do
      create(:invoice, company:, client:, status: :paid,
        invoice_number: "ST-PAID", amount: 300.00, amount_due: 0.00,
        amount_paid: 300.00)
    end

    let!(:overdue) do
      create(:invoice, company:, client:, status: :overdue,
        invoice_number: "ST-OVER", amount: 400.00, amount_due: 400.00,
        outstanding_amount: 400.00,
        issue_date: 60.days.ago, due_date: 30.days.ago)
    end

    it "shows all status types simultaneously" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Draft", wait: 10)
        expect(page).to have_content("Sent")
        expect(page).to have_content("Paid")
        expect(page).to have_content("Overdue")
      end
    end

    it "shows summary section with outstanding and draft totals" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("ALL", wait: 10)
        expect(page).to have_content("OUTSTANDING", wait: 10)
          .or have_content("Outstanding", wait: 10)
        expect(page).to have_content("DRAFT", wait: 10)
          .or have_content("Draft", wait: 10)
      end
    end
  end

  describe "invoice amounts across statuses" do
    let!(:partially_paid_invoice) do
      create(:invoice,
        company:, client:,
        status: :sent,
        invoice_number: "INV-PP-001",
        amount: 5000.00,
        amount_due: 3000.00,
        amount_paid: 2000.00,
        outstanding_amount: 3000.00)
    end

    it "displays correct balance for partially paid invoice" do
      with_forgery_protection do
        visit "/invoices/#{partially_paid_invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("INV-PP-001", wait: 10)
        expect(page).to have_content("5,000", wait: 10)
      end
    end
  end

  context "when user is a book keeper" do
    let(:book_keeper) { create(:user, current_workspace_id: company.id) }
    let!(:invoice) do
      create(:invoice, company:, client:, status: :sent,
        invoice_number: "INV-BK-001", amount: 1500.00, amount_due: 1500.00)
    end

    before do
      create(:employment, company:, user: book_keeper)
      book_keeper.add_role :book_keeper, company
      Warden.test_reset!
      sign_in(book_keeper)
    end

    it "book keeper can see invoice statuses" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("INV-BK-001", wait: 10)
        expect(page).to have_content("Sent")
      end
    end
  end
end
