# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Projects#show", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }
  let(:project_member) { create(:project_member, user:, project:, hourly_rate: 5000) }

  context "when user is an admin" do
    before do
      create(:employment, company:, user:)
      user.add_role :admin, company
      sign_in user
    end

    context "when time_frame is a week" do
      let(:time_frame) { "week" }

      it "returns the project id, name, billable, client, members, total_minutes_logged for the project in that week" do
        send_request :get, api_v1_project_path(project), headers: auth_headers(user)
        project_members_snippet = project.project_members_snippet(time_frame)
        project_details = {
          id: project.id,
          name: project.name,
          is_billable: project.billable,
          client: { name: project.client.name, id: project.client.id },
          members: project_members_snippet,
          overdue_and_outstanding_amounts: project.overdue_and_outstanding_amounts,
          total_minutes_logged: (
                              project_members_snippet.pluck(:minutes_logged)
                            ).sum.to_i
        }
        expect(response).to have_http_status(:ok)
        expect(json_response["project_details"]).to eq(JSON.parse(project_details.to_json))
      end
    end
  end

  context "when the user is an employee" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
    end

    it "is not permitted to view project details" do
      send_request :get, api_v1_project_path(project), headers: auth_headers(user)
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq I18n.t("pundit.project_policy.show?")
    end
  end

  context "when the user is an book keeper" do
    before do
      create(:employment, company:, user:)
      user.add_role :book_keeper, company
      sign_in user
      send_request :get, api_v1_project_path(project)
    end

    it "is not permitted to view project details" do
      send_request :get, api_v1_project_path(project), headers: auth_headers(user)
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq I18n.t("pundit.project_policy.show?")
    end
  end

  context "when unauthenticated" do
    it "is not permitted to view project details" do
      send_request :get, api_v1_project_path(project)
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
