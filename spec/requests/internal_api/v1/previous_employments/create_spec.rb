# frozen_string_literal: true

require "rails_helper"

RSpec.describe "PreviousEmployments#create", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:previous_employment_details) { attributes_for(:previous_employment) }

  context "when Owner wants to create Previous Employments details of employee of his company" do
    before do
      user.add_role :owner, company
      sign_in user
      send_request :post, internal_api_v1_user_previous_employments_path(
        user_id: user.id,
        previous_employment: previous_employment_details
      )
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
    end
  end

  context "when Admin wants to create Previous Employments details of employee of his company" do
    before do
      user.add_role :admin, company
      sign_in user
      send_request :post, internal_api_v1_user_previous_employments_path(
        user_id: user.id,
        previous_employment: previous_employment_details
      )
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
    end
  end

  context "when Employee wants to create his own Previous Employments details" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :post, internal_api_v1_user_previous_employments_path(
        user_id: user.id,
        previous_employment: previous_employment_details
      )
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
    end
  end
end
