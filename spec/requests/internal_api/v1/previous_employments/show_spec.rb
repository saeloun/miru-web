# frozen_string_literal: true

# TODO - Show tests failing line 44 and 60

require "rails_helper"

RSpec.describe "PreviousEmployments#show", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:user2) { create(:user, current_workspace_id: company.id) }
  let(:previous_employment) { create(:previous_employment, user:) }
  let(:previous_employment2) { create(:previous_employment, user: user2) }

  context "when user is employed in the current workspace" do
    before do
      create(:employment, company:, user:)
      user.add_role(:admin, company)
      user.add_role(:owner, company)
      user.add_role(:employee, company)
      sign_in user
    end

    context "when user sends previous employment ID that exists" do
      before do
        send_request :get, internal_api_v1_previous_employments_path(previous_employment)
      end

      it "is successful" do
        expect(response).to have_http_status(:ok)
        expect(json_response["previous_employments"][0]["company_name"]
          ).to eq(previous_employment.company_name)
        expect(json_response["previous_employments"][0]["role"]
          ).to eq(previous_employment.role)
      end
    end

    #   context "when user sends previous employment ID that does not exist" do

    #     before do
    #       send_request :get, internal_api_v1_previous_employments_path(previous_employment2)
    #     end

    #     it "is not found" do
    #       debugger
    #       expect(response).to have_http_status(:not_found)
    #     end
    #   end
  end

  # context "when user is not employed in the current workspace" do

  #   before do
  #     user.add_role(:admin, company)
  #     user.add_role(:owner, company)
  #     user.add_role(:employee, company)
  #     sign_in user
  #     send_request :post, internal_api_v1_previous_employments_path(previous_employment)
  #   end

  #   it "is forbidden" do
  #     expect(response).to have_http_status(:forbidden)
  #   end
  # end
end
