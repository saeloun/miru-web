# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices::BulkDeletion#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    it "deletes the specified invoices" do
      invoices = create_list(:invoice, 3, company:, client:)
      invoice_ids = invoices.map(&:id)

      expect {
        send_request :post, api_v1_invoices_bulk_deletion_index_path,
          params: { invoices_ids: invoice_ids },
          headers: auth_headers(user)
      }.to change(Invoice, :count).by(-3)

      expect(response).to have_http_status(:no_content)
    end

    it "handles empty invoice ids gracefully" do
      send_request :post, api_v1_invoices_bulk_deletion_index_path,
        params: { invoices_ids: [] },
        headers: auth_headers(user)
      expect(response).to have_http_status(:no_content)
    end
  end

  context "when user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    it "is not permitted" do
      send_request :post, api_v1_invoices_bulk_deletion_index_path,
        params: { invoices_ids: [] },
        headers: auth_headers(user)
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "returns unauthorized" do
      send_request :post, api_v1_invoices_bulk_deletion_index_path,
        params: { invoices_ids: [] }
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
