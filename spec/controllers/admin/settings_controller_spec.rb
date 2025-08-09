# frozen_string_literal: true

require "rails_helper"

RSpec.describe Admin::SettingsController, type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }

  before do
    create(:employment, company:, user:)
    user.add_role(:admin, company)
    sign_in user
  end

  describe "#update" do
    context "with valid parameters" do
      it "updates settings successfully" do
        sign_in user
        patch admin_setting_path, params: {
          number_of_email: 10,
          interval_length: 15,
          interval_unit: "min"
        }

        expect(Setting.number_of_email).to eq(10)
        expect(Setting.interval_length).to eq(15)
        expect(Setting.interval_unit).to eq(:min)
        expect(response).to redirect_to(edit_admin_setting_path)
        follow_redirect!
        expect(response.body).to include("Settings updated successfully.")
      end
    end

    context "with invalid interval_unit" do
      it "renders edit with error message" do
        sign_in user
        patch admin_setting_path, params: {
          number_of_email: 10,
          interval_length: 15,
          interval_unit: "invalid"
        }

        expect(response).to have_http_status(:ok)
        expect(response.body).to include("Invalid interval unit")
      end
    end

    context "with out-of-range values" do
      it "clamps number_of_email to maximum 1000" do
        sign_in user
        patch admin_setting_path, params: {
          number_of_email: 5000,
          interval_length: 15,
          interval_unit: "min"
        }

        expect(Setting.number_of_email).to eq(1000)
      end

      it "clamps number_of_email to minimum 1" do
        sign_in user
        patch admin_setting_path, params: {
          number_of_email: -5,
          interval_length: 15,
          interval_unit: "min"
        }

        expect(Setting.number_of_email).to eq(1)
      end

      it "clamps interval_length to maximum 1440" do
        sign_in user
        patch admin_setting_path, params: {
          number_of_email: 10,
          interval_length: 2000,
          interval_unit: "min"
        }

        expect(Setting.interval_length).to eq(1440)
      end

      it "clamps interval_length to minimum 1" do
        sign_in user
        patch admin_setting_path, params: {
          number_of_email: 10,
          interval_length: 0,
          interval_unit: "min"
        }

        expect(Setting.interval_length).to eq(1)
      end
    end
  end
end
