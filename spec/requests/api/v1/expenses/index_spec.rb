# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Expense#index", type: :request do
  let_it_be(:company) { create(:company) }
  let_it_be(:expense1) { create(:expense, company:, category_name: "Travel", vendor_name: "Jetway", user: admin) }
  let_it_be(:expense2) { create(:expense, company:, category_name: "Food", vendor_name: "Cafe 21", user: employee) }

  let_it_be(:book_keeper) { create(:user, current_workspace_id: company.id) }
  let_it_be(:admin) { create(:user, current_workspace_id: company.id) }
  let_it_be(:employee) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user: book_keeper)
    book_keeper.add_role :book_keeper, company

    create(:employment, company:, user: admin)
    admin.add_role :admin, company

    create(:employment, company:, user: employee)
    employee.add_role :employee, company
  end

  context "when user is an admin" do
    before do
      sign_in admin
    end

    describe "#index" do
      before do
        # Ensure expenses are created before request
        expense1
        expense2
        send_request :get, api_v1_expenses_path
      end

      it "returns success" do
        expect(response).to have_http_status(:ok)
      end

      it "returns expenses data in the response" do
        expected_data = [expense2, expense1].map do | expense|
                          {
                            "id" => expense.id,
                            "amount" => expense.amount.to_s,
                            "date" => CompanyDateFormattingService.new(expense.date, company:).process,
                            "expenseType" => expense.expense_type,
                            "categoryName" => expense.category_name,
                            "vendorName" => expense.vendor_name,
                            "description" => expense.description,
                            "receipts" => [],
                            "status" => expense.status,
                            "paidAt" => expense.paid_at,
                            "userId" => expense.user_id,
                            "submitterName" => expense.submitter_name
                          }
                        end
        expect(json_response["expenses"]).to eq(expected_data)
      end

      it "returns pagination information in the response" do
        expect(json_response["pagy"]).to eq(
          { "pages" => 1, "first" => true, "prev" => nil, "next" => nil, "last" => true })
      end

      it "returns list of categories in the response" do
        expect(json_response["categories"]).to eq(
          ExpenseCategory::DEFAULT_CATEGORIES.map { |category| { "name" => category[:name] } })
      end
    end
  end

  context "when the user is an employee" do
    let!(:employee_expense) { create(:expense, company:, category_name: "Food", vendor_name: "Cafe 21", user: employee) }

    before do
      sign_in employee
      expense1
      employee_expense
      send_request :get, api_v1_expenses_path
    end

    it "returns success" do
      expect(response).to have_http_status(:ok)
    end

    it "returns only the employee's submitted expenses" do
      expect(json_response["expenses"].pluck("id")).to eq([employee_expense.id])
    end
  end

  context "when an expense has been soft deleted" do
    before do
      expense1.discard
      sign_in admin
      send_request :get, api_v1_expenses_path
    end

    it "excludes discarded expenses from the list" do
      expect(json_response["expenses"].pluck("id")).not_to include(expense1.id)
    end
  end

  context "when the user is an book keeper" do
    before do
      sign_in book_keeper
      send_request :get, api_v1_expenses_path
    end

    it "is permitted to view expenses" do
      expect(response).to have_http_status(:ok)
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to view expenses" do
      send_request :get, api_v1_expenses_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
