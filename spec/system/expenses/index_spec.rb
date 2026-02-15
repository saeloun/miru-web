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

  context "when admin visits expenses page" do
    it "loads the expenses page and shows the React app" do
      with_forgery_protection do
        visit "/expenses"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end

    it "displays the Expenses header" do
      with_forgery_protection do
        visit "/expenses"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Expenses", wait: 10)
      end
    end

    it "shows the Add Expense button" do
      with_forgery_protection do
        visit "/expenses"

        expect(page).to have_css("#react-root", wait: 10)
        expect(page).to have_content("Add Expense", wait: 10)
      end
    end

    context "with no expenses" do
      it "displays an empty state message" do
        with_forgery_protection do
          visit "/expenses"

          expect(page).to have_css("#react-root", wait: 10)
          expect(page).to have_content("there aren't any expenses", wait: 10)
        end
      end
    end

    context "with existing expenses" do
      let!(:category_one) { create(:expense_category, name: "Travel", company:) }
      let!(:category_two) { create(:expense_category, name: "Software", company:) }
      let!(:vendor_one) { create(:vendor, name: "Acme Supplies", company:) }
      let!(:vendor_two) { create(:vendor, name: "Cloud Services Inc", company:) }

      let!(:expense_one) do
        create(:expense,
          company:,
          expense_category: category_one,
          vendor: vendor_one,
          amount: 150.00,
          expense_type: :business,
          description: "Flight to conference",
          date: Date.current)
      end

      let!(:expense_two) do
        create(:expense,
          company:,
          expense_category: category_two,
          vendor: vendor_two,
          amount: 49.99,
          expense_type: :personal,
          description: "IDE license",
          date: 5.days.ago)
      end

      it "displays expense entries" do
        with_forgery_protection do
          visit "/expenses"

          expect(page).to have_css("#react-root", wait: 10)
          expect(page).to have_content("Acme Supplies", wait: 10)
          expect(page).to have_content("Cloud Services Inc", wait: 10)
        end
      end

      it "shows expense category names" do
        with_forgery_protection do
          visit "/expenses"

          expect(page).to have_css("#react-root", wait: 10)
          expect(page).to have_content("Travel", wait: 10)
          expect(page).to have_content("Software", wait: 10)
        end
      end

      it "shows expense amounts" do
        with_forgery_protection do
          visit "/expenses"

          expect(page).to have_css("#react-root", wait: 10)
          expect(page).to have_content("150", wait: 10)
          expect(page).to have_content("49.99", wait: 10)
        end
      end

      it "shows expense types" do
        with_forgery_protection do
          visit "/expenses"

          expect(page).to have_css("#react-root", wait: 10)
          expect(page).to have_content("business", wait: 10)
          expect(page).to have_content("personal", wait: 10)
        end
      end

      it "shows expense descriptions" do
        with_forgery_protection do
          visit "/expenses"

          expect(page).to have_css("#react-root", wait: 10)
          expect(page).to have_content("Flight to conference", wait: 10)
        end
      end

      it "does not show the empty state message" do
        with_forgery_protection do
          visit "/expenses"

          expect(page).to have_css("#react-root", wait: 10)
          expect(page).not_to have_content("there aren't any expenses", wait: 3)
        end
      end
    end

    context "with a single expense" do
      let!(:category) { create(:expense_category, name: "Office", company:) }
      let!(:vendor) { create(:vendor, name: "Staples", company:) }

      let!(:expense) do
        create(:expense,
          company:,
          expense_category: category,
          vendor:,
          amount: 200.50,
          expense_type: :business,
          description: "Printer paper",
          date: Date.current)
      end

      it "displays the single expense with all details" do
        with_forgery_protection do
          visit "/expenses"

          expect(page).to have_css("#react-root", wait: 10)
          expect(page).to have_content("Staples", wait: 10)
          expect(page).to have_content("200.50", wait: 10)
          expect(page).to have_content("Office", wait: 10)
        end
      end
    end
  end

  context "when employee visits expenses page" do
    let(:employee_user) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: employee_user)
      employee_user.add_role :employee, company
      sign_in(employee_user)
    end

    it "can access the expenses page" do
      with_forgery_protection do
        visit "/expenses"

        expect(page).to have_css("#react-root", wait: 10)
      end
    end
  end
end
