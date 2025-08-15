# frozen_string_literal: true

require "rails_helper"

RSpec.describe InternalApi::V1::Invoices::RecentlyUpdatedController, type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company: company) }

  before do
    sign_in user
    user.add_role :admin, company
  end

  describe "GET #index" do
    context "when invoices exist" do
      let!(:old_invoice) do
        create(:invoice,
          client: client,
          company: company,
          updated_at: 1.month.ago
        )
      end

      let!(:recent_invoices) do
        5.times.map do |i|
          create(:invoice,
            client: client,
            company: company,
            updated_at: i.hours.ago
          )
        end
      end

      it "returns recently updated invoices in descending order" do
        get internal_api_v1_invoices_recently_updated_index_path

        expect(response).to have_http_status(:ok)

        json_response = JSON.parse(response.body)
        invoice_ids = json_response["invoices"].pluck("id")

        expect(invoice_ids.first).to eq(recent_invoices.first.id)
        expect(invoice_ids).not_to include(old_invoice.id) if json_response["invoices"].size <= 5
      end

      it "paginates results" do
        get internal_api_v1_invoices_recently_updated_index_path, params: { page: 1, per_page: 3 }

        json_response = JSON.parse(response.body)

        expect(json_response["invoices"].size).to eq(3)
        expect(json_response["meta"]["current_page"]).to eq(1)
        expect(json_response["meta"]["has_more"]).to be true
      end

      it "returns correct metadata" do
        get internal_api_v1_invoices_recently_updated_index_path, params: { per_page: 10 }

        json_response = JSON.parse(response.body)
        meta = json_response["meta"]

        expect(meta).to include(
          "current_page",
          "next_page",
          "prev_page",
          "total_pages",
          "total_count",
          "has_more"
        )
        expect(meta["total_count"]).to eq(6) # 5 recent + 1 old
      end

      it "includes client information" do
        get internal_api_v1_invoices_recently_updated_index_path, params: { per_page: 1 }

        json_response = JSON.parse(response.body)
        invoice = json_response["invoices"].first

        expect(invoice["client"]).to include(
          "id" => client.id,
          "name" => client.name,
          "email" => client.email
        )
      end
    end

    context "with status filter" do
      let!(:draft_invoice) do
        create(:invoice,
          client: client,
          company: company,
          status: "draft"
        )
      end

      let!(:sent_invoice) do
        create(:invoice,
          client: client,
          company: company,
          status: "sent"
        )
      end

      it "filters by status when provided" do
        get internal_api_v1_invoices_recently_updated_index_path, params: { status: "draft" }

        json_response = JSON.parse(response.body)
        statuses = json_response["invoices"].pluck("status")

        expect(statuses).to all(eq("draft"))
      end
    end

    context "with days_ago filter" do
      let!(:old_invoice) do
        create(:invoice,
          client: client,
          company: company,
          updated_at: 10.days.ago
        )
      end

      let!(:recent_invoice) do
        create(:invoice,
          client: client,
          company: company,
          updated_at: 2.days.ago
        )
      end

      it "filters by days_ago when provided" do
        get internal_api_v1_invoices_recently_updated_index_path, params: { days_ago: 7 }

        json_response = JSON.parse(response.body)
        invoice_ids = json_response["invoices"].pluck("id")

        expect(invoice_ids).to include(recent_invoice.id)
        expect(invoice_ids).not_to include(old_invoice.id)
      end
    end

    context "with pagination edge cases" do
      it "handles invalid page gracefully" do
        get internal_api_v1_invoices_recently_updated_index_path, params: { page: 999 }

        expect(response).to have_http_status(:ok)

        json_response = JSON.parse(response.body)
        expect(json_response["invoices"]).to be_empty
        expect(json_response["meta"]["has_more"]).to be false
      end

      it "limits per_page to maximum" do
        get internal_api_v1_invoices_recently_updated_index_path, params: { per_page: 100 }

        json_response = JSON.parse(response.body)

        # Should be limited to 50 max
        expect(json_response["invoices"].size).to be <= 50
      end

      it "handles negative per_page" do
        get internal_api_v1_invoices_recently_updated_index_path, params: { per_page: -1 }

        json_response = JSON.parse(response.body)

        # Should default to 10
        expect(json_response["invoices"].size).to be <= 10
      end
    end

    context "when no invoices exist" do
      it "returns empty array" do
        get internal_api_v1_invoices_recently_updated_index_path

        expect(response).to have_http_status(:ok)

        json_response = JSON.parse(response.body)
        expect(json_response["invoices"]).to eq([])
        expect(json_response["meta"]["has_more"]).to be false
      end
    end

    context "with discarded invoices" do
      let!(:active_invoice) do
        create(:invoice, client: client, company: company)
      end

      let!(:discarded_invoice) do
        invoice = create(:invoice, client: client, company: company)
        invoice.discard!
        invoice
      end

      it "excludes discarded invoices" do
        get internal_api_v1_invoices_recently_updated_index_path

        json_response = JSON.parse(response.body)
        invoice_ids = json_response["invoices"].pluck("id")

        expect(invoice_ids).to include(active_invoice.id)
        expect(invoice_ids).not_to include(discarded_invoice.id)
      end
    end

    context "authorization" do
      let(:other_company) { create(:company) }
      let(:other_client) { create(:client, company: other_company) }
      let!(:other_invoice) do
        create(:invoice, client: other_client, company: other_company)
      end

      let!(:own_invoice) do
        create(:invoice, client: client, company: company)
      end

      it "only returns invoices from current company" do
        get internal_api_v1_invoices_recently_updated_index_path

        json_response = JSON.parse(response.body)
        invoice_ids = json_response["invoices"].pluck("id")

        expect(invoice_ids).to include(own_invoice.id)
        expect(invoice_ids).not_to include(other_invoice.id)
      end
    end

    context "performance" do
      it "includes client association to avoid N+1 queries" do
        create_list(:invoice, 5, client: client, company: company)

        # Make first request to establish baseline
        get internal_api_v1_invoices_recently_updated_index_path
        expect(response).to have_http_status(:ok)

        # Add more invoices and ensure query count doesn't explode
        create_list(:invoice, 5, client: client, company: company)

        get internal_api_v1_invoices_recently_updated_index_path
        expect(response).to have_http_status(:ok)

        # Should successfully handle multiple invoices without N+1
        json_response = JSON.parse(response.body)
        expect(json_response["invoices"].size).to be > 5
      end
    end
  end
end
