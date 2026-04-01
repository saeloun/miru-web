# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Adding payment entry", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:, name: "bob") }
  let!(:invoice) { create(:invoice, client:, company:, status: "sent") }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "opens the manual payment modal" do
      with_forgery_protection do
        visit "/payments"

        # Wait for the page to load and click on Payments in sidebar if needed
        if page.has_content?("Time Tracking")
          click_link "Payments"
        end

        # Wait for payments page to load
        expect(page).to have_content("Payments")

        first(:button, "Add Manual Entry", minimum: 1).click
        expect(page).to have_content("Add Manual Entry", wait: 10)
        expect(page).to have_selector("#invoice", wait: 10)
        expect(page).to have_selector("#transactionType", wait: 10)
      end
    end

    it "creates a manual payment after selecting a desktop transaction type" do
      with_forgery_protection do
        visit "/payments?invoiceId=#{invoice.id}"

        first(:button, "Add Manual Entry", minimum: 1).click
        within("#transactionType") do
          find("button", text: "Select Transaction Type", match: :first, wait: 10).click
        end
        find("[role='option']", text: "Bank Transfer", wait: 10).click

        expect do
          click_button "ADD PAYMENT"
          expect(page).to have_content("Manual entry added successfully.", wait: 10)
        end.to change(Payment, :count).by(1)

        payment = Payment.order(:id).last

        expect(payment.invoice_id).to eq(invoice.id)
        expect(payment.transaction_type).to eq("bank_transfer")
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
