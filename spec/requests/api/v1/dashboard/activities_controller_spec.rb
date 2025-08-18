# frozen_string_literal: true

require "rails_helper"

RSpec.describe Api::V1::Dashboard::ActivitiesController, type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company: company) }
  let(:project) { create(:project, client: client) }

  before do
    user.add_role(:admin, company)
    sign_in user
    user.update(current_workspace_id: company.id)
  end

  describe "GET /api/v1/dashboard/activities" do
    context "when user is authenticated" do
      context "with no activities" do
        it "returns empty activities array" do
          get "/api/v1/dashboard/activities"

          expect(response).to have_http_status(:ok)
          expect(response_json).to include(
            "activities" => [],
            "has_more" => false,
            "total_count" => 0
          )
        end
      end

      context "with invoice activities" do
        let!(:sent_invoice) { create(:invoice, :sent, company: company, client: client) }
        let!(:paid_invoice) { create(:invoice, :paid, company: company, client: client) }
        let!(:draft_invoice) { create(:invoice, :draft, company: company, client: client) }

        it "returns invoice activities excluding drafts" do
          get "/api/v1/dashboard/activities"

          expect(response).to have_http_status(:ok)
          activities = response_json["activities"]

          expect(activities.length).to eq(2)
          expect(activities.map { |a| a["type"] }).to all(eq("invoice"))
          expect(activities.map { |a| a["metadata"]["invoice_id"] }).to contain_exactly(
            sent_invoice.id, paid_invoice.id
          )
        end

        it "includes correct invoice activity metadata" do
          get "/api/v1/dashboard/activities"

          # Find the activity for the sent_invoice specifically
          invoice_activity = response_json["activities"].find { |a| a["metadata"]["invoice_id"] == sent_invoice.id }

          expect(invoice_activity).not_to be_nil
          expect(invoice_activity).to include(
            "id" => "invoice_#{sent_invoice.id}",
            "type" => "invoice",
            "message" => include(sent_invoice.client.name),
            "icon" => "FileText",
            "metadata" => include(
              "invoice_id" => sent_invoice.id,
              "client_name" => sent_invoice.client.name,
              "amount" => sent_invoice.amount.to_f,
              "currency" => sent_invoice.currency,
              "status" => sent_invoice.status
            )
          )
        end
      end

      context "with payment activities" do
        let!(:invoice) { create(:invoice, :sent, company: company, client: client) }
        let!(:payment1) { create(:payment, invoice: invoice, amount: 1000) }
        let!(:payment2) { create(:payment, invoice: invoice, amount: 500) }

        it "returns payment activities" do
          get "/api/v1/dashboard/activities"

          expect(response).to have_http_status(:ok)
          activities = response_json["activities"]

          payment_activities = activities.select { |a| a["type"] == "payment" }
          expect(payment_activities.length).to eq(2)
          expect(payment_activities.map { |a| a["metadata"]["payment_id"] }).to contain_exactly(
            payment1.id, payment2.id
          )
        end

        it "includes correct payment activity metadata" do
          get "/api/v1/dashboard/activities"

          # Find the activity for payment1 specifically
          payment_activity = response_json["activities"].find { |a| a["metadata"] && a["metadata"]["payment_id"] == payment1.id }

          expect(payment_activity).not_to be_nil
          expect(payment_activity).to include(
            "id" => "payment_#{payment1.id}",
            "type" => "payment",
            "message" => include(payment1.amount.to_s),
            "icon" => "CurrencyDollar",
            "metadata" => include(
              "payment_id" => payment1.id,
              "invoice_id" => invoice.id,
              "client_name" => invoice.client.name,
              "amount" => payment1.amount.to_f
            )
          )
        end
      end

      context "with mixed activities" do
        let!(:invoice1) { create(:invoice, :sent, company: company, client: client, created_at: 3.days.ago) }
        let!(:invoice2) { create(:invoice, :paid, company: company, client: client, created_at: 1.day.ago) }
        let!(:payment) { create(:payment, invoice: invoice1, amount: 500, created_at: 2.days.ago) }

        it "returns activities sorted by timestamp" do
          get "/api/v1/dashboard/activities"

          expect(response).to have_http_status(:ok)
          activities = response_json["activities"]

          expect(activities.length).to eq(3)
          # Should be sorted with most recent first
          timestamps = activities.map { |a| a["timestamp"] }
          expect(timestamps).to eq(timestamps.sort.reverse)
        end
      end

      context "with pagination" do
        before do
          # Create 25 invoices to test pagination
          25.times do |i|
            create(:invoice, :sent, company: company, client: client,
                   created_at: (25 - i).days.ago)
          end
        end

        it "respects per_page parameter" do
          get "/api/v1/dashboard/activities", params: { per_page: 10 }

          expect(response).to have_http_status(:ok)
          expect(response_json["activities"].length).to eq(10)
          expect(response_json["has_more"]).to be true
        end

        it "respects offset parameter" do
          get "/api/v1/dashboard/activities", params: { per_page: 10, offset: 10 }

          expect(response).to have_http_status(:ok)
          expect(response_json["activities"].length).to eq(10)
        end

        it "returns correct total_count" do
          get "/api/v1/dashboard/activities"

          expect(response).to have_http_status(:ok)
          expect(response_json["total_count"]).to eq(25)
        end
      end

      context "when scoped to current company" do
        let(:other_company) { create(:company) }
        let(:other_client) { create(:client, company: other_company) }
        let!(:other_invoice) { create(:invoice, :sent, company: other_company, client: other_client) }
        let!(:company_invoice) { create(:invoice, :sent, company: company, client: client) }

        it "only returns activities for current company" do
          get "/api/v1/dashboard/activities"

          expect(response).to have_http_status(:ok)
          activities = response_json["activities"]

          expect(activities.length).to eq(1)
          expect(activities.first["metadata"]["invoice_id"]).to eq(company_invoice.id)
        end
      end
    end

    context "when user is not authenticated" do
      before { sign_out user }

      it "returns unauthorized" do
        get "/api/v1/dashboard/activities"
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context "when there are data errors" do
      before do
        # Mock an error in the controller
        allow_any_instance_of(described_class).to receive(:fetch_activities).and_raise(StandardError, "Database error")
      end

      it "handles errors gracefully" do
        get "/api/v1/dashboard/activities"

        expect(response).to have_http_status(:internal_server_error)
        expect(response_json).to include(
          "activities" => [],
          "has_more" => false,
          "total_count" => 0,
          "error" => "Failed to fetch activities"
        )
      end
    end
  end

  private

    def response_json
      JSON.parse(response.body)
    end
end
