# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Send Invoice", type: :system do
  let(:invoice) { create :invoice_with_invoice_line_items }
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
        sign_in admin
      end

      include_examples "Send Invoice"
    end

  context "when logged-in user is Owner" do
    before do
      sign_in owner
    end

    include_examples "Send Invoice"
  end

  context "when logged-in user is Employee" do
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
