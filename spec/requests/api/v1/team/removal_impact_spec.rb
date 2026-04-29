# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Team#removal_impact", type: :request do
  let(:company) { create(:company) }
  let(:admin_user) { create(:user, current_workspace_id: company.id) }
  let(:team_user) { create(:user, current_workspace_id: company.id) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:, billable: true) }
  let!(:team_employment) { create(:employment, company:, user: team_user) }

  before do
    create(:employment, company:, user: admin_user)
    admin_user.add_role :admin, company
    team_user.add_role :employee, company
    create(:project_member, user: team_user, project:, hourly_rate: 20)
  end

  context "when current user is admin" do
    before do
      create(:timesheet_entry, user: team_user, project:, bill_status: :unbilled, duration: 120)
      billed_entry = create(:timesheet_entry, user: team_user, project:, bill_status: :non_billable, duration: 60)
      billed_entry.update_column(:bill_status, TimesheetEntry.bill_statuses[:billed])
      sign_in admin_user
    end

    it "returns removal impact summary for the selected member" do
      send_request :get, removal_impact_api_v1_team_path(team_user), headers: auth_headers(admin_user)

      expect(response).to have_http_status(:ok)
      impact = json_response["removalImpact"]

      expect(impact["projectAssignmentsCount"]).to eq(1)
      expect(impact["projectNames"]).to include(project.name)
      expect(impact["unbilledEntriesCount"]).to eq(1)
      expect(impact["unbilledMinutes"]).to eq(120.0)
      expect(impact["uninvoicedAmount"]).to eq(40.0)
      expect(impact["invoicedEntriesCount"]).to eq(1)
      expect(impact["hasRisk"]).to be(true)
    end
  end

  context "when current user is employee" do
    let(:employee_user) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: employee_user)
      employee_user.add_role :employee, company
      sign_in employee_user
      send_request :get, removal_impact_api_v1_team_path(team_user), headers: auth_headers(employee_user)
    end

    it "returns forbidden response with error" do
      expect(response).to have_http_status(:forbidden)
      expect(json_response["errors"]).to eq(I18n.t("pundit.team_policy.destroy?"))
    end
  end
end
