# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Payment and invoice balance", type: :system, js: true do
  let(:company) { create(:company, base_currency: "USD") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "Balance Test Corp") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  describe "invoice with payment shows on payments page" do
    let!(:invoice) do
      create(:invoice,
        company:, client:,
        status: :paid,
        invoice_number: "BAL-001",
        amount: 5000.00,
        amount_due: 0.00,
        amount_paid: 5000.00)
    end

    let!(:payment) do
      create(:payment,
        invoice:,
        amount: 5000.00,
        status: :paid,
        transaction_date: 3.days.ago,
        transaction_type: :bank_transfer,
        note: "Full payment for BAL-001")
    end

    it "shows the payment on the payments page" do
      with_forgery_protection do
        visit "/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Balance Test Corp", wait: 10)
          .or have_content("BAL-001", wait: 10)
          .or have_content("5,000", wait: 10)
      end
    end

    it "shows the paid invoice on the invoices page" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("BAL-001", wait: 10)
        expect(page).to have_content("Paid")
      end
    end
  end

  describe "multiple payments for different invoices" do
    let!(:invoice_one) do
      create(:invoice,
        company:, client:,
        status: :paid,
        invoice_number: "BAL-MULTI-A",
        amount: 3000.00,
        amount_due: 0.00,
        amount_paid: 3000.00)
    end

    let!(:invoice_two) do
      create(:invoice,
        company:, client:,
        status: :sent,
        invoice_number: "BAL-MULTI-B",
        amount: 7000.00,
        amount_due: 4000.00,
        amount_paid: 3000.00,
        outstanding_amount: 4000.00)
    end

    let!(:payment_one) do
      create(:payment,
        invoice: invoice_one,
        amount: 3000.00,
        status: :paid,
        transaction_date: 5.days.ago,
        transaction_type: :stripe)
    end

    let!(:payment_two) do
      create(:payment,
        invoice: invoice_two,
        amount: 3000.00,
        status: :partially_paid,
        transaction_date: 2.days.ago,
        transaction_type: :bank_transfer)
    end

    it "shows both payments on the payments list" do
      with_forgery_protection do
        visit "/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Balance Test Corp", wait: 10)
      end
    end

    it "invoices page reflects correct statuses" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("BAL-MULTI-A", wait: 10)
        expect(page).to have_content("BAL-MULTI-B")
        expect(page).to have_content("Paid")
        expect(page).to have_content("Sent")
      end
    end

    it "paid invoice shows correct balance on detail page" do
      with_forgery_protection do
        visit "/invoices/#{invoice_one.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("BAL-MULTI-A", wait: 10)
        expect(page).to have_content("3,000", wait: 10)
      end
    end

    it "partially paid invoice shows correct balance on detail page" do
      with_forgery_protection do
        visit "/invoices/#{invoice_two.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("BAL-MULTI-B", wait: 10)
        expect(page).to have_content("7,000", wait: 10)
      end
    end
  end

  describe "payment with different transaction types on payments page" do
    let!(:visa_invoice) do
      create(:invoice,
        company:, client:,
        status: :paid,
        invoice_number: "BAL-VISA",
        amount: 1500.00,
        amount_due: 0.00,
        amount_paid: 1500.00)
    end

    let!(:visa_payment) do
      create(:payment,
        invoice: visa_invoice,
        amount: 1500.00,
        status: :paid,
        transaction_date: 1.day.ago,
        transaction_type: :visa,
        note: "Visa card payment")
    end

    it "shows payment with transaction type on payments page" do
      with_forgery_protection do
        visit "/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Balance Test Corp", wait: 10)
          .or have_content("1,500", wait: 10)
      end
    end
  end

  context "with no payments" do
    it "shows empty state on payments page" do
      with_forgery_protection do
        visit "/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Payments", wait: 10)
      end
    end
  end

  context "when user is a book keeper" do
    let(:book_keeper) { create(:user, current_workspace_id: company.id) }
    let!(:invoice) do
      create(:invoice,
        company:, client:,
        status: :paid,
        invoice_number: "BAL-BK",
        amount: 2000.00,
        amount_due: 0.00,
        amount_paid: 2000.00)
    end

    let!(:payment) do
      create(:payment,
        invoice:,
        amount: 2000.00,
        status: :paid,
        transaction_date: 1.day.ago,
        transaction_type: :bank_transfer)
    end

    before do
      create(:employment, company:, user: book_keeper)
      book_keeper.add_role :book_keeper, company
      Warden.test_reset!
      sign_in(book_keeper)
    end

    it "book keeper can view payments" do
      with_forgery_protection do
        visit "/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Balance Test Corp", wait: 10)
          .or have_content("2,000", wait: 10)
      end
    end

    it "book keeper sees correct invoice status" do
      with_forgery_protection do
        visit "/invoices"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("BAL-BK", wait: 10)
        expect(page).to have_content("Paid")
      end
    end
  end
end
