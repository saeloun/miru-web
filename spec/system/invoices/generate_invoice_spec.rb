# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Generate Invoice", type: :system, js: true do
  let(:company) { create(:company, base_currency: "USD") }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:owner) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:, billable: true) }

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
      sign_in owner
    end

    include_examples "Generate Invoice"
  end

  context "when logged-in user is an Owner" do
    before do
      sign_in owner
    end

    include_examples "Generate Invoice"
  end

  context "when logged-in user is an Employee" do
    before do
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
