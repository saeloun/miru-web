# frozen_string_literal: true

require "rails_helper"

RSpec.describe "InternalApi::V1::Team#index", type: :request do
  let!(:company) { create(:company) }
  let(:user) { create(:user, :with_avatar, current_workspace_id: company.id) }
  let!(:invitation) { create(:invitation, company_id: company.id, sender_id: user.id) }

  before do
    create(:employment, company:, user:)
    user.add_role :admin, company
  end

  context "when user is admin" do
    before do
      sign_in user
      send_request :get, internal_api_v1_team_index_path
    end

    it "returns http success" do
      expect(response).to have_http_status(:ok)
    end

    it "checks if profile picture is there with each team member" do
      expect(json_response["team"].first["profilePicture"]).to eq(JSON.parse(user.avatar.to_json))
      expect(json_response["invitation"].last["profilePicture"]).to include("/assets/avatar")
    end

    it "checks if correct team members data is returned" do
      actual_team_data = json_response["team"].map do |member|
                              member.slice("id", "name", "email", "role", "status")
                            end
      actual_invitated_user_data = json_response["invitation"].map do |member|
                            member.slice("id", "name", "email", "role", "status")
                          end

      expected_team_data =
        [{
          "id" => user.id, "name" => user.full_name, "email" => user.email, "role" => "admin", "status" => nil
        }]
      expected_invitated_user_data =
        [{
          "id" => invitation.id, "name" => invitation.full_name, "email" => invitation.recipient_email, "role" => "employee", "status" => I18n.t("team.invitation")
        }]

      expect(actual_team_data).to eq(expected_team_data)
      expect(actual_invitated_user_data).to eq(expected_invitated_user_data)
    end
  end

  context "when user is employee" do
    let(:user3) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: user3)
      user3.add_role :employee, company
      sign_in user3
      send_request :get, internal_api_v1_team_index_path
    end

    it "is permitted to access Team#index page" do
      expect(response).to have_http_status(:ok)
    end

    it "checks if correct team members data is returned" do
      actual_members_data = json_response["team"].map do |member|
                              member.slice("name", "email", "role", "status")
                            end
      actual_invitated_user_data = json_response["invitation"].map do |member|
                                      member.slice("name", "email", "role", "status")
                                    end

      expected_members_data = [{
        "name" => user.full_name, "email" => user.email, "role" => "admin", "status" => nil
      }, {
        "name" => user3.full_name, "email" => user3.email, "role" => "employee", "status" => nil
      }]

      exoected_invitated_user_data = [{
        "name" => invitation.full_name, "email" => invitation.recipient_email, "role" => "employee", "status" => nil
      }]
      expect(actual_members_data).to eq(expected_members_data)
      expect(actual_invitated_user_data).to eq(exoected_invitated_user_data)
    end
  end

  context "when unauthenticated" do
    it "is not permitted to view team members" do
      send_request :get, internal_api_v1_team_index_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq("You need to sign in or sign up before continuing.")
    end
  end
end
