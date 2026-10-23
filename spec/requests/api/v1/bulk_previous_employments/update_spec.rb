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

    it "rolls history edits back on duplicate ID, then updates only the kept membership on retry" do
      current = target_user.employments.kept.find_by!(company:)
      historic = create(:employment, company:, user: target_user, employee_id: "reserved",
        discarded_at: Time.current, designation: "Historical")
      # Give history the lower primary key to catch an unscoped first-row lookup.
      current.update_columns(discarded_at: Time.current)
      historic.update_columns(discarded_at: nil)
      current, historic = historic, current
      payload = { employments: {
        current_employment: { employee_id: historic.employee_id, designation: "Updated" },
        added_employments: [{ company_name: "Past Company", role: "Developer" }]
      } }
      expect do
        patch api_v1_bulk_previous_employment_path(target_user), params: payload, headers: auth_headers(user)
      end.not_to change { target_user.previous_employments.count }
      expect(response).to have_http_status(422)
      expect(json_response["errors"]).to match(/already been taken/)
      payload[:employments][:current_employment][:employee_id] = "SI070"
      patch api_v1_bulk_previous_employment_path(target_user), params: payload, headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(current.reload.employee_id).to eq("SI070")
      expect(current.designation).to eq("Updated")
      expect(historic.reload.designation).to eq("SDE")
      expect(target_user.previous_employments.count).to eq(1)
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

    it "cannot update a coworker's employment details" do
      patch api_v1_bulk_previous_employment_path(target_user),
        params: {
          employments: {
            current_employment: { designation: "Hacked" },
            added_employments: [],
            updated_employments: [],
            removed_employment_ids: []
          }
        },
        headers: auth_headers(user)

      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when the target user belongs to another company" do
    let(:other_company) { create(:company) }
    let(:other_user) { create(:user, current_workspace_id: other_company.id) }

    before do
      create(:employment, company: other_company, user: other_user)
      user.add_role :admin, company
      sign_in user
    end

    it "does not allow updating a user outside the current company" do
      patch api_v1_bulk_previous_employment_path(other_user),
        params: {
          employments: {
            current_employment: { designation: "Hacked" },
            added_employments: [],
            updated_employments: [],
            removed_employment_ids: []
          }
        },
        headers: auth_headers(user)

      expect(response).to have_http_status(:not_found)
    end
  end

  context "when an employee tries to update another member" do
    before do
      user.add_role :employee, company
      sign_in user
    end

    it "is forbidden" do
      patch api_v1_bulk_previous_employment_path(target_user),
        params: {
          employments: {
            current_employment: {
              designation: "Hacked Title",
              employment_type: "full_time"
            },
            added_employments: [],
            updated_employments: [],
            removed_employment_ids: []
          }
        },
        headers: auth_headers(user)
      expect(response).to have_http_status(:forbidden)
    end
  end

  context "when the target user belongs to another company" do
    let(:other_company) { create(:company) }
    let(:other_user) { create(:user, current_workspace_id: other_company.id) }

    before do
      create(:employment, company: other_company, user: other_user)
      user.add_role :admin, company
      sign_in user
    end

    it "returns not found" do
      patch api_v1_bulk_previous_employment_path(other_user),
        params: {
          employments: {
            current_employment: {},
            added_employments: [],
            updated_employments: [],
            removed_employment_ids: []
          }
        },
        headers: auth_headers(user)
      expect(response).to have_http_status(:not_found)
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
