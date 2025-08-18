# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company: company) }

  before do
    create(:employment, company: company, user: user)
    user.add_role(:admin, company)
    sign_in(user)
  end

  describe "GET /api/v1/invoices" do
    context "with pagination and ordering" do
      before do
        # Create invoices with different statuses and updated_at times
        travel_to 5.days.ago do
          create(:invoice, company: company, client: client, status: "draft", invoice_number: "INV001")
        end

        travel_to 4.days.ago do
          create(:invoice, company: company, client: client, status: "paid", invoice_number: "INV002")
        end

        travel_to 3.days.ago do
          create(:invoice, company: company, client: client, status: "overdue", invoice_number: "INV003")
        end

        travel_to 2.days.ago do
          create(:invoice, company: company, client: client, status: "sent", invoice_number: "INV004")
        end

        travel_to 1.day.ago do
          create(:invoice, company: company, client: client, status: "overdue", invoice_number: "INV005")
        end
      end

      it "returns invoices ordered by updated_at DESC" do
        get api_v1_invoices_path, params: { per: 10 }

        expect(response).to have_http_status(:success)

        json = JSON.parse(response.body)
        invoice_numbers = json["invoices"].map { |inv| inv["invoice_number"] || inv["invoiceNumber"] }

        # Most recently updated should come first
        expect(invoice_numbers).to eq(["INV005", "INV004", "INV003", "INV002", "INV001"])
      end

      it "supports pagination with per parameter" do
        get api_v1_invoices_path, params: { per: 2, page: 1 }

        json = JSON.parse(response.body)

        expect(json["invoices"].length).to eq(2)
        expect(json["pagination_details"]["page"]).to eq(1)
        expect(json["pagination_details"]["total"]).to eq(5)
      end

      it "returns second page of results" do
        get api_v1_invoices_path, params: { per: 2, page: 2 }

        json = JSON.parse(response.body)

        expect(json["invoices"].length).to eq(2)
        expect(json["pagination_details"]["page"]).to eq(2)
      end

      it "defaults to 20 items per page when per is not specified" do
        # Create 25 invoices total
        20.times do |i|
          create(:invoice, company: company, client: client, invoice_number: "INV#{100 + i}")
        end

        get api_v1_invoices_path

        json = JSON.parse(response.body)

        expect(json["invoices"].length).to eq(20)
      end

      it "includes recently updated invoices with overdue ones prioritized" do
        get api_v1_invoices_path

        json = JSON.parse(response.body)

        expect(json).to have_key("recently_updated_invoices")
        recently_updated = json["recently_updated_invoices"]

        # Should have at most 10 recently updated invoices
        expect(recently_updated.length).to be <= 10

        # Check that overdue invoices appear first in recently updated
        overdue_invoices = recently_updated.select { |inv| inv["status"] == "overdue" }
        non_overdue_invoices = recently_updated.reject { |inv| inv["status"] == "overdue" }

        if overdue_invoices.any? && non_overdue_invoices.any?
          first_non_overdue_index = recently_updated.index { |inv| inv["status"] != "overdue" }
          last_overdue_index = recently_updated.rindex { |inv| inv["status"] == "overdue" }

          # All overdue invoices should come before non-overdue ones
          expect(last_overdue_index).to be < first_non_overdue_index if first_non_overdue_index
        end
      end
    end

    context "with status filtering" do
      before do
        create(:invoice, company: company, client: client, status: "draft")
        create(:invoice, company: company, client: client, status: "paid")
        create(:invoice, company: company, client: client, status: "overdue")
      end

      it "filters by status parameter" do
        get api_v1_invoices_path, params: { status: "overdue" }

        json = JSON.parse(response.body)

        expect(json["invoices"].all? { |inv| inv["status"] == "overdue" }).to be true
      end

      it "supports multiple statuses parameter" do
        get api_v1_invoices_path, params: { statuses: ["draft", "paid"] }

        json = JSON.parse(response.body)
        statuses = json["invoices"].map { |inv| inv["status"] }

        expect(statuses).to match_array(["draft", "paid"])
        expect(statuses).not_to include("overdue")
      end
    end

    context "with search functionality" do
      before do
        create(:invoice, company: company, client: client, invoice_number: "SPECIAL001")
        create(:invoice, company: company, client: client, invoice_number: "REGULAR002")
      end

      it "searches invoices by query parameter" do
        get api_v1_invoices_path, params: { query: "SPECIAL" }

        json = JSON.parse(response.body)

        # Search uses PG full text search, check if SPECIAL invoice is present
        invoice_numbers = json["invoices"].map { |inv| inv["invoice_number"] || inv["invoiceNumber"] }
        expect(invoice_numbers).to include("SPECIAL001")
      end
    end

    context "with summary calculations" do
      before do
        create(:invoice, company: company, client: client, status: "draft", amount: 1000)
        create(:invoice, company: company, client: client, status: "overdue", amount: 2000, amount_due: 2000)
        create(:invoice, company: company, client: client, status: "paid", amount: 3000)
      end

      it "calculates correct summary amounts" do
        get api_v1_invoices_path

        json = JSON.parse(response.body)
        summary = json["summary"]

        expect(summary["draftAmount"].to_f).to eq(1000.0)
        expect(summary["overdueAmount"].to_f).to eq(2000.0)
        expect(summary["outstandingAmount"].to_f).to eq(2000.0) # Only overdue in this case
      end
    end
  end
end
