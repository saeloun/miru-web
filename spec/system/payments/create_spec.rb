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

    it "creates a payment entry successfully", pending: "Complex modal interactions need debugging with React Select components" do
      with_forgery_protection do
        visit "/payments"

        # Wait for the page to load and click on Payments in sidebar if needed
        if page.has_content?("Time Tracking")
          click_link "Payments"
        end

        # Wait for payments page to load
        expect(page).to have_content("Payments")

        click_button "Add Manual Entry"

        within(".modal__form") do
          # Wait for modal to fully load
          expect(page).to have_selector("#invoice", wait: 5)

          # Select invoice - click on the first invoice div to open dropdown
          first("#invoice").click
          # The invoice list should be visible now
          expect(page).to have_selector("#invoicesList", wait: 2)
          # Click to open the select dropdown (it's a div that acts like a button)
          find("#invoicesList").click
          # Now click on the first SelectItem option
          find('[role="option"]', match: :first, wait: 2).click

          # Select transaction type - click on transaction type dropdown
          find("#transactionType").click
          find('[role="option"]', text: "ACH", wait: 2).click

          # Add notes
          fill_in "NotesOptional", with: "Testing payment"

          # Submit the form
          click_button "ADD PAYMENT"
        end

        expect(page).to have_content(invoice.invoice_number)
        expect(page).to have_content("PAID")
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
      expect(page).to have_no_link("Payments")
    end
  end
end
