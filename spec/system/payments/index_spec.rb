# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Payments index page", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client1) { create(:client, company:, name: "bob") }
  let(:client1_sent_invoice1) { create(:invoice, client: client1, company:, status: "sent") }
  let(:client1_sent_invoice2) { create(:invoice, client: client1, company:, status: "sent") }
  let!(:payment1) { create(:payment, invoice: client1_sent_invoice1, status: "failed", note: "Payment failed") }
  let!(:payment2) { create(:payment, invoice: client1_sent_invoice1, status: "paid", note: "Paid invoice") }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    context "when tries to fetch payments list" do
      it "returns the list of payments" do
        with_forgery_protection do
          visit "/payments"

          # Wait for the page to load and click on Payments in sidebar if needed
          if page.has_content?("Time Tracking")
            click_link "Payments"
          end

          # Wait for payments page to load
          expect(page).to have_content("Payments")

          expect(page).to have_content("Payment failed")
          expect(page).to have_content("Paid invoice")
          expect(page).to have_content(payment1.invoice.invoice_number)
          expect(page).to have_content(payment2.invoice.invoice_number)
        end
      end
    end
  end
end
