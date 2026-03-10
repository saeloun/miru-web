# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Settings - Bank Info", type: :system, js: true do
  let(:company) { create(:company, name: "Bank Info Corp") }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  it "routes bank info to the organization edit form" do
    with_forgery_protection do
      visit "/settings/bank-info"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_current_path("/settings/organization/edit", wait: 10, ignore_query: true)
      expect(page).to have_text("BANK INFORMATION", wait: 10)
      expect(page).to have_text("TAX INFORMATION", wait: 10)
      expect(page).to have_text("BANK NAME", wait: 10)
      expect(page).to have_text("TAX ID", wait: 10)
    end
  end

  it "does not expose bank info to employees" do
    employee = create(:user, current_workspace_id: company.id)
    create(:employment, company:, user: employee)
    employee.add_role :employee, company
    sign_in(employee)

    with_forgery_protection do
      visit "/settings/bank-info"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).not_to have_text("BANK INFORMATION", wait: 5)
    end
  end
end
