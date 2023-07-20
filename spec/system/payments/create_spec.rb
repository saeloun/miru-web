# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Adding payment entry", type: :system do
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

    it "creates a payment entry successfully" do
      with_forgery_protection do
        visit "/payments"

        click_button "addEntry"
        find("#invoice").click
        within(".modal__form") do
          find("#react-select-4-option-0").click
          find("#transactionDate").click
          find(".react-datepicker__day--014").click
          find("#transactionType").click
          find(".react-select-filter__option", text: "ACH").click
          fill_in "NotesOptional", with: "Testing payment"
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
