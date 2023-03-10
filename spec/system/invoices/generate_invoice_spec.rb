# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Generate Invoice", type: :system do
  let(:company) { create(:company, base_currency: "USD") }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }

  before do
    create(:employment, company:, user: admin)
    admin.add_role :admin, company

    create(:employment, company:, user: owner)
    owner.add_role :owner, company

    create(:employment, company:, user: employee)
    employee.add_role :employee, company

    # Ensure 'Employee' is a project member & has a Timesheet entry
    create(:project_member, project:, user: employee, hourly_rate: 200)
    create(
      :timesheet_entry,
      user: employee,
      project:,
      work_date: Time.now,
      duration: 600,
      note: "Test note",
      bill_status: :unbilled
    )
  end

  context "when logged-in user is Admin" do
    before do
      login_as admin
    end

    it "is able to view generate invoice page elements" do
      with_forgery_protection do
       visit "invoices"

       expect(page).to have_text "Invoices"
       click_button("Create New Invoice")

       # Check labels
       expect(page).to have_text "Generate Invoice"
       expect(page).to have_text company.name
       expect(page).to have_text company.business_phone
     end
    end

    it "is able to generates Invoice successfully for an employee of his organisation" do
      with_forgery_protection do
        visit "invoices"

        expect(page).to have_text "Invoices"
        click_button("Create New Invoice")

        # Add client
        click_button("+ ADD CLIENT")
        find(:xpath, '//*[@id="client-list"]/div[2]/div').click()

        # Add invoice number
        find(:field, placeholder: "Enter invoice number").set("test-invoice-1")

        # Add user from line items
        click_button("+ NEW LINE ITEM")
        find(:field, placeholder: "Name").click()
        find(:xpath, "//*[@id='entries-list']/span[contains(text(), '#{employee.first_name}')]").click()
        click_button("SAVE")

        # Verify closing edit window and loading invoice lists page with the same invoice number
        expect(page).to have_current_path "/invoices?invoices_per_page=20&page=1"
        expect(page).to have_xpath "//h1[text()='All Invoices']"
        expect(page).to have_xpath "//h3[text()='test-invoice-1']"
      end
    end
  end

  context "when logged-in user is an Owner" do
    before do
      login_as owner
    end

    it "is able to generates Invoice successfully for an employee of his organisation" do
      with_forgery_protection do
        visit "invoices"

        expect(page).to have_text "Invoices"
        click_button("Create New Invoice")
        expect(page).to have_current_path("/invoices/generate")

        # Add client
        click_button("+ ADD CLIENT")
        find(:xpath, '//*[@id="client-list"]/div[2]/div').click()

        # Add invoice number
        find(:field, placeholder: "Enter invoice number").set("test-invoice-1")

        # Add user from line items
        click_button("+ NEW LINE ITEM")
        find(:field, placeholder: "Name").click()
        find(:xpath, "//*[@id='entries-list']/span[contains(text(), '#{employee.first_name}')]").click()
        click_button("SAVE")

        # Verify closing edit window and loading invoice lists page with the same invoice number
        expect(page).to have_current_path "/invoices?invoices_per_page=20&page=1"
        expect(page).to have_xpath "//h1[text()='All Invoices']"
        expect(page).to have_xpath "//h3[text()='test-invoice-1']"
      end
    end
  end

  context "when logged-in user is an Employee" do
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
