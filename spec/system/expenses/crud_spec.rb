# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Expenses CRUD", type: :system, js: true do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:category) { create(:expense_category, name: "Travel", company:) }
  let!(:vendor) { create(:vendor, name: "Acme Supplies", company:) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
    sign_in(user)
  end

  describe "expense list and detail" do
    let!(:business_expense) do
      create(:expense,
        company:,
        expense_category: category,
        vendor:,
        amount: 250.00,
        expense_type: :business,
        description: "Conference registration fee",
        date: Date.current)
    end

    let!(:personal_expense) do
      create(:expense,
        company:,
        expense_category: create(:expense_category, name: "Software", company:),
        vendor: create(:vendor, name: "App Store", company:),
        amount: 9.99,
        expense_type: :personal,
        description: "Personal app subscription",
        date: 3.days.ago)
    end

    it "shows expenses on the list with the create action" do
      with_forgery_protection do
        visit "/expenses"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Add Expense", wait: 10)
        expect(page).to have_content("Conference registration fee", wait: 10)
        expect(page).to have_content("Personal app subscription", wait: 10)
      end
    end

    it "shows the important fields on the expense detail page" do
      with_forgery_protection do
        visit "/expenses/#{business_expense.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Travel", wait: 10)
        expect(page).to have_content("Acme Supplies", wait: 10)
        expect(page).to have_content("business", wait: 10)
        expect(page).to have_content("Conference registration fee", wait: 10)
        expect(page).to have_content("250", wait: 10)
        expect(page).to have_content("Edit", wait: 10)
        expect(page).to have_content("Delete", wait: 10)
      end
    end

    it "handles a personal expense detail view" do
      with_forgery_protection do
        visit "/expenses/#{personal_expense.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("personal", wait: 10)
        expect(page).to have_content("9.99", wait: 10)
        expect(page).to have_content("Personal app subscription", wait: 10)
      end
    end
  end

  describe "deleting an expense" do
    let!(:expense) do
      create(:expense,
        company:,
        expense_category: category,
        vendor:,
        amount: 75.50,
        expense_type: :business,
        description: "Taxi fare",
        date: Date.current)
    end

    it "confirms and deletes the expense" do
      with_forgery_protection do
        visit "/expenses/#{expense.id}"

        expect(page).to have_css("#react-root", wait: 10)
        click_on "Delete"

        expect(page).to have_content("Delete Expense", wait: 10)
        expect(page).to have_content("Are you sure you want to delete this expense?", wait: 10)

        click_on "DELETE"

        expect(page).to have_current_path("/expenses", wait: 10)
        expect(page).not_to have_content("Taxi fare", wait: 10)
      end
    end
  end

  context "when employee views expenses" do
    let(:employee) { create(:user, current_workspace_id: company.id) }
    let!(:employee_expense) do
      create(:expense,
        company:,
        user: employee,
        expense_category: category,
        vendor:,
        amount: 42.50,
        expense_type: :business,
        description: "Mileage reimbursement",
        date: Date.current)
    end

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
      Warden.test_reset!
      sign_in(employee)
    end

    it "shows the employee their own submitted expenses" do
      with_forgery_protection do
        visit "/expenses"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_current_path("/expenses", wait: 10)
        expect(page).to have_content("Mileage reimbursement", wait: 10)
        expect(page).to have_content("Add Expense", wait: 10)
      end
    end
  end
end
