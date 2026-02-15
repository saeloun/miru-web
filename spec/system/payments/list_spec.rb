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

  it "displays the payments page" do
    with_forgery_protection do
      visit "/payments"

      expect(page).to have_current_path("/payments", wait: 10)
      expect(page).to have_css("#react-root", wait: 10)
    end
  end

  it "shows the Payments header" do
    with_forgery_protection do
      visit "/payments"

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

    it "shows payment invoice numbers" do
      with_forgery_protection do
        visit "/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("INV-PAY-001", wait: 10)
        expect(page).to have_content("INV-PAY-002")
      end
    end

    it "shows client names associated with payments" do
      with_forgery_protection do
        visit "/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Acme Corporation", wait: 10)
      end
    end

    it "shows payment notes" do
      with_forgery_protection do
        visit "/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Full payment received", wait: 10)
        expect(page).to have_content("Partial payment installment")
      end
    end

    it "shows payment status badges" do
      with_forgery_protection do
        visit "/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("PAID", wait: 10)
        expect(page).to have_content("PARTIAL")
      end
    end

    it "shows the Add Manual Entry button" do
      with_forgery_protection do
        visit "/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Add Manual Entry", wait: 10)
      end
    end
  end

  context "with payments from multiple clients" do
    let(:second_client) { create(:client, company:, name: "Globex Corp") }

    let!(:invoice_a) do
      create(:invoice,
        company:, client:, status: :sent,
        invoice_number: "INV-AC-100",
        amount: 2000.00, amount_due: 2000.00)
    end

    let!(:invoice_b) do
      create(:invoice,
        company:, client: second_client, status: :sent,
        invoice_number: "INV-GC-200",
        amount: 4000.00, amount_due: 4000.00)
    end

    let!(:payment_a) do
      create(:payment,
        invoice: invoice_a, amount: 2000.00, status: :paid,
        note: "Acme payment", transaction_date: Date.today)
    end

    let!(:payment_b) do
      create(:payment,
        invoice: invoice_b, amount: 4000.00, status: :paid,
        note: "Globex payment", transaction_date: Date.today)
    end

    it "shows payments from different clients" do
      with_forgery_protection do
        visit "/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Acme Corporation", wait: 10)
        expect(page).to have_content("Globex Corp")
        expect(page).to have_content("INV-AC-100")
        expect(page).to have_content("INV-GC-200")
      end
    end
  end

  context "with failed payment" do
    let!(:invoice) do
      create(:invoice,
        company:, client:, status: :sent,
        invoice_number: "INV-FAIL-001",
        amount: 1000.00, amount_due: 1000.00)
    end

    let!(:failed_payment) do
      create(:payment,
        invoice:, amount: 1000.00, status: :failed,
        note: "Payment declined by bank",
        transaction_date: Date.today)
    end

    it "shows failed payment status" do
      with_forgery_protection do
        visit "/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("INV-FAIL-001", wait: 10)
        expect(page).to have_content("FAILED")
        expect(page).to have_content("Payment declined by bank")
      end
    end
  end

  context "when user is an admin" do
    it "can access the payments page" do
      with_forgery_protection do
        visit "/payments"

        expect(page).to have_current_path("/payments", wait: 10)
        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Payments", wait: 10)
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

    it "does not allow employees to access payments" do
      with_forgery_protection do
        visit "/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).not_to have_content("Add Manual Entry", wait: 5)
      end
    end
  end

  context "when user is a book keeper" do
    let(:book_keeper) { create(:user, current_workspace_id: company.id) }

    let!(:bk_invoice) do
      create(:invoice,
        company:, client:, status: :sent,
        invoice_number: "INV-BK-PAY-001",
        amount: 6000.00, amount_due: 6000.00)
    end

    let!(:bk_payment) do
      create(:payment,
        invoice: bk_invoice, amount: 6000.00, status: :paid,
        note: "Book keeper visible payment",
        transaction_date: Date.today)
    end

    before do
      create(:employment, company:, user: book_keeper)
      book_keeper.add_role :book_keeper, company
      Warden.test_reset!
      sign_in(book_keeper)
    end

    it "allows book keeper to view payments" do
      with_forgery_protection do
        visit "/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("INV-BK-PAY-001", wait: 10)
        expect(page).to have_content("Acme Corporation")
      end
    end
  end

  context "when there are no payments" do
    it "shows the empty state message" do
      with_forgery_protection do
        visit "/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("No payments have been recorded yet", wait: 10)
      end
    end

    it "shows the Add Manual Entry button in the empty state" do
      with_forgery_protection do
        visit "/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("ADD MANUAL ENTRY", wait: 10)
      end
    end
  end
end
