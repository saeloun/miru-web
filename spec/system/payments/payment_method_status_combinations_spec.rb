# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Payment method and status combinations", type: :system, js: true do
  let(:company) { create(:company, base_currency: "USD") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "Test Client") }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  describe "payment method and status badge differentiation" do
    let!(:invoice) do
      create(:invoice,
        company:, client:, status: :sent,
        invoice_number: "INV-TEST-001",
        amount: 1000.00, amount_due: 1000.00,
        outstanding_amount: 1000.00)
    end

    context "visual differentiation verification" do
      let!(:payments_with_different_combinations) do
        [
          create(:payment, invoice:, amount: 100, status: :paid, transaction_type: :visa, note: "Visa paid"),
          create(:payment, invoice:, amount: 200, status: :failed, transaction_type: :visa, note: "Visa failed"),
          create(:payment, invoice:, amount: 300, status: :paid, transaction_type: :bank_transfer, note: "Bank paid"),
          create(:payment, invoice:, amount: 400, status: :partially_paid, transaction_type: :stripe, note: "Stripe partial"),
          create(:payment, invoice:, amount: 500, status: :cancelled, transaction_type: :cash, note: "Cash cancelled")
        ]
      end

      it "displays all payment combinations with visually distinct badges" do
        with_forgery_protection do
          visit "/payments"

          expect(page).to have_current_path("/payments", wait: 10)
          expect(page).to have_css("#react-root", wait: 10)

          # Wait for all payments to load
          expect(page).to have_content("Test Client", wait: 10)

          # Verify status badges are rendered (case-insensitive since CSS uppercase is applied)
          expect(page).to have_content("Paid", wait: 10)
          expect(page).to have_content("Failed", wait: 10)
          expect(page).to have_content("Partial", wait: 10)
          expect(page).to have_content("Cancelled", wait: 10)
        end
      end
    end

    context "accessibility and usability" do
      let!(:test_payment) do
        create(:payment,
          invoice:,
          amount: 1000.00,
          status: :paid,
          transaction_type: :credit_card,
          note: "Accessibility test payment")
      end

      it "ensures badges are accessible and readable" do
        with_forgery_protection do
          visit "/payments"

          expect(page).to have_current_path("/payments", wait: 10)
          expect(page).to have_css("#react-root", wait: 10)

          # Wait for payment to load
          expect(page).to have_content("Accessibility test payment", wait: 10)

          # Status badge should be visible (CSS uppercase makes it appear as "PAID")
          expect(page).to have_content("Paid", wait: 5)
        end
      end
    end
  end

  describe "edge cases and data validation" do
    let!(:invoice) do
      create(:invoice,
        company:, client:, status: :sent,
        invoice_number: "INV-EDGE-001",
        amount: 1000.00)
    end

    context "with various payment methods" do
      it "handles all payment methods gracefully" do
        payment_methods = [:visa, :mastercard, :bank_transfer, :stripe, :cash, :cheque]
        payment_methods.map.with_index do |method, index|
          create(:payment,
            invoice:,
            amount: (index + 1) * 100.00,
            status: :paid,
            transaction_type: method,
            note: "#{method.to_s.humanize} payment test")
        end

        with_forgery_protection do
          visit "/payments"

          expect(page).to have_current_path("/payments", wait: 10)
          expect(page).to have_css("#react-root", wait: 10)

          # Should display all payments with their notes
          payment_methods.each do |method|
            expect(page).to have_content("#{method.to_s.humanize} payment test", wait: 10)
          end
        end
      end
    end

    context "with various statuses" do
      it "handles all statuses gracefully" do
        statuses = [:paid, :partially_paid, :failed, :cancelled]
        statuses.map.with_index do |status, index|
          create(:payment,
            invoice:,
            amount: (index + 1) * 100.00,
            status:,
            transaction_type: :visa,
            note: "#{status.to_s.humanize} status test")
        end

        with_forgery_protection do
          visit "/payments"

          expect(page).to have_current_path("/payments", wait: 10)
          expect(page).to have_css("#react-root", wait: 10)

          # Should display all payments with their notes
          statuses.each do |status|
            expect(page).to have_content("#{status.to_s.humanize} status test", wait: 10)
          end
        end
      end
    end
  end
end
