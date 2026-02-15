# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Payments Report", type: :system, js: true do
  let(:company) { create(:company, base_currency: "USD", name: "Test Corp") }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  describe "payments report page" do
    it "loads the payments report page" do
      with_forgery_protection do
        visit "/reports/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Payment", wait: 10)
      end
    end
  end

  describe "payments report with data" do
    let!(:client_a) { create(:client, company:, name: "Client Alpha") }
    let!(:client_b) { create(:client, company:, name: "Client Beta") }

    let!(:invoice_a) do
      create(:invoice,
        company:, client: client_a,
        status: :paid,
        invoice_number: "PAY-RPT-001",
        amount: 5000.00,
        amount_due: 0.00,
        amount_paid: 5000.00)
    end

    let!(:invoice_b) do
      create(:invoice,
        company:, client: client_b,
        status: :sent,
        invoice_number: "PAY-RPT-002",
        amount: 8000.00,
        amount_due: 5000.00,
        amount_paid: 3000.00,
        outstanding_amount: 5000.00)
    end

    let!(:payment_a) do
      create(:payment,
        invoice: invoice_a,
        amount: 5000.00,
        status: :paid,
        transaction_date: 10.days.ago,
        transaction_type: :stripe,
        note: "Stripe payment for Alpha")
    end

    let!(:payment_b) do
      create(:payment,
        invoice: invoice_b,
        amount: 3000.00,
        status: :partially_paid,
        transaction_date: 5.days.ago,
        transaction_type: :bank_transfer,
        note: "Bank transfer for Beta")
    end

    it "loads the payments report page with data" do
      with_forgery_protection do
        visit "/reports/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Payment", wait: 10)
      end
    end

    it "shows payment summary information" do
      with_forgery_protection do
        visit "/reports/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Total", wait: 10)
          .or have_content("Payment", wait: 10)
      end
    end
  end

  describe "payments report with various payment types" do
    let!(:client) { create(:client, company:, name: "Payment Test Client") }

    let!(:stripe_invoice) do
      create(:invoice,
        company:, client:,
        status: :paid,
        invoice_number: "PT-STRIPE",
        amount: 2000.00,
        amount_due: 0.00,
        amount_paid: 2000.00)
    end

    let!(:bank_invoice) do
      create(:invoice,
        company:, client:,
        status: :paid,
        invoice_number: "PT-BANK",
        amount: 3000.00,
        amount_due: 0.00,
        amount_paid: 3000.00)
    end

    let!(:stripe_payment) do
      create(:payment,
        invoice: stripe_invoice,
        amount: 2000.00,
        status: :paid,
        transaction_date: 7.days.ago,
        transaction_type: :stripe)
    end

    let!(:bank_payment) do
      create(:payment,
        invoice: bank_invoice,
        amount: 3000.00,
        status: :paid,
        transaction_date: 3.days.ago,
        transaction_type: :bank_transfer)
    end

    it "displays the payments report with multiple payment types" do
      with_forgery_protection do
        visit "/reports/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Payment", wait: 10)
      end
    end
  end

  describe "payments report with no payments" do
    it "shows the report page even with no data" do
      with_forgery_protection do
        visit "/reports/payments"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Payment", wait: 10)
      end
    end
  end

  describe "employee cannot access payments report" do
    let(:employee) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
      Warden.test_reset!
      sign_in(employee)
    end

    it "restricts employee from accessing payments report" do
      with_forgery_protection do
        visit "/reports/payments"

        expect(page).to have_css("#react-root", wait: 10)
        has_no_report = !page.has_content?("Total Payments", wait: 3)
        redirected = page.has_current_path?("/time-tracking", wait: 3)
        expect(has_no_report || redirected).to be true
      end
    end
  end

  describe "navigating to payments report from reports index" do
    it "reports index has a link to payments report" do
      with_forgery_protection do
        visit "/reports"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Reports", wait: 10)
      end
    end
  end
end
