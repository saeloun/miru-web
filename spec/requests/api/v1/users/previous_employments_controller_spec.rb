# frozen_string_literal: true

require "rails_helper"

RSpec.describe Api::V1::Users::PreviousEmploymentsController, type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:other_user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, user:, company:)
    create(:employment, user: other_user, company:)
    user.add_role :admin, company
    sign_in user
  end

  describe "GET #index" do
    let!(:previous_employment1) do
      create(:previous_employment,
        user:,
        company_name: "Tech Corp",
        role: "Senior Developer"
      )
    end

    let!(:previous_employment2) do
      create(:previous_employment,
        user:,
        company_name: "StartUp Inc",
        role: "Lead Engineer"
      )
    end

    it "returns all previous employments for the user" do
      get api_v1_user_previous_employments_path(user_id: user.id)

      expect(response).to have_http_status(:success)

      json_response = JSON.parse(response.body)
      expect(json_response["previous_employments"].length).to eq(2)

      # Should be ordered by created_at desc
      first_employment = json_response["previous_employments"].first
      expect(first_employment["company_name"]).to eq("StartUp Inc")
      expect(first_employment["role"]).to eq("Lead Engineer")

      second_employment = json_response["previous_employments"].second
      expect(second_employment["company_name"]).to eq("Tech Corp")
      expect(second_employment["role"]).to eq("Senior Developer")
    end

    it "returns empty array when user has no previous employments" do
      get api_v1_user_previous_employments_path(user_id: other_user.id)

      expect(response).to have_http_status(:success)

      json_response = JSON.parse(response.body)
      expect(json_response["previous_employments"]).to eq([])
    end
  end

  describe "GET #show" do
    let!(:previous_employment) do
      create(:previous_employment,
        user:,
        company_name: "Tech Corp",
        role: "Senior Developer"
      )
    end

    context "when previous employment belongs to user" do
      it "returns the previous employment details" do
        get api_v1_user_previous_employment_path(user_id: user.id, id: previous_employment.id)

        expect(response).to have_http_status(:success)

        json_response = JSON.parse(response.body)
        expect(json_response["company_name"]).to eq("Tech Corp")
        expect(json_response["role"]).to eq("Senior Developer")
      end
    end

    context "when previous employment does not exist" do
      it "returns not found" do
        get api_v1_user_previous_employment_path(user_id: user.id, id: 999999)
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "POST #create" do
    context "with valid parameters" do
      let(:valid_params) do
        {
          previous_employment: {
            company_name: "New Company",
            role: "Software Engineer"
          }
        }
      end

      it "creates a new previous employment" do
        expect {
          post api_v1_user_previous_employments_path(user_id: user.id), params: valid_params
        }.to change { PreviousEmployment.count }.by(1)

        expect(response).to have_http_status(:created)

        json_response = JSON.parse(response.body)
        expect(json_response["company_name"]).to eq("New Company")
        expect(json_response["role"]).to eq("Software Engineer")
      end
    end

    context "with invalid parameters" do
      let(:invalid_params) do
        {
          previous_employment: {
            company_name: "",
            role: ""
          }
        }
      end

      it "returns unprocessable entity with errors" do
        post api_v1_user_previous_employments_path(user_id: user.id), params: invalid_params

        expect(response).to have_http_status(:unprocessable_entity)

        json_response = JSON.parse(response.body)
        expect(json_response).to have_key("errors")
      end
    end
  end

  describe "PATCH #update" do
    let!(:previous_employment) do
      create(:previous_employment,
        user:,
        company_name: "Old Company",
        role: "Junior Developer"
      )
    end

    context "with valid parameters" do
      let(:update_params) do
        {
          previous_employment: {
            company_name: "Updated Company",
            role: "Senior Developer"
          }
        }
      end

      it "updates the previous employment" do
        patch api_v1_user_previous_employment_path(user_id: user.id, id: previous_employment.id),
              params: update_params

        expect(response).to have_http_status(:success)

        json_response = JSON.parse(response.body)
        expect(json_response["company_name"]).to eq("Updated Company")
        expect(json_response["role"]).to eq("Senior Developer")
      end
    end

    context "with invalid parameters" do
      let(:invalid_params) do
        {
          previous_employment: {
            company_name: "",
            role: ""
          }
        }
      end

      it "returns unprocessable entity with errors" do
        patch api_v1_user_previous_employment_path(user_id: user.id, id: previous_employment.id),
              params: invalid_params

        expect(response).to have_http_status(:unprocessable_entity)

        json_response = JSON.parse(response.body)
        expect(json_response).to have_key("errors")
      end
    end
  end

  context "when user is not authenticated" do
    before { sign_out user }

    it "returns unauthorized for index" do
      get api_v1_user_previous_employments_path(user_id: user.id)
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns unauthorized for show" do
      previous_employment = create(:previous_employment, user:)
      get api_v1_user_previous_employment_path(user_id: user.id, id: previous_employment.id)
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns unauthorized for create" do
      post api_v1_user_previous_employments_path(user_id: user.id),
           params: { previous_employment: { company_name: "Test", role: "Test" } }
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
