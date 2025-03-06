# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::InvoicesController", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:invoice) { create(:invoice, client:, company:) }

  before do
    admin.add_role :admin, company
    employee.add_role :employee, company
    book_keeper.add_role :book_keeper, company
  end

  describe "GET edit" do
    context "when user is an admin" do
      before { sign_in admin }

      it "returns 200 successful response with data" do
        send_request :get, edit_internal_api_v1_invoice_path(invoice), headers: auth_headers(admin)
        expect(response).to have_http_status(:ok)
        expect(json_response["id"]).to eq invoice.id
        expect(json_response["company"]["id"]).to eq invoice.company.id
      end
    end

    context "when user is an employee" do
      before { sign_in employee }

      it "returns 403 status with an error message" do
        send_request :get, edit_internal_api_v1_invoice_path(invoice), headers: auth_headers(employee)
        expect(response).to have_http_status(:forbidden)
        expect(json_response["errors"]).to eq "You are not authorized to perform this action."
      end
    end

    context "when user is a book keeper" do
      before { sign_in book_keeper }

      it "returns 403 status with an error message" do
        send_request :get, edit_internal_api_v1_invoice_path(invoice), headers: auth_headers(book_keeper)
        expect(response).to have_http_status(:forbidden)
        expect(json_response["errors"]).to eq "You are not authorized to perform this action."
      end
    end
  end
end
