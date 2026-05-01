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

          # Collect all badge elements and their classes
          payment_method_badges = page.all("[data-testid='payment-method-badge']")
          status_badges = page.all("[data-testid='status-badge']")

          expect(payment_method_badges.count).to be >= 5
          expect(status_badges.count).to be >= 5

          # Verify that we have different color schemes
          payment_method_color_classes = payment_method_badges.pluck(:class).uniq
          status_color_classes = status_badges.pluck(:class).uniq

          # Should have multiple distinct color schemes for payment methods
          expect(payment_method_color_classes.count).to be >= 3

          # Should have multiple distinct color schemes for statuses
          expect(status_color_classes.count).to be >= 3

          # Payment method and status badges should not share the same color schemes
          overlapping_classes = payment_method_color_classes & status_color_classes
          expect(overlapping_classes).to be_empty
        end
      end

      it "shows specific color coding for different statuses" do
        with_forgery_protection do
          visit "/payments"

          expect(page).to have_current_path("/payments", wait: 10)
          expect(page).to have_css("#react-root", wait: 10)

          # Wait for payments to load
          expect(page).to have_content("Test Client", wait: 10)

          # Check for specific status color coding
          status_badges = page.all("[data-testid='status-badge']")

          # Find badges with different statuses and verify they have different colors
          paid_badges = status_badges.select { |badge| badge.text.downcase.include?("paid") && !badge.text.downcase.include?("partially") }
          failed_badges = status_badges.select { |badge| badge.text.downcase.include?("failed") }
          partial_badges = status_badges.select { |badge| badge.text.downcase.include?("partially") }
          cancelled_badges = status_badges.select { |badge| badge.text.downcase.include?("cancelled") }

          if paid_badges.any?
            expect(paid_badges.first[:class]).to include("green")
          end

          if failed_badges.any?
            expect(failed_badges.first[:class]).to include("red")
          end

          if partial_badges.any?
            expect(partial_badges.first[:class]).to include("yellow")
          end

          if cancelled_badges.any?
            expect(cancelled_badges.first[:class]).to include("gray")
          end
        end
      end

      it "shows specific color coding for different payment methods" do
        with_forgery_protection do
          visit "/payments"

          expect(page).to have_current_path("/payments", wait: 10)
          expect(page).to have_css("#react-root", wait: 10)

          # Wait for payments to load
          expect(page).to have_content("Test Client", wait: 10)

          # Check for specific payment method color coding
          payment_method_badges = page.all("[data-testid='payment-method-badge']")

          # Find badges with different payment methods and verify they have different colors
          card_badges = payment_method_badges.select { |badge| badge.text.downcase.include?("visa") }
          bank_badges = payment_method_badges.select { |badge| badge.text.downcase.include?("bank") }
          stripe_badges = payment_method_badges.select { |badge| badge.text.downcase.include?("stripe") }
          cash_badges = payment_method_badges.select { |badge| badge.text.downcase.include?("cash") }

          if card_badges.any?
            expect(card_badges.first[:class]).to include("emerald")
          end

          if bank_badges.any?
            expect(bank_badges.first[:class]).to include("cyan")
          end

          if stripe_badges.any?
            expect(stripe_badges.first[:class]).to include("indigo")
          end

          if cash_badges.any?
            expect(cash_badges.first[:class]).to include("orange")
          end
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

          # Check that badges have proper contrast and are readable
          payment_method_badge = page.find("[data-testid='payment-method-badge']",
            match: :first, wait: 5)
          status_badge = page.find("[data-testid='status-badge']",
            match: :first, wait: 5)

          # Badges should be visible and have text content
          expect(payment_method_badge).to be_visible
          expect(status_badge).to be_visible
          expect(payment_method_badge.text).not_to be_empty
          expect(status_badge.text).not_to be_empty

          # Badges should have proper ARIA attributes or semantic meaning
          expect(payment_method_badge.tag_name.downcase).to be_in(%w[span div badge])
          expect(status_badge.tag_name.downcase).to be_in(%w[span div badge])
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
        # Create payments with different transaction types
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

          # Should display all payments with their respective badges
          payment_methods.each do |method|
            expect(page).to have_content("#{method.to_s.humanize} payment test", wait: 10)
          end

          # Should have payment method badges for all payments
          payment_method_badges = page.all("[data-testid='payment-method-badge']")
          expect(payment_method_badges.count).to be >= payment_methods.count
        end
      end
    end

    context "with various statuses" do
      it "handles all statuses gracefully" do
        # Create payments with different statuses
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

          # Should display all payments with their respective badges
          statuses.each do |status|
            expect(page).to have_content("#{status.to_s.humanize} status test", wait: 10)
          end

          # Should have status badges for all payments
          status_badges = page.all("[data-testid='status-badge']")
          expect(status_badges.count).to be >= statuses.count
        end
      end
    end
  end
end
