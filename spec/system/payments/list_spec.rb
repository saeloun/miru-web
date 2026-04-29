# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Payments page", type: :system, js: true do
  let(:company) { create(:company, base_currency: "USD") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "Acme Corporation") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  it "renders payments path and header" do
    with_forgery_protection do
      visit "/payments"

      expect(page).to have_current_path("/payments", wait: 10)
      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Payments", wait: 10)
    end
  end

  context "with payment records" do
    let!(:sent_invoice) do
      create(:invoice,
        company:, client:, status: :sent,
        invoice_number: "INV-PAY-001",
        amount: 5000.00, amount_due: 5000.00,
        outstanding_amount: 5000.00)
    end

    let!(:second_invoice) do
      create(:invoice,
        company:, client:, status: :sent,
        invoice_number: "INV-PAY-002",
        amount: 3000.00, amount_due: 3000.00,
        outstanding_amount: 3000.00)
    end

    let!(:payment_one) do
      create(:payment,
        invoice: sent_invoice,
        amount: 5000.00,
        status: :paid,
        note: "Full payment received",
        transaction_date: Date.today,
        transaction_type: :credit_card)
    end

    let!(:payment_two) do
      create(:payment,
        invoice: second_invoice,
        amount: 1500.00,
        status: :partially_paid,
        note: "Partial payment installment",
        transaction_date: 3.days.ago,
        transaction_type: :bank_transfer)
    end

    let!(:failed_invoice) do
      create(:invoice,
        company:, client:, status: :sent,
        invoice_number: "INV-FAIL-001",
        amount: 1000.00, amount_due: 1000.00)
    end

    let!(:failed_payment) do
      create(:payment,
        invoice: failed_invoice, amount: 1000.00, status: :failed,
        note: "Payment declined by bank",
        transaction_date: Date.today)
    end

    it "shows core payment scenarios in one pass", :aggregate_failures do
      with_forgery_protection do
        visit "/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("INV-PAY-001", wait: 10)
        expect(page).to have_content("INV-PAY-002")
        expect(page).to have_content("Acme Corporation")
        expect(page).to have_content("Full payment received")
        expect(page).to have_content("Partial payment installment")
        expect(page).to have_content("Paid")
        expect(page).to have_content("Partially Paid")
        expect(page).to have_content("Failed")
        expect(page).to have_content("Payment declined by bank")
        expect(page).to have_content("ADD MANUAL ENTRY")
      end
    end

    it "shows transaction type options in the manual entry modal" do
      with_forgery_protection do
        visit "/payments?invoiceId=#{sent_invoice.id}"

        find("button", text: "ADD MANUAL ENTRY", match: :first, wait: 10).click
        within("#transactionType") do
          find("button", text: "Select Transaction Type", match: :first, wait: 10).click
        end

        expect(page).to have_css("[role='option']", text: "Bank Transfer", wait: 10)
        expect(page).to have_css("[role='option']", text: "Credit Card", wait: 10)
      end
    end
  end

  context "when there are no payments" do
    it "shows empty state and manual entry CTA", :aggregate_failures do
      with_forgery_protection do
        visit "/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content(
          "No payments have been recorded yet",
          wait: 10
        )
        expect(page).to have_content("ADD MANUAL ENTRY", wait: 10)
      end
    end
  end

  context "with more payments than the first batch" do
    before do
      26.times do |index|
        invoice = create(:invoice,
          company:,
          client:,
          status: :sent,
          invoice_number: "INV-BATCH-#{index}",
          amount: 1000.00 + index,
          amount_due: 1000.00 + index,
          outstanding_amount: 1000.00 + index)

        create(:payment,
          invoice:,
          amount: 1000.00 + index,
          status: :paid,
          transaction_date: index.days.ago,
          note: "Payment #{index}")
      end
    end

    it "shows the scroll affordance for additional payments" do
      with_forgery_protection do
        visit "/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Showing 25 of 26", wait: 10)
        expect(page).to have_content("Scroll to load more payments", wait: 10)
      end
    end

    it "shows localized payment counts in Gujarati", :aggregate_failures do
      user.update!(locale: "gu")

      with_forgery_protection do
        visit "/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("ચુકવણીઓ", wait: 10)
        expect(page).to have_content("26 માંથી 25 બતાવી રહ્યું છે", wait: 10)
        expect(page).to have_content("મેન્યુઅલ એન્ટ્રી ઉમેરો", wait: 10)
      end
    end
  end

  context "with Razorpay withdrawals" do
    let(:company) { create(:india_company, base_currency: "INR") }
    let(:client) { create(:client, company:, currency: "INR", name: "Razorpay Client") }
    let!(:not_withdrawn_invoice) do
      create(
        :invoice,
        company:,
        client:,
        currency: "INR",
        status: :paid,
        invoice_number: "INV-RZP-001",
        amount: 1200.00,
        amount_due: 0.00,
        amount_paid: 1200.00
      )
    end
    let!(:queued_invoice) do
      create(
        :invoice,
        company:,
        client:,
        currency: "INR",
        status: :paid,
        invoice_number: "INV-RZP-002",
        amount: 800.00,
        amount_due: 0.00,
        amount_paid: 800.00
      )
    end
    let!(:failed_invoice) do
      create(
        :invoice,
        company:,
        client:,
        currency: "INR",
        status: :paid,
        invoice_number: "INV-RZP-003",
        amount: 900.00,
        amount_due: 0.00,
        amount_paid: 900.00
      )
    end
    let!(:not_withdrawn_payment) do
      create(
        :payment,
        invoice: not_withdrawn_invoice,
        amount: 1200.00,
        transaction_type: :razorpay,
        payment_currency: "INR",
        transaction_date: Date.current,
        note: "Razorpay no payout"
      )
    end
    let!(:queued_payment) do
      create(
        :payment,
        invoice: queued_invoice,
        amount: 800.00,
        transaction_type: :razorpay,
        payment_currency: "INR",
        transaction_date: Date.current,
        note: "Razorpay queued payout"
      )
    end
    let!(:failed_payment) do
      create(
        :payment,
        invoice: failed_invoice,
        amount: 900.00,
        transaction_type: :razorpay,
        payment_currency: "INR",
        transaction_date: Date.current,
        note: "Razorpay failed payout"
      )
    end

    before do
      create(:razorpay_payout, payment: queued_payment, status: :queued)
      create(:razorpay_payout, payment: failed_payment, status: :failed)
    end

    it "shows withdrawal status and manual withdrawal actions" do
      with_forgery_protection do
        visit "/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("INV-RZP-001", wait: 10)
        expect(page).to have_content("INV-RZP-002")
        expect(page).to have_content("INV-RZP-003")
        expect(page).to have_content("Razorpay")
        expect(page).to have_content("Not withdrawn")
        expect(page).to have_content("Queued")
        expect(page).to have_content("Failed")

        find("[data-testid='payment-actions-trigger-#{not_withdrawn_payment.id}']").click
        expect(page).to have_css(
          "[data-testid='payment-action-withdraw-#{not_withdrawn_payment.id}']",
          text: "Withdraw to UPI",
          wait: 10
        )

        visit "/payments"
        expect(page).to have_css(
          "[data-testid='payment-actions-trigger-#{failed_payment.id}']",
          wait: 10
        )
        find("[data-testid='payment-actions-trigger-#{failed_payment.id}']").click
        expect(page).to have_css(
          "[data-testid='payment-action-withdraw-#{failed_payment.id}']",
          text: "Retry withdrawal",
          wait: 10
        )
      end
    end
  end

  context "role access" do
    let(:employee) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
      sign_in(employee)
    end

    it "blocks manual payment entry for employee" do
      with_forgery_protection do
        visit "/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).not_to have_content("ADD MANUAL ENTRY", wait: 5)
        expect(page).to have_current_path("/time-tracking", wait: 10)
      end
    end
  end
end
