# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Generate Invoice", type: :system do
  let(:company) { create(:company, base_currency: "USD") }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }

  before do
    # Ensure 'Employee' is a project member & has a Timesheet entry
    create(:employment, company:, user: employee)
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
    ## TODO: Refactor(Move xpaths to a separate locator file)
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
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
        find(:field, placeholder: "Enter invoice number").set("invoice-1")

        # Add user from line items
        click_button("+ NEW LINE ITEM")
        find(:field, placeholder: "Name").click()
        find(:xpath, "//*[@id='entries-list']/span[contains(text(), '#{employee.first_name}')]").click()
        click_button("SAVE")
      end
    end
  end

  context "when logged-in user is an Employee" do
    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
      sign_in employee
    end

    it "is not able to see invoices option" do
      with_forgery_protection do
        visit "time-tracking"
        expect(page).to have_no_link("invoices")
      end
    end
  end
end