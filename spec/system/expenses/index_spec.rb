# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Expenses", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  it "shows the expenses page and primary action" do
    with_forgery_protection do
      visit "/expenses"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Expenses", wait: 10)
      expect(page).to have_content("Add Expense", wait: 10)
    end
  end

  it "shows the empty state when there are no expenses" do
    with_forgery_protection do
      visit "/expenses"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("No expenses recorded", wait: 10)
    end
  end

  it "shows a populated expenses list" do
    category_one = create(:expense_category, name: "Travel", company:)
    category_two = create(:expense_category, name: "Software", company:)
    vendor_one = create(:vendor, name: "Acme Supplies", company:)
    vendor_two = create(:vendor, name: "Cloud Services Inc", company:)

    create(:expense,
      company:,
      expense_category: category_one,
      vendor: vendor_one,
      amount: 150.00,
      expense_type: :business,
      description: "Flight to conference",
      date: Date.current)
    create(:expense,
      company:,
      expense_category: category_two,
      vendor: vendor_two,
      amount: 49.99,
      expense_type: :personal,
      description: "IDE license",
      date: 5.days.ago)

    with_forgery_protection do
      visit "/expenses"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Flight to conference", wait: 10)
      expect(page).to have_content("IDE license", wait: 10)
      expect(page).to have_content("150", wait: 10)
      expect(page).to have_content("49.99", wait: 10)
      expect(page).not_to have_content("No expenses recorded", wait: 3)
    end
  end

  it "redirects employees away from the expenses page" do
    employee_user = create(:user, current_workspace_id: company.id)
    create(:employment, company:, user: employee_user)
    employee_user.add_role :employee, company
    sign_in(employee_user)

    with_forgery_protection do
      visit "/expenses"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_current_path("/time-tracking", wait: 10)
    end
  end
end
