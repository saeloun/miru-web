# frozen_string_literal: true

require "rails_helper"

RSpec.describe Api::V1::HolidaysController, type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:year) { Date.current.year }

  before do
    user.add_role :admin, company
    sign_in user
  end

  describe "GET #index" do
    it "returns all holidays for the company" do
      holiday = create(:holiday, year:, company:)
      create(:holiday_info, holiday:, date: Date.new(year, 1, 1))

      get api_v1_holidays_path, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(json_response["holidays"]).to be_present
    end
  end

  describe "PUT #update" do
    context "with valid parameters" do
      let(:valid_params) do
        {
          year:,
          holiday: {
            holiday: {
              year:,
              enable_optional_holidays: true,
              no_of_allowed_optional_holidays: 7,
              holiday_types: ["national", "optional"]
            },
            add_holiday_infos: [
              { name: "New Year", date: "#{year}-01-01", category: "national" }
            ],
            update_holiday_infos: [],
            remove_holiday_infos: []
          }
        }
      end

      it "updates holidays successfully" do
        put api_v1_holiday_path(year), params: valid_params, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(json_response["notice"]).to eq("Holiday Info updated successfully")
      end

      it "creates new holiday info" do
        expect do
          put api_v1_holiday_path(year), params: valid_params, headers: auth_headers(user)
        end.to change(HolidayInfo, :count).by(1)
      end
    end

    context "with invalid parameters" do
      let(:invalid_params) do
        {
          year:,
          holiday: {
            holiday: {
              year:,
              enable_optional_holidays: true,
              no_of_allowed_optional_holidays: 7,
              holiday_types: ["national", "optional"]
            },
            add_holiday_infos: [
              { name: "Invalid@Name!", date: "#{year}-01-01", category: "national" }
            ],
            update_holiday_infos: [],
            remove_holiday_infos: []
          }
        }
      end

      it "returns unprocessable entity status" do
        put api_v1_holiday_path(year), params: invalid_params, headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "returns field-level errors" do
        put api_v1_holiday_path(year), params: invalid_params, headers: auth_headers(user)

        expect(json_response["field_errors"]).to be_present
        expect(json_response["field_errors"]["add_holiday_infos"]).to be_present
      end

      it "does not create invalid holiday info" do
        expect do
          put api_v1_holiday_path(year), params: invalid_params, headers: auth_headers(user)
        end.not_to change(HolidayInfo, :count)
      end
    end

    context "with special characters in holiday name" do
      let(:params_with_hyphen) do
        {
          year:,
          holiday: {
            holiday: {
              year:,
              enable_optional_holidays: true,
              no_of_allowed_optional_holidays: 7,
              holiday_types: ["national", "optional"]
            },
            add_holiday_infos: [
              { name: "Labor-Day", date: "#{year}-05-01", category: "national" }
            ],
            update_holiday_infos: [],
            remove_holiday_infos: []
          }
        }
      end

      let(:params_with_apostrophe) do
        {
          year:,
          holiday: {
            holiday: {
              year:,
              enable_optional_holidays: true,
              no_of_allowed_optional_holidays: 7,
              holiday_types: ["national", "optional"]
            },
            add_holiday_infos: [
              { name: "New Year's Day", date: "#{year}-01-01", category: "national" }
            ],
            update_holiday_infos: [],
            remove_holiday_infos: []
          }
        }
      end

      it "accepts hyphens in holiday names" do
        put api_v1_holiday_path(year), params: params_with_hyphen, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(HolidayInfo.last.name).to eq("Labor-Day")
      end

      it "accepts apostrophes in holiday names" do
        put api_v1_holiday_path(year), params: params_with_apostrophe, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(HolidayInfo.last.name).to eq("New Year's Day")
      end
    end

    context "when updating existing holiday info" do
      let!(:holiday) { create(:holiday, year:, company:) }
      let!(:holiday_info) { create(:holiday_info, holiday:, name: "Original Name", date: Date.new(year, 1, 1)) }

      let(:update_params) do
        {
          year:,
          holiday: {
            holiday: {
              enable_optional_holidays: true,
              no_of_allowed_optional_holidays: 7,
              holiday_types: ["national", "optional"]
            },
            add_holiday_infos: [],
            update_holiday_infos: [
              { id: holiday_info.id, name: "Updated Name", date: holiday_info.date.to_s, category: "national" }
            ],
            remove_holiday_infos: []
          }
        }
      end

      it "updates existing holiday info" do
        put api_v1_holiday_path(year), params: update_params, headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(holiday_info.reload.name).to eq("Updated Name")
      end

      context "with invalid update" do
        let(:invalid_update_params) do
          {
            year:,
            holiday: {
              holiday: {
                enable_optional_holidays: true,
                no_of_allowed_optional_holidays: 7,
                holiday_types: ["national", "optional"]
              },
              add_holiday_infos: [],
              update_holiday_infos: [
                { id: holiday_info.id, name: "Invalid@Name!", date: holiday_info.date.to_s, category: "national" }
              ],
              remove_holiday_infos: []
            }
          }
        end

        it "returns unprocessable entity status" do
          put api_v1_holiday_path(year), params: invalid_update_params, headers: auth_headers(user)

          expect(response).to have_http_status(:unprocessable_entity)
        end

        it "returns field-level errors for update" do
          put api_v1_holiday_path(year), params: invalid_update_params, headers: auth_headers(user)

          expect(json_response["field_errors"]["update_holiday_infos"]).to be_present
        end

        it "does not update holiday info" do
          original_name = holiday_info.name
          put api_v1_holiday_path(year), params: invalid_update_params, headers: auth_headers(user)

          expect(holiday_info.reload.name).to eq(original_name)
        end
      end
    end
  end
end
