# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Team#destroy", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:team_member) { create(:user, current_workspace_id: company.id) }

  describe "when user is authorised" do
    context "when team member is present in company" do
      before do
        create(:company_user, company:, user: team_member)
        create(:company_user, company:, user:)
        user.add_role :admin, company
        sign_in user
        send_request :delete, internal_api_v1_team_path(team_member)
      end

      it "returns success json response" do
        expect(response).to be_successful
        expect(json_response["notice"]).to eq(I18n.t("team.delete.success.message"))
      end

      it "Discards the team member" do
        team_member.reload
        expect(team_member.discarded?).to be_truthy
      end
    end

    context "when team member is not present in company" do
      before do
        create(:company_user, company:, user:)
        user.add_role :admin, company
        sign_in user
        send_request :delete, internal_api_v1_team_path(team_member)
      end

      it "returns unsuccessful response" do
        expect(response).not_to be_successful
      end

      it "does not Discard the team member" do
        team_member.reload
        expect(team_member.discarded?).to be_falsy
      end
    end
  end

  context "when user is unauthorised" do
    before do
      create(:company_user, company:, user: team_member)
      create(:company_user, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :delete, internal_api_v1_team_path(team_member)
    end

    it "return forbidden response with error" do
      expect(response).not_to be_successful
      expect(response).to have_http_status :forbidden
      expect(json_response["errors"]).to eq(I18n.t("pundit.team_policy.destroy?"))
    end

    it "does not Discard the team member" do
      team_member.reload
      expect(team_member.discarded?).to be_falsy
    end
  end

  context "when user is unauthenticated" do
    it "return unauthorized response with error" do
      send_request :delete, internal_api_v1_team_path(team_member)
      expect(response).not_to be_successful
      expect(response).to have_http_status :unauthorized
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
