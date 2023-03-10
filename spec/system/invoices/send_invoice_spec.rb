# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Send Invoice", type: :system do
  let(:invoice) { create :invoice_with_invoice_line_items, status: :draft }
  let(:client) { invoice.client }
  let(:company) { invoice.company }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user: admin)
    admin.add_role :admin, company

    create(:employment, company:, user: owner)
    owner.add_role :owner, company

    create(:employment, company:, user: employee)
    employee.add_role :employee, company
  end

  context "when logged-in user is Admin" do
      before do
        login_as admin
      end

      it "is able to send invoice from Invoices List page" do
        with_forgery_protection do
          visit "invoices"

          expect(page).to have_text "Invoices"
          expect(page).to have_xpath "//h1[text()='All Invoices']"

          # Verify the page must have the new invoice
          within_table("invoices-list-table") do
            tr = find(:xpath, "//*[@id='invoices-list-table-row'][1]")
            expect(tr).to have_xpath "//h3[text()='#{invoice.invoice_number}']"
            expect(tr).to have_xpath "//span[text()='#{company.name}']"
            tr.hover

            # Send invoice
            find_by_id("send-invoice-button", visible: false).click()
            click_button("Send Invoice")
          end
        end
      end

      it "is able to send invoice from Edit Invoice page" do
        with_forgery_protection do
          visit "invoices/#{invoice.id}/edit"

          find_by_id("send-invoice-button").click()
          click_button("Send Invoice")
          expect(page).to have_content(/PROCESSING.../, wait: 3)
          #   expect(page).to have_content("Invoice will be sent!") - Need to verify.
        end
      end
    end

  context "when logged-in user is Owner" do
    before do
      login_as owner
    end

    it "is able to send invoice from Invoices List page" do
      with_forgery_protection do
        visit "invoices"

        expect(page).to have_text "Invoices"
        expect(page).to have_xpath "//h1[text()='All Invoices']"

        # Verify the page must have the new invoice
        within_table("invoices-list-table") do
          tr = find(:xpath, "//*[@id='invoices-list-table-row'][1]")
          expect(tr).to have_xpath "//h3[text()='#{invoice.invoice_number}']"
          expect(tr).to have_xpath "//span[text()='#{company.name}']"
          tr.hover

          # Send invoice
          find_by_id("send-invoice-button", visible: false).click()
          click_button("Send Invoice")
        end
      end
    end

    it "is able to send invoice from Edit Invoice page" do
      with_forgery_protection do
        visit "invoices/#{invoice.id}/edit"

        find_by_id("send-invoice-button").click()
        click_button("Send Invoice")
        expect(page).to have_content(/PROCESSING.../, wait: 3)
        #   expect(page).to have_content("Invoice will be sent!") - Need to verify.
      end
    end
  end

  context "when logged-in user is Employee" do
      before do
        login_as employee
      end

      it "is not able to see invoices option" do
         with_forgery_protection do
            visit "time-tracking"
            expect(page).to have_no_link("invoices")
          end
       end
    end
end
