# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Expense#create", type: :request do
  let(:receipt) do
    Rack::Test::UploadedFile.new(
      Rails.root.join("spec/support/fixtures/test-image.png"),
      "image/png"
    )
  end
  let(:company) { create(:company) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client: client_1) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }

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

    describe "#create" do
      before do
        @expense = attributes_for(:expense).merge(category_name: "Travel", vendor_name: "Jetway")

        send_request :post, api_v1_expenses_path(expense: @expense)
      end

      it "returns success" do
        expect(response).to have_http_status(:ok)
      end

      it "creates expense entry in the db" do
        expect(json_response["id"]).to eq(Expense.last.id)
        expect(Expense.last.user).to eq(admin)
      end

      it "returns expected data in the response" do
        expected_response = {
          "amount": @expense[:amount].to_s,
          "type": @expense[:expense_type],
          "vendorName": "Jetway",
          "categoryName": "Travel",
          "description": @expense[:description]

        }
        expect(json_response.slice("amount", "type", "vendorName", "categoryName", "description"))
          .to eq(JSON.parse(expected_response.to_json))
      end
    end
  end

  context "when the user is an employee" do
    before do
      sign_in employee
    end

    it "creates the employee expense, attaches the receipt, and notifies reviewers" do
      expect do
        post api_v1_expenses_path, params: {
          expense: {
            amount: 12.25,
            date: Date.current.iso8601,
            description: "Cab reimbursement",
            expense_type: "business",
            category_name: "Travel",
            vendor_name: "Jetway",
            receipts: [receipt]
          }
        }
      end.to have_enqueued_mail(ExpenseMailer, :submitted)

      expect(response).to have_http_status(:ok)
      expect(Expense.last.user).to eq(employee)
      expect(Expense.last.receipts.count).to eq(1)
    end
  end

  context "when the user is an book keeper" do
    before do
      sign_in book_keeper

      send_request :post, api_v1_expenses_path(expense: {
        amount: 24.50,
        date: Date.current.iso8601,
        description: "Team lunch reimbursement",
        expense_type: "business",
        category_name: "Meals",
        vendor_name: "Cafe 21"
      })
    end

    it "is permitted to create an expense" do
      expect(response).to have_http_status(:ok)
      expect(Expense.last.user).to eq(book_keeper)
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to create a expense" do
      send_request :post, api_v1_expenses_path(expense: {})

      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
