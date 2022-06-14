# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::InvoicesController", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:invoice) { create(:invoice, client:) }

  before do
    admin.add_role :admin, company
    employee.add_role :employee, company
    book_keeper.add_role :book_keeper, company
  end

  describe "GET edit" do
    subject { send_request :get, edit_internal_api_v1_invoice_path(invoice) }

    context "when user is an admin" do
      before { sign_in admin }

      it "returns 200 successfull response with data" do
        expect(subject).to eq 200
        expect(json_response["id"]).to eq invoice.id
        expect(json_response["company"]["id"]).to eq invoice.company.id
      end
    end

    context "when user is an employee" do
      before { sign_in employee }

      it "returns 403 status with an error message" do
        expect(subject).to eq 403
        expect(json_response["errors"]).to eq "You are not authorized to perform this action."
      end
    end

    context "when user is a book keeper" do
      before { sign_in book_keeper }

      it "returns 403 status with an error message" do
        expect(subject).to eq 403
        expect(json_response["errors"]).to eq "You are not authorized to perform this action."
      end
    end
  end
end
