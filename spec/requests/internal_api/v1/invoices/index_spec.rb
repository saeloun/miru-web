# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Invoices#index", type: :request do
  let(:company) do
    create(:company, clients: create_list(:client_with_invoices, 5))
  end

  let (:user) { create(:user, current_workspace_id: company.id) }

  context "when user is admin" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :admin, company
      sign_in user
    end

    describe "invoices_per_page param" do
      it "returns the number the invoices specified by invoices_per_page" do
        invoices_per_page = 10
        send_request :get, "#{internal_api_v1_invoices_path}?invoices_per_page=#{invoices_per_page}"
        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].size).to eq(10)
      end

      it "errs if invoices_per_page is less than or equal to zero" do
        invoices_per_page = 0
        send_request :get, "#{internal_api_v1_invoices_path}?invoices_per_page=#{invoices_per_page}"
        expect(response).to have_http_status(:bad_request)
      end
    end

    describe "page param" do
      it "returns invoices offset by page" do
        page = 2
        send_request :get, "#{internal_api_v1_invoices_path}?page=#{page}&invoices_per_page=5"
        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].size).to eq(5)
      end

      it "errs if page is less than or equal to zero" do
        page = -1
        send_request :get, "#{internal_api_v1_invoices_path}?page=#{page}&invoices_per_page=5"
        expect(response).to have_http_status(:bad_request)
      end

      it "errs if page overflows the total number of invoices" do
        page = 10
        send_request :get, "#{internal_api_v1_invoices_path}?page=#{page}&invoices_per_page=5"
        expect(response).to have_http_status(:bad_request)
      end
    end

    describe "from param" do
      it "returns invoices issued on or after from" do
        from = Date.parse("2021-01-01")
        send_request :get, "#{internal_api_v1_invoices_path}?from=#{from}"
        expected_invoices = company.invoices.select { |inv| !inv.issue_date.before?(from) }
        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].map { |invoice| invoice["id"] }).to match_array(expected_invoices.map { |invoice| invoice["id"] })
      end
    end

    describe "to param" do
      it "returns invoices issued on or before to" do
        to = Date.parse("2021-01-01")
        send_request :get, "#{internal_api_v1_invoices_path}?to=#{to}"
        expected_invoices = company.invoices.select { |inv| !inv.issue_date.after?(to) }
        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].map { |invoice| invoice["id"] }).to match_array(expected_invoices.map { |invoice| invoice["id"] })
      end
    end

    describe "client_ids[] param" do
      it "returns invoices generated for clients specified by client_ids[]" do
        client_ids = [9, 15, 29]
        send_request :get, "#{internal_api_v1_invoices_path}?client_ids[]=#{client_ids[0]}&client_ids[]=#{client_ids[1]}&client_ids[]=#{client_ids[2]}"
        expected_invoices = company.invoices.select { |inv| client_ids.include?(inv.client_id) }
        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].map { |invoice| invoice["id"] }).to match_array(expected_invoices.map { |invoice| invoice["id"] })
      end
    end

    describe "statuses[] param" do
      it "returns invoices with statuses specified by statuses[]" do
        statuses = [:draft, :overdue, :paid]
        send_request :get, "#{internal_api_v1_invoices_path}?statuses[]=#{statuses[0]}&statuses[]=#{statuses[1]}&statuses[]=#{statuses[2]}"
        expected_invoices = company.invoices.select { |inv| statuses.include?(inv.status.to_sym) }
        expect(response).to have_http_status(:ok)
      end
    end
  end

  context "when user is employee" do
    before do
      create(:company_user, company_id: company.id, user_id: user.id)
      user.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_invoices_path
    end

    it "is not be permitted to view invoices" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to view invoices" do
      send_request :get, internal_api_v1_invoices_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
