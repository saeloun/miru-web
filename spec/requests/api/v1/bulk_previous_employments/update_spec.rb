# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::BulkPreviousEmployments#update", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:target_user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    create(:employment, company:, user: target_user)
  end

  context "when user is an admin" do
    before do
      user.add_role :admin, company
      sign_in user
    end

    it "updates employment details" do
      patch api_v1_bulk_previous_employment_path(target_user),
        params: {
          employments: {
            current_employment: {
              designation: "Senior Developer",
              employment_type: "full_time"
            },
            added_employments: [
              { company_name: "Acme Corp", role: "Developer" }
            ],
            updated_employments: [],
            removed_employment_ids: []
          }
        },
        headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
    end
  end

  context "when user is an employee updating own data" do
    before do
      user.add_role :employee, company
      sign_in user
    end

    it "can update own employment details" do
      patch api_v1_bulk_previous_employment_path(user),
        params: {
          employments: {
            current_employment: {},
            added_employments: [
              { company_name: "Previous Co", role: "Intern" }
            ],
            updated_employments: [],
            removed_employment_ids: []
          }
        },
        headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
    end
  end

  context "when unauthenticated" do
    it "returns unauthorized" do
      patch api_v1_bulk_previous_employment_path(target_user),
        params: {
          employments: {
            current_employment: {},
            added_employments: [],
            updated_employments: [],
            removed_employment_ids: []
          }
        }
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
