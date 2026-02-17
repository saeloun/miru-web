# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invoices::BulkDeletionController", type: :request do
  let(:invoice1) { create :invoice_with_invoice_line_items }
  let(:invoice2) { create :invoice_with_invoice_line_items }
  let(:invoices) { [invoice1.id, invoice2.id] }
  let(:client) { invoice1.client }
  let(:company) { client.company }
  let(:user) { create :user, current_workspace_id: company.id }

  before do
    allow(Current).to receive(:user).and_return(user)
    allow(Current).to receive(:company).and_return(company)
  end

  context "when the user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    describe "#destroy" do
      it "deletes invoices successfully" do
        send_request :post, api_v1_invoices_bulk_deletion_index_path(invoices), headers: auth_headers(user)
        expect(response).to be_successful
      end
    end
  end
end
