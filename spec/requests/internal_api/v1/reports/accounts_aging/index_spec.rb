# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Reports::AccountsAgingController::#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let!(:client1) { create(:client, company:, name: "bob") }
  let!(:client2) { create(:client, company:, name: "ana") }

  context "when user is an admin or owner" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
      # invoice for client 1 due between 0-30 days
      create(
        :invoice, client: client1, status: "overdue", issue_date: 2.month.ago, due_date: 1.month.ago,
        amount_due: 100)
      # invoice for client 1 due between 31-60 days
      create(
        :invoice, client: client1, status: "overdue", issue_date: 3.month.ago, due_date: 2.month.ago,
        amount_due: 200)
      # 2nd invoice for client 1 due between 31-60 days
      create(
        :invoice, client: client1, status: "overdue", issue_date: 3.month.ago, due_date: 2.month.ago + 1.day,
        amount_due: 500)
      # invoice for client 2 due between 61-90 days
      create(
        :invoice, client: client2, status: "overdue", issue_date: 4.month.ago, due_date: 3.month.ago,
        amount_due: 300)
      # invoice for client 2 due in 90+ days
      create(
        :invoice, client: client2, status: "overdue", issue_date: 5.month.ago, due_date: 4.month.ago,
        amount_due: 400)
    end

    context "when reports page's request is made" do
      before do
        get internal_api_v1_reports_accounts_aging_index_path
      end

      it "returns the 200 http response" do
        expect(response).to have_http_status(:ok)
      end

      it "returns the clients data in alaphabetical order with amount details" do
        expect(json_response["report"]["clients"][0]["id"]).to eq(client2.id)
        expect(json_response["report"]["clients"][1]["id"]).to eq(client1.id)
      end

      it "returns amount overdue for client2 in response" do
        expect(json_response["report"]["clients"][0]["amount_overdue"]["zero_to_thirty_days"]).to eq(0)
        expect(json_response["report"]["clients"][0]["amount_overdue"]["thirty_one_to_sixty_days"]).to eq(0)
        expect(json_response["report"]["clients"][0]["amount_overdue"]["sixty_one_to_ninety_days"]).to eq("300.0")
        expect(json_response["report"]["clients"][0]["amount_overdue"]["ninety_plus_days"]).to eq("400.0")
        expect(json_response["report"]["clients"][0]["amount_overdue"]["total"]).to eq("700.0")
      end

      it "returns correct client1 amount overdue in response" do
        expect(json_response["report"]["clients"][1]["amount_overdue"]["zero_to_thirty_days"]).to eq("100.0")
        expect(json_response["report"]["clients"][1]["amount_overdue"]["thirty_one_to_sixty_days"]).to eq("700.0")
        expect(json_response["report"]["clients"][1]["amount_overdue"]["sixty_one_to_ninety_days"]).to eq(0)
        expect(json_response["report"]["clients"][1]["amount_overdue"]["ninety_plus_days"]).to eq(0)
        expect(json_response["report"]["clients"][1]["amount_overdue"]["total"]).to eq("800.0")
      end

      it "returns correct response for Total amount overdue for all clients in current company" do
        expect(json_response["report"]["total_amount_overdue"]["zero_to_thirty_days"]).to eq("100.0")
        expect(json_response["report"]["total_amount_overdue"]["thirty_one_to_sixty_days"]).to eq("700.0")
        expect(json_response["report"]["total_amount_overdue"]["sixty_one_to_ninety_days"]).to eq("300.0")
        expect(json_response["report"]["total_amount_overdue"]["ninety_plus_days"]).to eq("400.0")
        expect(json_response["report"]["total_amount_overdue"]["total"]).to eq("1500.0")
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_reports_accounts_aging_index_path
    end

    it "is not permitted to view client revenue report" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      send_request :get, internal_api_v1_reports_accounts_aging_index_path
    end

    it "is not permitted to view client revenue report" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not permitted to view client revenue report" do
      send_request :get, internal_api_v1_reports_accounts_aging_index_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
