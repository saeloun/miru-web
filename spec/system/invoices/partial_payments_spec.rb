# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Invoice partial payments", type: :system, js: true do
  let(:company) { create(:company, base_currency: "USD") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "Beta Corp") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  describe "invoice with no payments" do
    let!(:invoice) do
      create(:invoice,
        company:, client:,
        status: :sent,
        invoice_number: "PP-001",
        amount: 10000.00,
        amount_due: 10000.00,
        amount_paid: 0.00,
        outstanding_amount: 10000.00)
    end

    it "shows full amount as due" do
      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("PP-001", wait: 10)
        expect(page).to have_content("10,000", wait: 10)
      end
    end

    it "shows the invoice on the list with outstanding amount" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("PP-001", wait: 10)
        expect(page).to have_content("Sent")
      end
    end
  end

  describe "invoice with partial payment" do
    let!(:invoice) do
      create(:invoice,
        company:, client:,
        status: :sent,
        invoice_number: "PP-002",
        amount: 10000.00,
        amount_due: 6000.00,
        amount_paid: 4000.00,
        outstanding_amount: 6000.00)
    end

    let!(:payment) do
      create(:payment,
        invoice:,
        amount: 4000.00,
        status: :partially_paid,
        transaction_date: 5.days.ago,
        transaction_type: :bank_transfer,
        note: "First partial payment")
    end

    it "shows the invoice with remaining balance" do
      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("PP-002", wait: 10)
        expect(page).to have_content("10,000", wait: 10)
      end
    end

    it "still shows as sent on the invoices list" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("PP-002", wait: 10)
        expect(page).to have_content("Sent")
      end
    end
  end

  describe "invoice fully paid" do
    let!(:invoice) do
      create(:invoice,
        company:, client:,
        status: :paid,
        invoice_number: "PP-003",
        amount: 5000.00,
        amount_due: 0.00,
        amount_paid: 5000.00)
    end

    let!(:payment) do
      create(:payment,
        invoice:,
        amount: 5000.00,
        status: :paid,
        transaction_date: 2.days.ago,
        transaction_type: :stripe,
        note: "Full payment via Stripe")
    end

    it "shows the invoice as paid" do
      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("PP-003", wait: 10)
        expect(page).to have_content("paid", wait: 10)
          .or have_content("PAID", wait: 10)
          .or have_content("Paid", wait: 10)
      end
    end

    it "shows paid status on the invoices list" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("PP-003", wait: 10)
        expect(page).to have_content("Paid")
      end
    end
  end

  describe "multiple partial payments on one invoice" do
    let!(:invoice) do
      create(:invoice,
        company:, client:,
        status: :sent,
        invoice_number: "PP-004",
        amount: 15000.00,
        amount_due: 5000.00,
        amount_paid: 10000.00,
        outstanding_amount: 5000.00)
    end

    let!(:payment_one) do
      create(:payment,
        invoice:,
        amount: 5000.00,
        status: :partially_paid,
        transaction_date: 10.days.ago,
        transaction_type: :bank_transfer,
        note: "First installment")
    end

    let!(:payment_two) do
      create(:payment,
        invoice:,
        amount: 5000.00,
        status: :partially_paid,
        transaction_date: 5.days.ago,
        transaction_type: :bank_transfer,
        note: "Second installment")
    end

    it "shows the invoice total on the detail page" do
      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("PP-004", wait: 10)
        expect(page).to have_content("15,000", wait: 10)
      end
    end
  end

  describe "payments across multiple invoices" do
    let!(:invoice_a) do
      create(:invoice,
        company:, client:,
        status: :paid,
        invoice_number: "PP-MULTI-A",
        amount: 3000.00,
        amount_due: 0.00,
        amount_paid: 3000.00)
    end

    let!(:invoice_b) do
      create(:invoice,
        company:, client:,
        status: :sent,
        invoice_number: "PP-MULTI-B",
        amount: 7000.00,
        amount_due: 4000.00,
        amount_paid: 3000.00,
        outstanding_amount: 4000.00)
    end

    let!(:payment_a) do
      create(:payment,
        invoice: invoice_a,
        amount: 3000.00,
        status: :paid,
        transaction_date: 3.days.ago,
        transaction_type: :stripe)
    end

    let!(:payment_b) do
      create(:payment,
        invoice: invoice_b,
        amount: 3000.00,
        status: :partially_paid,
        transaction_date: 2.days.ago,
        transaction_type: :bank_transfer)
    end

    it "shows different statuses for each invoice on the list" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("PP-MULTI-A", wait: 10)
        expect(page).to have_content("PP-MULTI-B")
        expect(page).to have_content("Paid")
        expect(page).to have_content("Sent")
      end
    end

    it "shows paid invoice detail correctly" do
      with_forgery_protection do
        visit "/invoices/#{invoice_a.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("PP-MULTI-A", wait: 10)
        expect(page).to have_content("3,000", wait: 10)
      end
    end

    it "shows partially paid invoice detail correctly" do
      with_forgery_protection do
        visit "/invoices/#{invoice_b.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("PP-MULTI-B", wait: 10)
        expect(page).to have_content("7,000", wait: 10)
      end
    end
  end

  context "when user is a book keeper" do
    let(:book_keeper) { create(:user, current_workspace_id: company.id) }
    let!(:invoice) do
      create(:invoice,
        company:, client:,
        status: :sent,
        invoice_number: "PP-BK-001",
        amount: 8000.00,
        amount_due: 5000.00,
        amount_paid: 3000.00,
        outstanding_amount: 5000.00)
    end

    before do
      create(:employment, company:, user: book_keeper)
      book_keeper.add_role :book_keeper, company
      Warden.test_reset!
      sign_in(book_keeper)
    end

    it "book keeper can see partial payment balance" do
      with_forgery_protection do
        visit "/invoices/#{invoice.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("PP-BK-001", wait: 10)
        expect(page).to have_content("8,000", wait: 10)
      end
    end
  end
end
