# frozen_string_literal: true

require "rails_helper"

RSpec.describe "PreviousEmployments#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:previous_employment_details) { attributes_for(:previous_employment) }

  context "when user is employed in the current workspace" do
    before do
      create(:employment, company:, user:)
      user.add_role(:admin, company)
      user.add_role(:owner, company)
      user.add_role(:employee, company)
      sign_in user
      send_request :post, internal_api_v1_previous_employments_path(
        previous_employment: previous_employment_details
      )
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
      expect(json_response["company_name"]).to eq(previous_employment_details[:company_name])
      expect(json_response["role"]).to eq(previous_employment_details[:role])
    end
  end

  context "when user is not employed in the current workspace" do
    before do
      user.add_role(:admin, company)
      user.add_role(:owner, company)
      user.add_role(:employee, company)
      sign_in user
      send_request :post, internal_api_v1_previous_employments_path(
        previous_employment: previous_employment_details
      )
    end

    it "is forbidden" do
      expect(response).to have_http_status(:forbidden)
    end
  end
end
