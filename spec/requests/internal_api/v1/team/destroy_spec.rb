# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Team#destroy", type: :request do
  let(:company) { create(:company) }

  describe "when current user is admin" do
    let(:admin_user) { create(:user, current_workspace_id: company.id) }

    context "when team member is present in company" do
      let(:team_user) { create(:user, current_workspace_id: company.id) }

      before do
        @team_company_user = create(:employment, company:, user: team_user)
        create(:employment, company:, user: admin_user)
        admin_user.add_role :admin, company
        @team_company_user.user.add_role :employee, company
        @team_company_user.user.add_role :book_keeper, create(:company)
        sign_in admin_user
      end

      it "returns success json response with team member" do
        expect { send_request :delete, internal_api_v1_team_path(@team_company_user.user) }
          .to change(company.employments.kept, :count).by(-1)

        expect(response).to be_successful
        expect(json_response["notice"]).to eq(I18n.t("team.delete.success.message"))
        expect(json_response["user"]["id"]).to eq(team_user.id)
      end

      it "Discards the employments and role for employee" do
        expect(@team_company_user.user.roles.present?).to be true
        send_request :delete, internal_api_v1_team_path(@team_company_user.user)

        expect(@team_company_user.reload.discarded?).to be_truthy
        expect(team_user.reload.employments.discarded.count).to eq(1)
        expect(@team_company_user.user.roles.present?).to be true
        expect(@team_company_user.user.roles.where(resource_id: company.id).present?).to be false
      end
    end

    context "when team member is not present in company" do
      let(:team_user) { create(:user) }

      before do
        @non_team_company_user = create(:employment, user: team_user)
        create(:employment, company:, user: admin_user)
        admin_user.add_role :admin, company
        sign_in admin_user
      end

      it "returns unsuccessful response with not_found status" do
        send_request :delete, internal_api_v1_team_path(@non_team_company_user.user)

        expect(response).to have_http_status(:not_found)
        expect(response).not_to be_successful
      end

      it "does not discard the employments" do
        send_request :delete, internal_api_v1_team_path(@non_team_company_user.user)

        expect(team_user.reload.employments.discarded.count).to eq(0)
      end
    end

    context "when team member is not discarded" do
      let(:invalid_user) { create(:user) }

      before do
        allow_any_instance_of(Employment).to receive(:discard!).and_raise(Discard::RecordNotDiscarded)

        create(:employment, company:, user: admin_user)
        @team_company_user = create(:employment, company:, user: invalid_user)
        admin_user.add_role :admin, company
        sign_in admin_user
      end

      it "returns unsuccessful response with internal_server_error status" do
        send_request :delete, internal_api_v1_team_path(invalid_user)

        expect(response).not_to be_successful
        expect(response).to have_http_status(:internal_server_error)
        expect(json_response["notice"]).to eq(I18n.t("errors.internal_server_error"))
      end

      it "does not discard the team member" do
        send_request :delete, internal_api_v1_team_path(invalid_user)

        expect(invalid_user.reload.employments.discarded.count).to eq(0)
      end
    end

    context "when team member is present in multiple company" do
      let(:team_user) { create(:user) }
      let(:other_company_1) { create(:company) }
      let(:other_company_2) { create(:company) }

      before do
        @team_company_user = create(:employment, company:, user: team_user)
        create(:employment, company: other_company_1, user: team_user)
        create(:employment, company: other_company_2, user: team_user)
        admin_user.add_role :admin, company
        sign_in admin_user
      end

      it "discard team member from only current company" do
        expect { send_request :delete, internal_api_v1_team_path(team_user) }
          .to change(team_user.employments.kept, :count).from(3).to(2)
          .and change(team_user.employments.discarded, :count).from(0).to(1)

        expect(@team_company_user.reload.discarded?).to be_truthy
      end
    end
  end

  context "when current user is an employee" do
    let(:employee_user) { create(:user, current_workspace_id: company.id) }
    let(:team_user) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: team_user)
      create(:employment, company:, user: employee_user)
      employee_user.add_role :employee, company
      sign_in employee_user
      send_request :delete, internal_api_v1_team_path(team_user)
    end

    it "returns forbidden response with error" do
      expect(response).not_to be_successful
      expect(response).to have_http_status :forbidden
      expect(json_response["errors"]).to eq(I18n.t("pundit.team_policy.destroy?"))
    end

    it "does not discard the team member" do
      expect(team_user.reload.employments.discarded.count).to eq(0)
    end
  end

  context "when current user is an book keeper" do
    let(:employee_user) { create(:user, current_workspace_id: company.id) }
    let(:team_user) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: team_user)
      create(:employment, company:, user: employee_user)
      employee_user.add_role :book_keeper, company
      sign_in employee_user
      send_request :delete, internal_api_v1_team_path(team_user)
    end

    it "returns forbidden response with error" do
      expect(response).not_to be_successful
      expect(response).to have_http_status :forbidden
      expect(json_response["errors"]).to eq(I18n.t("pundit.team_policy.destroy?"))
    end

    it "does not discard the team member" do
      expect(team_user.reload.employments.discarded.count).to eq(0)
    end
  end

  context "when user is not signed in" do
    let(:team_user) { create(:user, current_workspace_id: company.id) }

    it "returns unauthorized response with error" do
      send_request :delete, internal_api_v1_team_path(team_user)
      expect(response).not_to be_successful
      expect(response).to have_http_status :unauthorized
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
