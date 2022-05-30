# frozen_string_literal: true

require "rails_helper"

shared_examples_for "InternalApi::V1::Projects#index project list" do
  it "projects" do
    subject
    expect(response).to have_http_status(:ok)
    expect(json_response["projects"]).to eq(JSON.parse(projects.to_json))
  end
end

RSpec.describe "InternalApi::V1::Projects#index", type: :request do
  before do
    create(:role)
    create(:role, name: "employee")
    create(:company_user, company:, user: user_1)
    create(:company_user, company:, user: user_2)
    create(:project_member, user: user_1, project: project_1)
    create(:project_member, user: user_1, project: project_2)
    create(:project_member, user: user_2, project: project_1)
    create(:project_member, user: user_2, project: project_2)
    create_list(:timesheet_entry, 5, user: user_1, project: project_1)
    create_list(:timesheet_entry, 5, user: user_1, project: project_2)
    create_list(:timesheet_entry, 5, user: user_2, project: project_1)
    create_list(:timesheet_entry, 5, user: user_2, project: project_2)
  end

  subject { send_request :get, internal_api_v1_projects_path(params:) }

  let(:company) { create(:company) }
  let(:user_1) { create(:user, current_workspace_id: company.id, roles: [Role.find_by_name("admin")]) }
  let(:user_2) { create(:user, current_workspace_id: company.id, roles: [Role.find_by_name("employee")]) }
  let(:client_1) { create(:client, company:) }
  let(:client_2) { create(:client, company:) }
  let(:project_1) { create(:project, client: client_1) }
  let(:project_2) { create(:project, client: client_2) }
  let(:params) do
    {
      client_id: nil,
      user_id: nil,
      billable: nil,
      search: nil
    }
  end
  let(:projects) { user_1.current_workspace.project_list(*params.values) }

  context "when the user is an admin" do
    before { sign_in user_1 }

    context "when no filters are applied returns list of all" do
      it_behaves_like "InternalApi::V1::Projects#index project list"
    end

    context "when Search with project name returns projects with project_names matching search" do
      before { params[:search] = project_1.name }

      it_behaves_like "InternalApi::V1::Projects#index project list"
    end

    context "when Search with client name returns projects with client_name matching search" do
      before { params[:search] = client_1.name }

      it_behaves_like "InternalApi::V1::Projects#index project list"
    end

    context "when billable filter is applied returns projects which are non billable" do
      before { params[:billable] = false }

      it_behaves_like "InternalApi::V1::Projects#index project list"
    end

    context "when team member filter is applied returns projects which have user_1 as it's team member" do
      before { params[:user_id] = [user_1.id] }

      it_behaves_like "InternalApi::V1::Projects#index project list"
    end

    context "when client filter is applied returns projects which belongs to client_1" do
      before { params[:client_id] = [client_1.id] }

      it_behaves_like "InternalApi::V1::Projects#index project list"
    end

    context "when all filters and search both are applied returns projects as per filters and search" do
      let(:params) do
        {
          client_id: [client_2.id],
          user_id: [user_1.id],
          billable: false,
          search: project_2.name
        }
      end

      it_behaves_like "InternalApi::V1::Projects#index project list"
    end
  end

  context "when the user is an employee" do
    before { sign_in user_2 }

    context "when no filters are applied returns list of all projects" do
      it_behaves_like "InternalApi::V1::Projects#index project list"
    end

    context "when Search with project name returns projects with project_names matching search" do
      before { params[:search] = project_1.name }

      it_behaves_like "InternalApi::V1::Projects#index project list"
    end

    context "when Search with client name returns projects with client_name matching search" do
      before { params[:search] = client_1.name }

      it_behaves_like "InternalApi::V1::Projects#index project list"
    end

    context "when billable filter is applied returns projects which are non billable" do
      before { params[:billable] = false }

      it_behaves_like "InternalApi::V1::Projects#index project list"
    end

    context "when team member filter is applied returns projects which have user_2 as it's team member" do
      before { params[:user_id] = [user_2.id] }

      it_behaves_like "InternalApi::V1::Projects#index project list"
    end

    context "when client filter is applied returns projects which belongs to client_1" do
      before { params[:client_id] = [client_1.id] }

      it_behaves_like "InternalApi::V1::Projects#index project list"
    end

    context "when all filters and search both are applied returns projects as per filters and search" do
      let(:params) do
        {
          client_id: [client_2.id],
          user_id: [user_2.id],
          billable: false,
          search: project_2.name
        }
      end

      it_behaves_like "InternalApi::V1::Projects#index project list"
    end
  end

  context "when unauthenticated" do
    it "is not permitted to view project" do
      send_request :get, internal_api_v1_projects_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
