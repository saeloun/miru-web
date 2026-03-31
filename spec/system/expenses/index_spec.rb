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
    create(:expense,
      company:,
      category_name: "Travel",
      vendor_name: "Acme Supplies",
      amount: 150.00,
      expense_type: :business,
      description: "Flight to conference",
      date: Date.current)
    create(:expense,
      company:,
      category_name: "Software",
      vendor_name: "Cloud Services Inc",
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

  it "loads more expenses on scroll" do
    26.times do |index|
      create(:expense,
        company:,
        user:,
        category_name: "Travel",
        vendor_name: "Vendor #{index}",
        amount: 10 + index,
        expense_type: :business,
        description: "Expense #{index}",
        date: index.days.ago)
    end

    with_forgery_protection do
      visit "/expenses"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_content("Showing 25 of 26", wait: 10)

      page.execute_script("window.scrollTo(0, document.body.scrollHeight)")

      expect(page).to have_content("Showing 26 of 26", wait: 10)
      expect(page).to have_content("All expenses loaded", wait: 10)
    end
  end

  it "hides delete for paid expenses" do
    create(:expense,
      company:,
      user: user,
      category_name: "Travel",
      vendor_name: "Cafe 21",
      amount: 20.00,
      expense_type: :business,
      description: "Paid reimbursement",
      status: :paid,
      paid_at: Time.current,
      date: Date.current)

    with_forgery_protection do
      visit "/expenses"

      find("button[aria-label='Expense actions for Paid reimbursement']", wait: 10).click
      expect(page).to have_content("Edit expense", wait: 10)
      expect(page).not_to have_content("Delete expense", wait: 2)
      expect(page).not_to have_content("Mark as paid", wait: 2)
    end
  end

  it "shows employees only their own expenses without review actions" do
    employee_user = create(:user, current_workspace_id: company.id)
    create(:employment, company:, user: employee_user)
    employee_user.add_role :employee, company
    create(:expense,
      company:,
      user: employee_user,
      category_name: "Travel",
      vendor_name: "Cafe 21",
      amount: 42.50,
      expense_type: :business,
      description: "Mileage reimbursement",
      date: Date.current)
    create(:expense,
      company:,
      user: user,
      category_name: "Software",
      vendor_name: "Cloud Services Inc",
      amount: 49.99,
      expense_type: :business,
      description: "Admin-only expense",
      date: Date.current)
    sign_in(employee_user)

    with_forgery_protection do
      visit "/expenses"

      expect(page).to have_css("#react-root", wait: 10)
      expect(page).to have_current_path("/expenses", wait: 10)
      expect(page).to have_content("Expenses", wait: 10)
      expect(page).to have_content("Mileage reimbursement", wait: 10)
      expect(page).not_to have_content("Admin-only expense", wait: 10)

      find("button[aria-label='Expense actions for Mileage reimbursement']", wait: 10).click
      expect(page).to have_content("Edit expense", wait: 10)
      expect(page).to have_content("Delete expense", wait: 10)
      expect(page).not_to have_content("Approve expense", wait: 2)
      expect(page).not_to have_content("Reject expense", wait: 2)
      expect(page).not_to have_content("Mark as paid", wait: 2)
    end
  end

  it "accepts currency symbols in the amount field when adding an expense" do
    with_forgery_protection do
      visit "/expenses"

      find("button", text: "Add Expense", match: :first).click

      fill_in "description", with: "Currency symbol expense"
      fill_in "amount", with: "$100"

      find("label[for='category']", wait: 10).find(:xpath, "..").find("button").click
      find("[role='option']", match: :first, wait: 10).click

      expect(page).to have_button("Add Expense", disabled: false, wait: 10)

      dialog = find("[role='dialog']", wait: 10)

      expect do
        dialog.click_button "Add Expense"
        expect(page).to have_content("Expense created successfully", wait: 10)
      end.to change(Expense, :count).by(1)

      expect(Expense.order(:id).last.amount.to_f).to eq(100.0)
    end
  end
end
