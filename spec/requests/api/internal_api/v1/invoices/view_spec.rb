# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices::View#index", type: :request do
  describe "#show" do
    let(:company) { create(:company, :with_logo) }
    let(:client) { create(:client, company:) }
    let(:invoice) { create(:invoice, client:, company:, status: "sent") }

    context "when unauthenticated" do
      it "is able to view the client invoice successfully" do
        send_request :get, api_v1_invoices_view_path(invoice.external_view_key)
        expect(response).to be_successful
      end
    end

    context "when the client viewed the invoice" do
      context "if the invoice status is 'sent'" do
        it "updates the invoice status to viewed" do
          send_request :get, api_v1_invoices_view_path(invoice.external_view_key)
          expect(response).to be_successful
          expect(invoice.reload.status).to eq "viewed"
        end
      end

      context "if the invoice status is not 'sent'" do
        it "does not update the invoice status to viewed and it should remain the same status" do
          invoice.update(status: "draft")
          send_request :get, api_v1_invoices_view_path(invoice.external_view_key)
          expect(response).to be_successful
          expect(invoice.reload.status).to eq "draft"
        end
      end
    end
  end
end
