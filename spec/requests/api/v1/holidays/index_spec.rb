# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Holidays", type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  describe "GET #index" do
    context "when user is an admin" do
      before do
        create(:employment, company:, user:)
        user.add_role :admin, company
        sign_in user
        create(:holiday, company:, year: 2024)
      end

      it "returns all holidays for the company" do
        send_request :get, api_v1_holidays_path, headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
      end
    end

    context "when user is an employee" do
      before do
        create(:employment, company:, user:)
        user.add_role :employee, company
        sign_in user
      end

      it "returns holidays" do
        send_request :get, api_v1_holidays_path, headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
      end
    end

    context "when unauthenticated" do
      it "returns unauthorized" do
        send_request :get, api_v1_holidays_path
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "PATCH #update" do
    let(:holiday) { create(:holiday, company:, year: 2024) }

    context "when user is an admin" do
      before do
        create(:employment, company:, user:)
        user.add_role :admin, company
        sign_in user
        holiday
      end

      it "updates holiday info" do
        send_request :put, api_v1_holiday_path(year: 2024),
          params: {
            holiday: {
              holiday: { year: 2024, enable_optional_holidays: true, no_of_allowed_optional_holidays: 2 },
              add_holiday_infos: [],
              update_holiday_infos: [],
              remove_holiday_infos: []
            }
          },
          headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        expect(json_response["notice"]).to eq("Holiday Info updated successfully")
      end
    end

    context "when user is an employee" do
      before do
        create(:employment, company:, user:)
        user.add_role :employee, company
        sign_in user
        holiday
      end

      it "is not permitted" do
        send_request :put, api_v1_holiday_path(year: 2024),
          params: {
            holiday: {
              holiday: { year: 2024 },
              add_holiday_infos: [],
              update_holiday_infos: [],
              remove_holiday_infos: []
            }
          },
          headers: auth_headers(user)
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "when unauthenticated" do
      it "returns unauthorized" do
        send_request :put, api_v1_holiday_path(year: 2024),
          params: {
            holiday: {
              holiday: { year: 2024 },
              add_holiday_infos: [],
              update_holiday_infos: [],
              remove_holiday_infos: []
            }
          }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
