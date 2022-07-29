# frozen_string_literal: true

require "rails_helper"

RSpec.describe "PreviousEmployments#index", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:employee) { create(:user, current_workspace_id: company.id) }
  let(:previous_employment) { create(:previous_employment, user:) }

  context "when Owner wants to see Previous Employments of employee of his company" do
    before do
      create(:employment, company:, user: employee)
      user.add_role :owner, company
      sign_in user
      send_request :get, internal_api_v1_user_previous_employments_path(employee)
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
    end
  end

  context "when Admin wants to see Previous Employments of employee of his company" do
    before do
      create(:employment, company:, user: employee)
      user.add_role :admin, company
      sign_in user
      send_request :get, internal_api_v1_user_previous_employments_path(employee)
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
    end
  end

  context "when logged in user wants to see his own Previous Employments details" do
    before do
      create(:employment, company:, user:)
      user.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_user_previous_employments_path(user)
    end

    it "is successful" do
      expect(response).to have_http_status(:ok)
    end
  end

  context "when logged in employee wants to see Previous Employments details of someone else in his company" do
    before do
      create(:employment, company:, user:)
      create(:employment, company:, user: employee)
      user.add_role :employee, company
      employee.add_role :employee, company
      sign_in user
      send_request :get, internal_api_v1_user_previous_employments_path(employee)
    end

    it "is successful" do
      expect(response).to have_http_status(:forbidden)
    end
  end
end
