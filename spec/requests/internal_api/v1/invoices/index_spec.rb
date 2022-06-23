# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Invoices#index", type: :request do
  let(:company) do
    create(:company, clients: create_list(:client_with_invoices, 5))
  end

  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is a book keeper" do
    before do
      create(:company_user, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
    end

    describe "invoices_per_page param" do
      it "returns the number the invoices specified by invoices_per_page" do
        invoices_per_page = 10
        send_request :get, internal_api_v1_invoices_path(invoices_per_page:)
        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].size).to eq(10)
      end

      it "throws 400 bad_request error if invoices_per_page is less than or equal to zero" do
        invoices_per_page = 0
        send_request :get, internal_api_v1_invoices_path(invoices_per_page:)
        expect(response).to have_http_status(:bad_request)
      end
    end

    describe "page param" do
      it "returns invoices offset by page" do
        page, invoices_per_page = 2, 5
        send_request :get, internal_api_v1_invoices_path(page:, invoices_per_page:)
        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].size).to eq(5)
      end

      it "throws 400 bad_request error if page is less than or equal to zero" do
        page, invoices_per_page = -1, 5
        send_request :get, internal_api_v1_invoices_path(page:, invoices_per_page:)
        expect(response).to have_http_status(:bad_request)
      end

      it "throws 400 bad_request error if page overflows the total number of invoices" do
        page, invoices_per_page = 10, 5
        send_request :get, internal_api_v1_invoices_path(page:, invoices_per_page:)
        expect(response).to have_http_status(:bad_request)
      end
    end

    describe "from param" do
      it "returns invoices issued on or after from" do
        from = Date.parse("2021-01-01")
        send_request :get, internal_api_v1_invoices_path(from:)
        expected_invoices = company.invoices.select { |inv| !inv.issue_date.before?(from) }
        expect(response).to have_http_status(:ok)
        expect(
          json_response["invoices"].map { |invoice|
            invoice["id"]
          }).to match_array(
            expected_invoices.map { |invoice|
              invoice["id"]
            })
      end
    end

    describe "to param" do
      it "returns invoices issued on or before to" do
        to = Date.parse("2021-01-01")
        send_request :get, internal_api_v1_invoices_path(to:)
        expected_invoices = company.invoices.select { |inv| !inv.issue_date.after?(to) }
        expect(response).to have_http_status(:ok)
        expect(
          json_response["invoices"].map { |invoice|
            invoice["id"]
          }).to match_array(
            expected_invoices.map { |invoice|
              invoice["id"]
            })
      end
    end

    describe "client_ids[] param" do
      it "returns invoices generated for clients specified by client_ids[]" do
        client_ids = [9, 15, 29]
        send_request :get, internal_api_v1_invoices_path(client_ids:)
        expected_invoices = company.invoices.select { |inv| client_ids.include?(inv.client_id) }
        expect(response).to have_http_status(:ok)
        expect(
          json_response["invoices"].map { |invoice|
            invoice["id"]
          }).to match_array(
            expected_invoices.map { |invoice|
              invoice["id"]
            })
      end
    end

    describe "statuses[] param" do
      it "returns invoices with statuses specified by statuses[]" do
        statuses = [:draft, :overdue, :paid]
        send_request :get, internal_api_v1_invoices_path(statuses:)
        expect(response).to have_http_status(:ok)
      end
    end
  end

  context "when user is an admin" do
    before do
      create(:company_user, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "invoices_per_page param" do
      it "returns the number the invoices specified by invoices_per_page" do
        invoices_per_page = 10
        send_request :get, internal_api_v1_invoices_path(invoices_per_page:)
        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].size).to eq(10)
      end

      it "throws 400 bad_request error if invoices_per_page is less than or equal to zero" do
        invoices_per_page = 0
        send_request :get, internal_api_v1_invoices_path(invoices_per_page:)
        expect(response).to have_http_status(:bad_request)
      end
    end

    describe "page param" do
      it "returns invoices offset by page" do
        page, invoices_per_page = 2, 5
        send_request :get, internal_api_v1_invoices_path(page:, invoices_per_page:)
        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].size).to eq(5)
      end

      it "throws 400 bad_request error if page is less than or equal to zero" do
        page, invoices_per_page = -1, 5
        send_request :get, internal_api_v1_invoices_path(page:, invoices_per_page:)
        expect(response).to have_http_status(:bad_request)
      end

      it "throws 400 bad_request error if page overflows the total number of invoices" do
        page, invoices_per_page = 10, 5
        send_request :get, internal_api_v1_invoices_path(page:, invoices_per_page:)
        expect(response).to have_http_status(:bad_request)
      end
    end

    describe "from param" do
      it "returns invoices issued on or after from" do
        from = Date.parse("2021-01-01")
        send_request :get, internal_api_v1_invoices_path(from:)
        expected_invoices = company.invoices.select { |inv| !inv.issue_date.before?(from) }
        expect(response).to have_http_status(:ok)
        expect(
          json_response["invoices"].map { |invoice|
            invoice["id"]
          }).to match_array(
            expected_invoices.map { |invoice|
              invoice["id"]
            })
      end
    end

    describe "to param" do
      it "returns invoices issued on or before to" do
        to = Date.parse("2021-01-01")
        send_request :get, internal_api_v1_invoices_path(to:)
        expected_invoices = company.invoices.select { |inv| !inv.issue_date.after?(to) }
        expect(response).to have_http_status(:ok)
        expect(
          json_response["invoices"].map { |invoice|
            invoice["id"]
          }).to match_array(
            expected_invoices.map { |invoice|
              invoice["id"]
            })
      end
    end

    describe "client_ids[] param" do
      it "returns invoices generated for clients specified by client_ids[]" do
        client_ids = [9, 15, 29]
        send_request :get, internal_api_v1_invoices_path(client_ids:)
        expected_invoices = company.invoices.select { |inv| client_ids.include?(inv.client_id) }
        expect(response).to have_http_status(:ok)
        expect(
          json_response["invoices"].map { |invoice|
            invoice["id"]
          }).to match_array(
            expected_invoices.map { |invoice|
              invoice["id"]
            })
      end
    end

    describe "statuses[] param" do
      it "returns invoices with statuses specified by statuses[]" do
        statuses = [:draft, :overdue, :paid]
        send_request :get, internal_api_v1_invoices_path(statuses:)
        expect(response).to have_http_status(:ok)
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:company_user, company:, user:)
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
