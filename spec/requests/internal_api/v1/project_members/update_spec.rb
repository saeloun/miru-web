# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::CompanyUsers#index", type: :request do
  let(:company) { create(:company) }
  let(:user1) { create(:user, current_workspace_id: company.id) }
  let(:user2) { create(:user) }
  let(:user3) { create(:user) }
  let(:client) { create(:client, company:) }
  let(:project) { create(:project, client:) }

  before do
    create(:company_user, company_id: company.id, user_id: user1.id)
    create(:company_user, company_id: company.id, user_id: user2.id)
    create(:company_user, company_id: company.id, user_id: user3.id)
  end

  context "when user is admin" do
    before do
      user1.add_role :admin, company
      sign_in user1
    end

    context "when adding new team members to the project" do
      it "creates project_members associated with the project and the added user" do
        params = {
          members: {
            added_members: [{ id: user1.id, hourlyRate: 10 },
                            { id: user2.id, hourlyRate: 20 }]
          }
        }
        send_request(:put, internal_api_v1_project_member_path(project.id), params:)
        expect(response).to have_http_status(:ok)
        db_added_users = ProjectMember
          .where(project_id: project.id)
          .map { |project_member| project_member.slice(:user_id, :hourly_rate) }
        expected_added_users = [ { user_id: user1.id, hourly_rate: 10 },
                                 { user_id: user2.id, hourly_rate: 20 } ]
        expect(db_added_users).to match_array(expected_added_users)
      end
    end

    context "when updating hourly rate of a existing project member" do
      before do
        create(:project_member, project_id: project.id, user_id: user1.id, hourly_rate: 10)
        create(:project_member, project_id: project.id, user_id: user2.id, hourly_rate: 20)
      end

      it "updates the hourly rate of the project member" do
        edit_member_params = { members: { updated_members: [{ id: user1.id, hourlyRate: 100 }] } }
        send_request(:put, internal_api_v1_project_member_path(project.id), params: edit_member_params)

        expect(response).to have_http_status(:ok)

        db_users = ProjectMember
          .where(project_id: project.id)
          .map { |project_member| project_member.slice(:user_id, :hourly_rate) }
        expected_users = [{ user_id: user1.id, hourly_rate: 100 },
                          { user_id: user2.id, hourly_rate: 20 } ]
        expect(db_users).to match_array(expected_users)
      end
    end

    context "when removing the existing member from the project" do
      before do
        create(:project_member, project_id: project.id, user_id: user1.id, hourly_rate: 10)
        create(:project_member, project_id: project.id, user_id: user2.id, hourly_rate: 20)
      end

      it "destroys the respective project_members" do
        remove_member_params = { members: { removed_member_ids: [user1.id] } }
        send_request(:put, internal_api_v1_project_member_path(project.id), params: remove_member_params)

        expect(response).to have_http_status(:ok)

        db_users = ProjectMember
          .where(project_id: project.id)
          .map { |project_member| project_member.slice(:user_id, :hourly_rate) }
        expected_users = [{ user_id: user2.id, hourly_rate: 20 }]
        expect(db_users).to match_array(expected_users)
      end
    end

    context "when adding, updating and removing members from the project" do
      before do
        create(:project_member, project_id: project.id, user_id: user1.id, hourly_rate: 10)
        create(:project_member, project_id: project.id, user_id: user2.id, hourly_rate: 20)
      end

      it "creates, updates and destroyes the respective project_members associated wih the project" do
        update_member_params = {
          members: {
            added_members: [{ id: user3.id, hourlyRate: 30 }],
            updated_members: [{ id: user2.id, hourlyRate: 100 }],
            removed_member_ids: [user1.id]
          }
        }
        send_request(:put, internal_api_v1_project_member_path(project.id), params: update_member_params)

        expect(response).to have_http_status(:ok)

        db_users = ProjectMember
          .where(project_id: project.id)
          .map { |project_member| project_member.slice(:user_id, :hourly_rate) }
        expected_users = [{ user_id: user2.id, hourly_rate: 100 },
                          { user_id: user3.id, hourly_rate: 30 }]
        expect(db_users).to match_array(expected_users)
      end
    end
  end

  context "when user is employee" do
    before do
      user1.add_role :employee, company
      sign_in user1
    end

    context "when adding, updating and removing members from the project" do
      before do
        create(:project_member, project_id: project.id, user_id: user1.id, hourly_rate: 10)
        create(:project_member, project_id: project.id, user_id: user2.id, hourly_rate: 20)
      end

      it "action is not allowed" do
        params = {
          members: {
            added_members: [{ id: user3.id, hourlyRate: 30 }],
            updated_members: [{ id: user2.id, hourlyRate: 100 }],
            removed_member_ids: [user1.id]
          }
        }
        send_request(:put, internal_api_v1_project_member_path(project.id), params:)

        expect(response).to have_http_status(:forbidden)
        expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
      end
    end
  end

  context "when user is book keeper" do
    before do
      user1.add_role :book_keeper, company
      sign_in user1
    end

    context "when adding, updating and removing members from the project" do
      before do
        create(:project_member, project_id: project.id, user_id: user1.id, hourly_rate: 10)
        create(:project_member, project_id: project.id, user_id: user2.id, hourly_rate: 20)
      end

      it "action is not allowed" do
        params = {
          members: {
            added_members: [{ id: user3.id, hourlyRate: 30 }],
            updated_members: [{ id: user2.id, hourlyRate: 100 }],
            removed_member_ids: [user1.id]
          }
        }
        send_request(:put, internal_api_v1_project_member_path(project.id), params:)

        expect(response).to have_http_status(:forbidden)
        expect(json_response["errors"]).to eq("You are not authorized to perform this action.")
      end
    end
  end
end
