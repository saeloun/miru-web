# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Team#index", type: :request do
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
      send_request :get, api_v1_team_index_path, headers: auth_headers(user)
      @team_data = json_response["combinedDetails"].select { |item| item["isTeamMember"] == true }
      @invitation_data = json_response["combinedDetails"].select { |item| item["isTeamMember"] == false }
    end

    it "returns http success" do
      expect(response).to have_http_status(:ok)
    end

    it "checks if profile picture is there with each team member" do
      first_member = json_response["combinedDetails"].first
      last_member = json_response["combinedDetails"].last

      expect(first_member["profilePicture"]).to eq(user.avatar_url) if first_member["isTeamMember"]
      expect(first_member["profilePicture"]).to include("/assets/avatar") unless first_member["isTeamMember"]
      expect(last_member["profilePicture"]).to eq(user.avatar_url) if last_member["isTeamMember"]
      expect(last_member["profilePicture"]).to include("/assets/avatar") unless last_member["isTeamMember"]
    end

    it "checks if correct team members data is returned" do
      actual_team_data = @team_data.map do |member|
                            member.slice("id", "name", "email", "role", "status", "is_team_member")
                          end
      actual_invited_user_data = @invitation_data.map do |member|
                                   member.slice("id", "name", "email", "role", "status", "is_team_member")
                                 end

      expected_team_data = [{
        "id" => user.id, "name" => user.full_name, "email" => user.email, "role" => "admin", "status" => true
      }]

      expected_invited_user_data = [{
        "id" => invitation.id, "name" => invitation.full_name, "email" => invitation.recipient_email, "role" => "employee", "status" => false
      }]

      expect(actual_team_data).to eq(expected_team_data)
      expect(actual_invited_user_data).to eq(expected_invited_user_data)
    end

    it "can search a user from the team" do
      send_request :get, api_v1_team_index_path(
        q: { first_name_or_last_name_or_email_cont: user.first_name }
      ), headers: auth_headers(user)
      employment = user.employments.find_by!(company_id: company.id)

      service_arr = [{
        "id" => user.id, "firstName" => user.first_name, "lastName" => user.last_name, "name" => "#{user.first_name} #{user.last_name}",
        "email" => user.email, "role" => "admin", "status" => true, "isTeamMember" => true, "employmentType" => employment.employment_type, "joinedAtDate" => employment.joined_at.strftime("%Y-%m-%d"),
        "profilePicture" => user.avatar_url
      }]

      expect(json_response["combinedDetails"]).to match_array(service_arr)
    end
  end

  context "when user is employee" do
    let(:user3) { create(:user, current_workspace_id: company.id) }

    before do
      create(:employment, company:, user: user3)
      user3.add_role :employee, company
      sign_in user3
      send_request :get, api_v1_team_index_path, headers: auth_headers(user3)
    end

    it "is not permitted to access Team#index page" do
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when unauthenticated" do
    it "is not permitted to view team members" do
      send_request :get, api_v1_team_index_path
      expect(response).to have_http_status(:unauthorized)
      expect(json_response["error"]).to eq(I18n.t("devise.failure.unauthenticated"))
    end
  end
end
