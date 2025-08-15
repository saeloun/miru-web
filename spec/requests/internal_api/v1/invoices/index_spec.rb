# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Invoices#index", type: :request do
  let(:company) do
    create(:company_with_invoices, length: 10)
  end

  let(:book_keeper) { create(:user, current_workspace_id: company.id) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user: book_keeper)
    book_keeper.add_role :book_keeper, company

    create(:employment, company:, user: admin)
    admin.add_role :admin, company

    create(:employment, company:, user: employee)
    employee.add_role :employee, company

    # No search index refresh needed with PG search
  end

  context "when user is a book keeper" do
    before do
      sign_in book_keeper
    end

    describe "invoices_per_page param" do
      it "returns the number the invoices specified by invoices_per_page" do
        invoices_per_page = 10
        send_request :get, internal_api_v1_invoices_path(invoices_per_page:), headers: auth_headers(book_keeper)
        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].size).to eq(10)
      end

      it "return total invoices if invoices_per_page is less than or equal to zero" do
        invoices_per_page = 0
        send_request :get, internal_api_v1_invoices_path(invoices_per_page:), headers: auth_headers(book_keeper)
        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].size).to eq(company.invoices.kept.count)
      end
    end

    describe "page param" do
      it "returns invoices offset by page" do
        page, invoices_per_page = 1, 5
        send_request :get, internal_api_v1_invoices_path(page:, invoices_per_page:), headers: auth_headers(book_keeper)
        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].size).to eq(5)
      end

      it "return invoices offset by page one if page is less than or equal to zero" do
        page, invoices_per_page = -1, 5
        send_request :get, internal_api_v1_invoices_path(page:, invoices_per_page:), headers: auth_headers(book_keeper)
        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].size).to eq(5)
      end

      it "return zero invoices if page overflows the total number of invoices" do
        page, invoices_per_page = 10, 5
        send_request :get, internal_api_v1_invoices_path(page:, invoices_per_page:), headers: auth_headers(book_keeper)
        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].size).to eq(0)
      end
    end

    describe "date_range" do
      invoices_per_page = 10
      it "returns all invoices issued if nothing is provided" do
        send_request :get, internal_api_v1_invoices_path(date_range: nil, invoices_per_page:),
          headers: auth_headers(book_keeper)
        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].size).to eq(10)
      end
    end

    describe "client_ids[] param" do
      it "returns invoices generated for clients specified by client_ids[]" do
        client = [9, 15, 29]
        send_request :get, internal_api_v1_invoices_path(client:), headers: auth_headers(book_keeper)
        expected_invoices = company.invoices.select { |inv| client.include?(inv.client_id) }
        expect(response).to have_http_status(:ok)
        expect(
          json_response["invoices"].pluck("id")
        ).to match_array(
          expected_invoices.pluck("id")
        )
        expect(
          json_response["invoices"].map { |invoice| invoice["client"]["logo"] }
        ).to match_array(
          expected_invoices.map { |invoice| invoice.client.logo }
        )
      end

      describe "recently_updated_invoices return value" do
        it "returns top 10 recently updated invoices" do
          send_request :get, internal_api_v1_invoices_path(), headers: auth_headers(book_keeper)
          expected_invoices = Invoice.order("updated_at desc").limit(10)
          expected_ids = expected_invoices.pluck(:id)
          expect(json_response["recentlyUpdatedInvoices"].pluck("id")).to eq(expected_ids)
          expect(
            json_response["recentlyUpdatedInvoices"].map { |invoice| invoice["client"]["logo"] }
          ).to match_array(
            expected_invoices.map { |invoice| invoice.client.logo_url }
          )
        end
      end
    end

    describe "statuses[] param" do
      it "returns invoices with statuses specified by statuses[]" do
        statuses = [:draft, :overdue, :paid]
        send_request :get, internal_api_v1_invoices_path(statuses:), headers: auth_headers(book_keeper)
        expect(response).to have_http_status(:ok)
      end
    end

    describe "search query" do
      it "returns invoices when query partially matches client name" do
        query = company.clients.first.name[0..2]
        send_request :get, internal_api_v1_invoices_path(query:), headers: auth_headers(book_keeper)
        expected_invoices = company.invoices.kept.select { |inv|
          inv.client.name.include?(query) || inv.invoice_number.include?(query)
        }

        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].length) .to be_positive
        expect(
          json_response["invoices"].pluck("id")
        ).to match_array(
          expected_invoices.pluck("id")
        )
      end

      it "returns invoices when query partially matches invoice number" do
        query = company.invoices.first.invoice_number[0..2]
        send_request :get, internal_api_v1_invoices_path(query:), headers: auth_headers(book_keeper)
        expected_invoices = company.invoices.kept.select { |inv|
          inv.client.name.include?(query) || inv.invoice_number.include?(query)
        }

        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].length).to be_positive
        expect(
          json_response["invoices"].pluck("id")
        ).to match_array(
          expected_invoices.pluck("id")
        )
      end
    end
  end

  context "when user is an admin" do
    before do
      sign_in admin
    end

    describe "search for wildcard" do
      it "returns the only kept invoices" do
        company.invoices.first.discard!

        invoices_per_page = 10
        send_request :get, internal_api_v1_invoices_path(invoices_per_page:), headers: auth_headers(admin)
        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].size).to eq(9)
      end
    end

    describe "invoices_per_page param" do
      it "returns the number the invoices specified by invoices_per_page" do
        invoices_per_page = 10
        send_request :get, internal_api_v1_invoices_path(invoices_per_page:), headers: auth_headers(admin)
        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].size).to eq(10)
      end

      it "return total invoices if invoices_per_page is less than or equal to zero" do
        invoices_per_page = 0
        send_request :get, internal_api_v1_invoices_path(invoices_per_page:), headers: auth_headers(admin)
        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].size).to eq(company.invoices.kept.count)
      end
    end

    describe "page param" do
      it "returns invoices offset by page" do
        page, invoices_per_page = 1, 5
        send_request :get, internal_api_v1_invoices_path(page:, invoices_per_page:), headers: auth_headers(admin)
        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].size).to eq(5)
      end

      it "return invoices offset by page one if page is less than or equal to zero" do
        page, invoices_per_page = -1, 5
        send_request :get, internal_api_v1_invoices_path(page:, invoices_per_page:), headers: auth_headers(admin)
        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].size).to eq(5)
      end

      it "return zero invoices if page overflows the total number of invoices" do
        page, invoices_per_page = 10, 5
        send_request :get, internal_api_v1_invoices_path(page:, invoices_per_page:), headers: auth_headers(admin)
        expect(response).to have_http_status(:ok)
        expect(json_response["invoices"].size).to eq(0)
      end
    end

    describe "from_to with date_range" do
      it "returns invoices with in the custom date range" do
        from_date_range = Date.parse("2022-01-01")
        to_date_range = Date.today
        send_request :get,
          internal_api_v1_invoices_path(date_range: "custom", from_date_range:, to_date_range:),
          headers: auth_headers(admin)
        expected_invoices = company.invoices.during(from_date_range..to_date_range)

        expect(response).to have_http_status(:ok)
        expect(
          json_response["invoices"].pluck("id")
        ).to match_array(
          expected_invoices.pluck("id")
        )
      end
    end

    describe "client[] param" do
      it "returns invoices generated for clients specified by client_ids[]" do
        client = [9, 15, 29]
        send_request :get, internal_api_v1_invoices_path(client:), headers: auth_headers(admin)
        expected_invoices = company.invoices.select { |inv| client.include?(inv.client_id) }
        expect(response).to have_http_status(:ok)
        expect(
          json_response["invoices"].pluck("id")
        ).to match_array(
          expected_invoices.pluck("id")
        )
      end
    end

    describe "statuses[] param" do
      it "returns invoices with statuses specified by statuses[]" do
        statuses = [:draft, :overdue, :paid]
        send_request :get, internal_api_v1_invoices_path(statuses:), headers: auth_headers(admin)
        expect(response).to have_http_status(:ok)
      end
    end

    describe "recently_updated_invoices return value" do
      it "returns top 10 recently updated invoices" do
        send_request :get, internal_api_v1_invoices_path(), headers: auth_headers(admin)
        expected_ids = Invoice.kept.order("updated_at desc").limit(10).pluck(:id)
        expect(json_response["recentlyUpdatedInvoices"].pluck("id")).to eq(expected_ids)
      end
    end

    describe "summary of invoices" do
      before do
        Invoice.overdue.first&.discard!
        Invoice.sent.first&.discard!
        Invoice.draft.first&.discard!
        status_and_amount = Invoice.all.kept.group_by(&:status).transform_values { |invoices|
          invoices.sum { |invoice|
            invoice.base_currency_amount.to_f > 0.00 ? invoice.base_currency_amount : invoice.amount
          }
        }
        status_and_amount.default = 0
        @outstanding_amount = status_and_amount["sent"] + status_and_amount["viewed"] + status_and_amount["overdue"]
        @draft_amount = status_and_amount["draft"]
        @overdue_amount = status_and_amount["overdue"]
      end

      it "returns correct summary" do
        send_request :get, internal_api_v1_invoices_path(), headers: auth_headers(admin)
        expected_data = {
          overdueAmount: @overdue_amount,
          outstandingAmount: @outstanding_amount,
          draftAmount: @draft_amount,
          totalAmount: (@overdue_amount + @outstanding_amount + @draft_amount).to_s,
          currency: company.base_currency
        }
        expect(json_response["summary"]).to eq(JSON.parse(expected_data.to_json))
      end
    end
  end

  context "when user is an employee" do
    before do
      sign_in employee
      send_request :get, internal_api_v1_invoices_path, headers: auth_headers(employee)
    end

    it "is not be permitted to view invoices" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to view invoices" do
      send_request :get, internal_api_v1_invoices_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
