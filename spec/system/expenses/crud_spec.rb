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

  describe "viewing expense details" do
    let!(:expense) do
      create(:expense,
        company:,
        expense_category: category,
        vendor:,
        amount: 250.00,
        expense_type: :business,
        description: "Conference registration fee",
        date: Date.current)
    end

    it "displays expense detail page with all fields" do
      with_forgery_protection do
        visit "/expenses/#{expense.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("250", wait: 10)
        expect(page).to have_content("Travel", wait: 10)
        expect(page).to have_content("Acme Supplies", wait: 10)
        expect(page).to have_content("business", wait: 10)
        expect(page).to have_content("Conference registration fee", wait: 10)
      end
    end

    it "shows edit and delete buttons on the detail page" do
      with_forgery_protection do
        visit "/expenses/#{expense.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Edit", wait: 10)
        expect(page).to have_content("Delete", wait: 10)
      end
    end

    it "shows the expense amount formatted" do
      with_forgery_protection do
        visit "/expenses/#{expense.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Amount", wait: 10)
        expect(page).to have_content("250", wait: 10)
      end
    end

    it "shows the expense date" do
      with_forgery_protection do
        visit "/expenses/#{expense.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Date", wait: 10)
      end
    end

    it "shows the vendor name" do
      with_forgery_protection do
        visit "/expenses/#{expense.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Vendor", wait: 10)
        expect(page).to have_content("Acme Supplies", wait: 10)
      end
    end

    it "shows the expense type" do
      with_forgery_protection do
        visit "/expenses/#{expense.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Type", wait: 10)
        expect(page).to have_content("business", wait: 10)
      end
    end

    it "shows the description" do
      with_forgery_protection do
        visit "/expenses/#{expense.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Description", wait: 10)
        expect(page).to have_content("Conference registration fee", wait: 10)
      end
    end
  end

  describe "add expense modal" do
    it "shows the Add Expense button on the expenses list" do
      with_forgery_protection do
        visit "/expenses"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Add Expense", wait: 10)
      end
    end
  end

  describe "navigating back from expense detail" do
    let!(:expense) do
      create(:expense,
        company:,
        expense_category: category,
        vendor:,
        amount: 100.00,
        expense_type: :personal,
        description: "Office supplies",
        date: Date.current)
    end

    it "can navigate back to the expenses list" do
      with_forgery_protection do
        visit "/expenses/#{expense.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Office supplies", wait: 10)
      end
    end
  end

  describe "delete expense confirmation" do
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

    it "shows delete confirmation modal when clicking Delete" do
      with_forgery_protection do
        visit "/expenses/#{expense.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Delete", wait: 10)

        click_on "Delete"

        expect(page).to have_content("Delete Expense", wait: 10)
        expect(page).to have_content("Are you sure you want to delete this expense?", wait: 10)
        expect(page).to have_content("CANCEL", wait: 10)
        expect(page).to have_content("DELETE", wait: 10)
      end
    end

    it "can cancel the delete action" do
      with_forgery_protection do
        visit "/expenses/#{expense.id}"

        expect(page).to have_css("#react-root", wait: 10)
        click_on "Delete"

        expect(page).to have_content("Delete Expense", wait: 10)
        click_on "CANCEL"

        expect(page).to have_content("Taxi fare", wait: 10)
      end
    end

    it "deletes the expense and redirects to list" do
      with_forgery_protection do
        visit "/expenses/#{expense.id}"

        expect(page).to have_css("#react-root", wait: 10)
        click_on "Delete"

        expect(page).to have_content("Delete Expense", wait: 10)
        click_on "DELETE"

        expect(page).to have_current_path("/expenses", wait: 10)
          .or have_content("Expenses", wait: 10)
      end
    end
  end

  describe "expense with different types" do
    let!(:business_expense) do
      create(:expense,
        company:,
        expense_category: category,
        vendor:,
        amount: 500.00,
        expense_type: :business,
        description: "Business trip",
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

    it "shows both expense types on the list" do
      with_forgery_protection do
        visit "/expenses"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Business trip", wait: 10)
        expect(page).to have_content("Personal app subscription", wait: 10)
      end
    end

    it "displays business expense detail correctly" do
      with_forgery_protection do
        visit "/expenses/#{business_expense.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("business", wait: 10)
        expect(page).to have_content("500", wait: 10)
        expect(page).to have_content("Business trip", wait: 10)
      end
    end

    it "displays personal expense detail correctly" do
      with_forgery_protection do
        visit "/expenses/#{personal_expense.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("personal", wait: 10)
        expect(page).to have_content("9.99", wait: 10)
        expect(page).to have_content("Personal app subscription", wait: 10)
      end
    end
  end

  describe "expense without description" do
    let!(:expense) do
      create(:expense,
        company:,
        expense_category: category,
        vendor:,
        amount: 42.00,
        expense_type: :business,
        description: nil,
        date: Date.current)
    end

    it "handles missing description gracefully" do
      with_forgery_protection do
        visit "/expenses/#{expense.id}"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("42", wait: 10)
        expect(page).to have_content("Travel", wait: 10)
      end
    end
  end

  context "when employee views expenses" do
    let(:employee) { create(:user, current_workspace_id: company.id) }
    let!(:expense) do
      create(:expense,
        company:,
        expense_category: category,
        vendor:,
        amount: 150.00,
        expense_type: :business,
        description: "Team lunch",
        date: Date.current)
    end

    before do
      create(:employment, company:, user: employee)
      employee.add_role :employee, company
      Warden.test_reset!
      sign_in(employee)
    end

    it "redirects employee away from the expenses list" do
      with_forgery_protection do
        visit "/expenses"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_current_path("/time-tracking", wait: 10)
        expect(page).not_to have_content("Expenses", wait: 5)
      end
    end
  end
end
