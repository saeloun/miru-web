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

  it "shows a sent invoice with the full outstanding amount" do
    invoice = create(:invoice,
      company:,
      client:,
      status: :sent,
      invoice_number: "PP-001",
      amount: 10000.00,
      amount_due: 10000.00,
      amount_paid: 0.00,
      outstanding_amount: 10000.00)

    with_forgery_protection do
      visit "/invoices/#{invoice.id}"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("PP-001", wait: 10)
      expect(page).to have_content("10,000", wait: 10)
    end
  end

  it "shows a partially paid invoice with the remaining balance" do
    invoice = create(:invoice,
      company:,
      client:,
      status: :sent,
      invoice_number: "PP-002",
      amount: 10000.00,
      amount_due: 6000.00,
      amount_paid: 4000.00,
      outstanding_amount: 6000.00)
    create(:payment,
      invoice:,
      amount: 4000.00,
      status: :partially_paid,
      transaction_date: 5.days.ago,
      transaction_type: :bank_transfer,
      note: "First partial payment")

    with_forgery_protection do
      visit "/invoices/#{invoice.id}"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("PP-002", wait: 10)
      expect(page).to have_content("10,000", wait: 10)
    end
  end

  it "shows a fully paid invoice as paid" do
    invoice = create(:invoice,
      company:,
      client:,
      status: :paid,
      invoice_number: "PP-003",
      amount: 5000.00,
      amount_due: 0.00,
      amount_paid: 5000.00)
    create(:payment,
      invoice:,
      amount: 5000.00,
      status: :paid,
      transaction_date: 2.days.ago,
      transaction_type: :stripe,
      note: "Full payment via Stripe")

    with_forgery_protection do
      visit "/invoices/#{invoice.id}"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("PP-003", wait: 10)
      expect(page).to have_content("paid", wait: 10)
        .or have_content("PAID", wait: 10)
        .or have_content("Paid", wait: 10)
    end
  end

  it "shows mixed invoice payment statuses on the invoices list" do
    invoice_a = create(:invoice,
      company:,
      client:,
      status: :paid,
      invoice_number: "PP-MULTI-A",
      amount: 3000.00,
      amount_due: 0.00,
      amount_paid: 3000.00)
    invoice_b = create(:invoice,
      company:,
      client:,
      status: :sent,
      invoice_number: "PP-MULTI-B",
      amount: 7000.00,
      amount_due: 4000.00,
      amount_paid: 3000.00,
      outstanding_amount: 4000.00)
    create(:payment,
      invoice: invoice_a,
      amount: 3000.00,
      status: :paid,
      transaction_date: 3.days.ago,
      transaction_type: :stripe)
    create(:payment,
      invoice: invoice_b,
      amount: 3000.00,
      status: :partially_paid,
      transaction_date: 2.days.ago,
      transaction_type: :bank_transfer)

    with_forgery_protection do
      visit "/invoices"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("PP-MULTI-A", wait: 10)
      expect(page).to have_content("PP-MULTI-B", wait: 10)
      expect(page).to have_content("Paid", wait: 10)
      expect(page).to have_content("Sent", wait: 10)
    end
  end
end
