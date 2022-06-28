# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Team#update", type: :request do
  let(:company) { create(:company) }
  let(:admin_user) { create(:user, current_workspace_id: company.id) }
  let(:employee_user) { create(:user, current_workspace_id: company.id) }
  let(:employee_company_user) { create(:company_user, company: company, user: employee_user) }

  context "when user is admin" do
    before do
      create(:company_user, company: company, user: admin_user)
      admin_user.add_role :admin, company
      sign_in admin_user
    end

    it "returns success json response with team member" do
      send_request :put, internal_api_v1_team_path(employee_company_user.user), params: { role: "admin" }

      expect(response).to have_http_status(:ok)
      expect(response).to be_successful
      expect(json_response["notice"]).to eq(I18n.t("team.update.success.message"))
      expect(json_response["user"]["id"]).to eq(employee_user.id)
    end

    it "updates the company user" do
      expect { send_request :put, internal_api_v1_team_path(employee_company_user.user), params: { role: "admin" } }
        .to change { employee_company_user.user_role }.from("employee").to("admin")
    end

    context "when team member is present in multiple company" do
      let(:team_user) { create(:user) }
      let(:other_company_1) { create(:company) }

      before do
        @team_company_user = create(:company_user, company:, user: team_user)
        team_user.add_role :employee, company
        @other_team_company_user = create(:company_user, company: other_company_1, user: team_user)
        team_user.add_role :employee, other_company_1
      end

      it "update team member from only current company" do
        expect { send_request :put, internal_api_v1_team_path(@team_company_user.user), params: { role: "admin" } }
          .to change { @team_company_user, :user_role }.from("employee").to("admin")

          expect(@other_team_company_user, :user_role).to eq("employee")
      end
    end
  end

  context "when user is not admin" do
    before do
      create(:company_user, company: company, user: employee_user)
      sign_in employee_user
    end

    it "returns unsuccessful response with forbidden status" do
      send_request :put, internal_api_v1_team_path(employee_company_user.user), params: { role: "admin" }

      expect(response).to have_http_status(:forbidden)
      expect(response).not_to be_successful
    end

    it "does not update the company user" do
      expect { send_request :put, internal_api_v1_team_path(employee_company_user.user), params: { role: "admin" } }
        .not_to change { employee_company_user, :user_role }.from("employee")
    end
  end
end
