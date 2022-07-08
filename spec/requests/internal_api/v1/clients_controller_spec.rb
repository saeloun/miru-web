# frozen_string_literal: true

require "rails_helper"

RSpec.describe InternalApi::V1::ClientsController, type: :request do
  let(:company) { create(:company) }
  let(:client) { create(:client, company:) }

  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user: admin)
    create(:employment, company:, user: employee)
    admin.add_role :admin, company
    employee.add_role :employee, company
    book_keeper.add_role :book_keeper, company
  end

  describe "GET new_invoice_line_items" do
    subject { send_request :get, new_invoice_line_items_internal_api_v1_client_path(client) }

    context "when user is an admin" do
      before { sign_in admin }

      it "returns json data with 200 status" do
        expect(subject).to eq 200
        expect(json_response["client"]["id"]).to eq client.id
        expect(json_response["client"]["company_id"]).to eq company.id
      end
    end

    context "when user is an employee" do
      before { sign_in employee }

      it "returns error with 403 status" do
        expect(subject).to eq 403
        expect(json_response["errors"]).to eq "You are not authorized to perform this action."
      end
    end

    context "when user is a book keeper" do
      before { sign_in book_keeper }

      it "returns error with 403 status" do
        expect(subject).to eq 403
        expect(json_response["errors"]).to eq "You are not authorized to perform this action."
      end
    end

    context "when user does not have a role" do
      before { sign_in user }

      it "returns error with 403 status" do
        expect(subject).to eq 403
        expect(json_response["errors"]).to eq "You are not authorized to perform this action."
      end
    end
  end
end
