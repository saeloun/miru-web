# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::ExpenseCategories#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    context "when creates the expense_category" do
      before do
        @expense_category = attributes_for(:expense_category, company:)
        send_request :post, api_v1_expense_categories_path(expense_category: @expense_category)
      end

      it "return the success" do
        expect(response).to have_http_status(:ok)
      end

      it "adds the expense_category entry to the database" do
        expense_category = ExpenseCategory.last
        expect(expense_category.name).to eq(@expense_category[:name])
        expect(expense_category.company_id).to eq(company.id)
      end

      it "return the id in the response" do
        expect(json_response).to have_key("id")
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    describe "when creates the expense_category" do
      it "returns forbidden" do
        send_request :post, api_v1_expense_categories_path(expense_category: {})
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
    end

    describe "when creates the expense_category" do
      it "returns forbidden" do
        send_request :post, api_v1_expense_categories_path(expense_category: {})
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  context "when unauthenticated" do
    describe "when creates the expense_category" do
      it "returns unauthorized" do
        send_request :post, api_v1_expense_categories_path(expense_category: {})
        expect(response).to have_http_status(:unauthorized)
        expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
      end
    end
  end
end
