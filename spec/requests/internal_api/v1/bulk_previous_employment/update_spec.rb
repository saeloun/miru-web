# frozen_string_literal: true

require "rails_helper"
RSpec.describe "InternalApi::V1::BulkPreviousEmployments#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:employment) { create(:employment, company_id: company.id, user_id: user.id) }
  let(:added_employments) { [{ "company_name" => "ABC Company", "role" => "Software Engineer" }] }
  let(:updated_employments) { [{ "id" => 1, "company_name" => "Updated Company", "role" => "Updated Role" }] }
  let(:removed_employment_ids) { [2, 3] }
  let(:employments) do
    {
      added_employments:,
      updated_employments:,
      removed_employment_ids:
    }
  end

  before do
    user.add_role :admin, company
    user.roles
    sign_in user
  end

  describe "#update" do
    it "updates previous employments" do
      send_request :put, internal_api_v1_bulk_previous_employment_path(user), params: {
        id: user.id, employments:
      }, headers: auth_headers(user)
      expect(json_response["notice"]).to match("Employment updated successfully")
    end
  end
end
