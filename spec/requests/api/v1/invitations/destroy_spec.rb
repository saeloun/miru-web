# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Invitations#destroy", type: :request do
  let(:company) { create(:company) }
  let(:admin) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:book_keeper) { create(:user, current_workspace_id: company.id) }
  let!(:invitation) { create(:invitation, company:, sender: admin, role: :employee) }

  before do
    create(:employment, company:, user: admin)
    admin.add_role :admin, company

    create(:employment, company:, user: employee)
    employee.add_role :employee, company

    create(:employment, company:, user: book_keeper)
    book_keeper.add_role :book_keeper, company
  end

  context "when current user is an admin" do
    before do
      sign_in admin
    end

    it "deletes invitation" do
      invitation_id = invitation.id

      expect {
        send_request :delete, api_v1_invitation_path(invitation), headers: auth_headers(admin)
      }.to change(Invitation, :count).by(-1)

      expect(response).to have_http_status(:ok)
      expect(json_response["id"]).to eq(invitation_id)
      expect(json_response["notice"]).to eq(I18n.t("invitation.delete.success.message"))
    end
  end

  context "when current user is an employee" do
    before do
      sign_in employee
      send_request :delete, api_v1_invitation_path(invitation), headers: auth_headers(employee)
    end

    it "returns forbidden" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when current user is a book keeper" do
    before do
      sign_in book_keeper
      send_request :delete, api_v1_invitation_path(invitation), headers: auth_headers(book_keeper)
    end

    it "returns forbidden" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "returns unauthorized" do
      send_request :delete, api_v1_invitation_path(invitation)

      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
