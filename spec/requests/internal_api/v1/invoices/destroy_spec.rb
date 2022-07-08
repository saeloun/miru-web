# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Invoices#destroy", type: :request do
  let(:invoice) { create :invoice_with_invoice_line_items }
  let(:client) { invoice.client }
  let(:company) { client.company }
  let(:user) { create :user, current_workspace_id: company.id }

  context "when the user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "#destroy" do
      it "deletes invoice successfully" do
        send_request :delete, internal_api_v1_invoice_path(id: invoice.id)
        expect(response).to be_successful
      end
    end
  end

  context "when the user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :delete, internal_api_v1_invoice_path(id: invoice.id)
    end

    it "is not be permitted to delete an invoice" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when the user is an book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      send_request :delete, internal_api_v1_invoice_path(id: invoice.id)
    end

    it "is not be permitted to delete an invoice" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not be permitted to delete an invoice" do
      send_request :delete, internal_api_v1_invoice_path(id: invoice.id)
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
