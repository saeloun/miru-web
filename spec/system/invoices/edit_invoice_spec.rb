# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Edit Invoice", type: :system do
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

      it "is able to Edit from Invoices list page" do
          with_forgery_protection do
              visit "invoices"

              expect(page).to have_content "Invoices"
              expect(page).to have_xpath "//h1[text()='All Invoices']"

              # Verify the page must have the invoice
              within_table("invoices-list-table") do
                tr = find(:xpath, "//*[@id='invoices-list-table-row'][1]")
                expect(tr).to have_xpath "//h3[text()='#{invoice.invoice_number}']"
                expect(tr).to have_xpath "//span[text()='#{company.name}']"
                tr.hover
              end

              # Edit invoice
              find_by_id("edit-invoice-button", visible: false).click()
              expect(page).to have_css("h2", text: "Edit Invoice ##{invoice.invoice_number}")
            end
        end

      it "is able to Remove line items" do
       with_forgery_protection do
           visit "invoices/#{invoice.id}/edit"

           # Edit invoice
           expect(page).to have_css("h2", text: "Edit Invoice ##{invoice.invoice_number}")

           # Remove all line Items
           page.all(:id, "delete-line-item-button").each do |el|
             el.click()
           end

           # Verify Save Button
           find_by_id("save-invoice-button").click()

           # Should display invoice in view mode
           expect(page).to have_current_path("/invoices/#{invoice.id}")
           expect(page).to have_no_content "CANCEL"
           expect(page).to have_no_content "+ NEW LINE ITEM"
         end
     end

      it "is able to View all labels" do
        with_forgery_protection do
          visit "invoices/#{invoice.id}/edit"

          # Verify Labels
          expect(page).to have_content "Billed to"
          expect(page).to have_content "Invoice Number"
          expect(page).to have_content "Date of Issue"
          expect(page).to have_content "Amount"
          expect(page).to have_content "LINE TOTAL"
          expect(page).to have_content "Tax"
          expect(page).to have_content "Amount Due"
          expect(page).to have_content "Amount Paid"
        end
      end

      it "is able to Cancel Edit" do
        with_forgery_protection do
          visit "invoices/#{invoice.id}/edit"

          # Verify Cancel Button
          find_by_id("cancel-edit-invoice-button").click()

          # Should display invoice in view mode
          expect(page).to have_current_path("/invoices/#{invoice.id}")
          expect(page).to have_no_content "CANCEL"
          expect(page).to have_no_content "+ NEW LINE ITEM"
        end
      end

      it "is able to Save changes from Edit invoice" do
          with_forgery_protection do
            visit "invoices/#{invoice.id}/edit"

            # Update invoice number
            find(:field, placeholder: "Enter invoice number").set("test-invoice-1-updated")

            # Verify Save Button
            find_by_id("save-invoice-button").click()

            # Should display invoice in view mode
            expect(page).to have_current_path("/invoices/#{invoice.id}")
            expect(page).to have_no_content "CANCEL"
            expect(page).to have_no_content "+ NEW LINE ITEM"

            # Should have the updated invoice number
            expect(page).to have_content "test-invoice-1-updated"
            expect(page).to have_content "Invoice ##{invoice.invoice_number}"
          end
        end
    end

  context "when logged-in user is Owner" do
    before do
      login_as owner
    end

    it "is able to Edit from Invoices List page" do
        with_forgery_protection do
            visit "invoices"

            expect(page).to have_content "Invoices"
            expect(page).to have_xpath "//h1[text()='All Invoices']"

            # Verify the page must have the invoice
            within_table("invoices-list-table") do
              tr = find(:xpath, "//*[@id='invoices-list-table-row'][1]")
              expect(tr).to have_xpath "//h3[text()='#{invoice.invoice_number}']"
              expect(tr).to have_xpath "//span[text()='#{company.name}']"
              tr.hover
            end

            # Edit invoice
            find_by_id("edit-invoice-button", visible: false).click()
            expect(page).to have_css("h2", text: "Edit Invoice ##{invoice.invoice_number}")
          end
      end

    it "is able to Remove line items" do
     with_forgery_protection do
         visit "invoices/#{invoice.id}/edit"

         # Edit invoice
         expect(page).to have_css("h2", text: "Edit Invoice ##{invoice.invoice_number}")

         # Remove all line Items
         page.all(:id, "delete-line-item-button").each do |el|
           el.click()
         end

         # Verify Save Button
         find_by_id("save-invoice-button").click()

         # Should display invoice in view mode
         expect(page).to have_current_path("/invoices/#{invoice.id}")
         expect(page).to have_no_content "CANCEL"
         expect(page).to have_no_content "+ NEW LINE ITEM"
       end
   end

    it "is able to View all labels" do
      with_forgery_protection do
        visit "invoices/#{invoice.id}/edit"

        # Verify Labels
        expect(page).to have_content "Billed to"
        expect(page).to have_content "Invoice Number"
        expect(page).to have_content "Date of Issue"
        expect(page).to have_content "Amount"
        expect(page).to have_content "LINE TOTAL"
        expect(page).to have_content "Tax"
        expect(page).to have_content "Amount Due"
        expect(page).to have_content "Amount Paid"
      end
    end

    it "is able to Cancel Edit" do
      with_forgery_protection do
        visit "invoices/#{invoice.id}/edit"

        # Verify Cancel Button
        find_by_id("cancel-edit-invoice-button").click()

        # Should display invoice in view mode
        expect(page).to have_current_path("/invoices/#{invoice.id}")
        expect(page).to have_no_content "CANCEL"
        expect(page).to have_no_content "+ NEW LINE ITEM"
      end
    end

    it "is able to Save changes on Edit invoice" do
        with_forgery_protection do
          visit "invoices/#{invoice.id}/edit"

          # Update invoice number
          find(:field, placeholder: "Enter invoice number").set("test-invoice-1-updated")

          # Verify Save Button
          find_by_id("save-invoice-button").click()

          # Should display invoice in view mode
          expect(page).to have_current_path("/invoices/#{invoice.id}")
          expect(page).to have_no_content "CANCEL"
          expect(page).to have_no_content "+ NEW LINE ITEM"

          # Should have the updated invoice number
          expect(page).to have_content "test-invoice-1-updated"
          expect(page).to have_content "Invoice ##{invoice.invoice_number}"
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
