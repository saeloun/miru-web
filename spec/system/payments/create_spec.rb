# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Adding payment entry", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "bob") }
  let!(:invoice) do
    create(:invoice,
      client:,
      company:,
      status: "sent",
      invoice_number: "INV-MANUAL-001",
      amount: 500.00,
      amount_due: 500.00,
      outstanding_amount: 500.00)
  end

  def open_manual_payment_modal
    visit "/payments"

    expect(page).to have_content("Payments", wait: 10)
    first(:button, "ADD MANUAL ENTRY", minimum: 1).click
    expect(page).to have_content("Add Payment", wait: 10)
  end

  def select_manual_payment_invoice(invoice)
    find("[data-testid='manual-payment-invoice-select']", wait: 10).click
    within("[data-testid='manual-payment-invoice-options']") do
      find("[role='option']", text: invoice.invoice_number, wait: 10).click
    end

    expect(page).to have_css(
      "[data-testid='manual-payment-invoice-select']",
      text: invoice.invoice_number,
      wait: 10
    )
  end

  def select_manual_payment_invoice_with_keyboard(invoice)
    invoice_select = find("[data-testid='manual-payment-invoice-select']", wait: 10)

    invoice_select.click
    invoice_select.send_keys(:down, :enter)

    expect(page).to have_css(
      "[data-testid='manual-payment-invoice-select']",
      text: invoice.invoice_number,
      wait: 10
    )
  end

  def select_desktop_transaction_type(type)
    within("#transactionType") do
      find("button", text: "Select Transaction Type", match: :first, wait: 10).click
      find("button", text: type, wait: 10).click
    end
  end

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "opens the manual payment modal" do
      with_forgery_protection do
        open_manual_payment_modal

        expect(page).to have_content("Add Payment", wait: 10)
        expect(page).to have_selector("#invoice", wait: 10)
        expect(page).to have_selector("#transactionType", wait: 10)
        expect(page).to have_button("Add Payment", disabled: true, wait: 10)
      end
    end

    it "creates a manual payment after selecting a desktop transaction type" do
      with_forgery_protection do
        visit "/payments?invoiceId=#{invoice.id}"

        first(:button, "ADD MANUAL ENTRY", minimum: 1).click
        select_desktop_transaction_type("Bank Transfer")
        expect(page).to have_field("paymentAmount", disabled: false)
        fill_in "paymentAmount", with: "123.45"

        expect do
          click_button "Add Payment"
          expect(page).to have_content("Manual entry added successfully.", wait: 10)
        end.to change(Payment, :count).by(1)

        payment = Payment.order(:id).last

        expect(payment.invoice_id).to eq(invoice.id)
        expect(payment.amount).to eq(BigDecimal("123.45"))
        expect(payment.transaction_type).to eq("bank_transfer")
      end
    end

    it "creates a manual payment after selecting an invoice from the modal" do
      with_forgery_protection do
        open_manual_payment_modal
        select_manual_payment_invoice(invoice)
        select_desktop_transaction_type("Bank Transfer")
        fill_in "paymentAmount", with: "123.45"

        expect(page).to have_button("Add Payment", disabled: false, wait: 10)

        expect do
          click_button "Add Payment"
          expect(page).to have_content("Manual entry added successfully.", wait: 10)
        end.to change(Payment, :count).by(1)

        payment = Payment.order(:id).last

        expect(payment.invoice_id).to eq(invoice.id)
        expect(payment.amount).to eq(BigDecimal("123.45"))
        expect(payment.transaction_type).to eq("bank_transfer")
      end
    end

    it "selects an invoice from the modal with keyboard navigation" do
      with_forgery_protection do
        open_manual_payment_modal
        select_manual_payment_invoice_with_keyboard(invoice)

        expect(page).to have_field("paymentAmount", disabled: false, wait: 10)
      end
    end

    it "keeps selected payment values visible when the save fails" do
      with_forgery_protection do
        open_manual_payment_modal
        select_manual_payment_invoice(invoice)
        select_desktop_transaction_type("Bank Transfer")
        fill_in "paymentAmount", with: "0"

        expect do
          click_button "Add Payment"
          expect(page).to have_content("Failed to add manual entry", wait: 10)
        end.not_to change(Payment, :count)

        expect(page).to have_css(
          "[data-testid='manual-payment-invoice-select']",
          text: invoice.invoice_number,
          wait: 10
        )
        within("#transactionType") do
          expect(page).to have_button("Bank Transfer", wait: 10)
        end
        expect(page).to have_field("paymentAmount", with: "0", wait: 10)
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    it "does not have payments link" do
      expect(page).not_to have_link("Payments")

      with_forgery_protection do
        visit "/payments"

        expect(page).to have_current_path("/time-tracking", wait: 10)
      end
    end
  end
end
