# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Invoices#index", type: :request do
  let(:company) do
    create(:company, clients: create_list(:client_with_invoices, 5))
  end

  let(:user) { create(:user, current_workspace_id: company.id) }

  context "when user is a book keeper" do
    before do
      create(:employment, company:, user:)
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

      describe "recently_updated_invoices return value" do
        it "returns top 10 recently updated invoices" do
          send_request :get, internal_api_v1_invoices_path()
          expected_ids = Invoice.order("updated_at desc").limit(10).pluck(:id)
          expect(json_response["recentlyUpdatedInvoices"].pluck("id")).to eq(expected_ids)
        end
      end
    end

    describe "statuses[] param" do
      it "returns invoices with statuses specified by statuses[]" do
        statuses = [:draft, :overdue, :paid]
        send_request :get, internal_api_v1_invoices_path(statuses:)
        expect(response).to have_http_status(:ok)
      end
    end

    describe "search query param" do
      let(:flipkart) { build(:client, company:, name: "flipkart") }
      let(:invoice) { build(:invoice, client: flipkart, invoice_number: "SAI-01") }

      before do
        flipkart.invoices << invoice
        company.clients << flipkart
        company.save!
        company.reload
      end

      it "returns invoices with client.name specified by query" do
        query = "flip"
        send_request :get, internal_api_v1_invoices_path(query:)
        expected_invoices = company.invoices.select { |inv| inv.client.name.include?(query) }

        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].length) .to be_positive
        expect(
          json_response["invoices"].map { |inv|
            inv["id"]
          }).to match_array(
            expected_invoices.map { |inv|
            inv["id"]
          })
      end

      it "returns invoices with invoice_number specified by query" do
        query = "SAI"
        send_request :get, internal_api_v1_invoices_path(query:)
        expected_invoices = company.invoices.select { |inv| inv.invoice_number.include?(query) }
        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].length) .to be_positive
        expect(
          json_response["invoices"].map { |invoice|
            invoice["id"]
          }).to match_array(
            expected_invoices.map { |invoice|
            invoice["id"]
          })
      end
    end
  end

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
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

    describe "recently_updated_invoices return value" do
      it "returns top 10 recently updated invoices" do
        send_request :get, internal_api_v1_invoices_path()
        expected_ids = Invoice.order("updated_at desc").limit(10).pluck(:id)
        expect(json_response["recentlyUpdatedInvoices"].pluck("id")).to eq(expected_ids)
      end
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
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
