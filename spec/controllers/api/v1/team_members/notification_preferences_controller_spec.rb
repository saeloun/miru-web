# frozen_string_literal: true

require "rails_helper"

RSpec.describe Api::V1::TeamMembers::NotificationPreferencesController, type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, current_workspace_id: company.id) }
  let(:another_user) { create(:user, current_workspace_id: company.id) }

  before do
    user.add_role(:admin, company)
    sign_in(user)
  end

  describe "GET /api/v1/team/:team_id/notification_preferences" do
    context "when notification preference exists" do
      let!(:notification_preference) do
        create(:notification_preference,
          user: another_user,
          company:,
          notification_enabled: true,
          invoice_email_notifications: false,
          payment_email_notifications: true,
          timesheet_reminder_enabled: false,
          unsubscribed_from_all: false
        )
      end

      it "returns the notification preferences" do
        get "/api/v1/team/#{another_user.id}/notification_preferences"

        expect(response).to have_http_status(:ok)
        expect(json_response["notification_enabled"]).to be true
        expect(json_response["invoice_email_notifications"]).to be false
        expect(json_response["payment_email_notifications"]).to be true
        expect(json_response["timesheet_reminder_enabled"]).to be false
        expect(json_response["unsubscribed_from_all"]).to be false
      end
    end

    context "when notification preference does not exist" do
      it "returns default values" do
        get "/api/v1/team/#{another_user.id}/notification_preferences"

        expect(response).to have_http_status(:ok)
        expect(json_response["notification_enabled"]).to be false
        expect(json_response["invoice_email_notifications"]).to be true
        expect(json_response["payment_email_notifications"]).to be true
        expect(json_response["timesheet_reminder_enabled"]).to be true
        expect(json_response["unsubscribed_from_all"]).to be false
      end
    end
  end

  describe "PATCH /api/v1/team/:team_id/notification_preferences" do
    context "when updating existing preference" do
      let!(:notification_preference) do
        create(:notification_preference,
          user: another_user,
          company:,
          notification_enabled: false
        )
      end

      it "updates the notification preference" do
        patch "/api/v1/team/#{another_user.id}/notification_preferences",
          params: { notification_preference: { notification_enabled: true } }

        expect(response).to have_http_status(:ok)
        expect(json_response["notification_enabled"]).to be true
        expect(json_response["notice"]).to eq("Preference updated successfully")

        notification_preference.reload
        expect(notification_preference.notification_enabled).to be true
      end

      it "updates multiple preferences at once" do
        patch "/api/v1/team/#{another_user.id}/notification_preferences",
          params: {
            notification_preference: {
              notification_enabled: true,
              invoice_email_notifications: false,
              payment_email_notifications: false,
              timesheet_reminder_enabled: true
            }
          }

        expect(response).to have_http_status(:ok)

        notification_preference.reload
        expect(notification_preference.notification_enabled).to be true
        expect(notification_preference.invoice_email_notifications).to be false
        expect(notification_preference.payment_email_notifications).to be false
        expect(notification_preference.timesheet_reminder_enabled).to be true
      end
    end

    context "when creating new preference" do
      it "creates a new notification preference" do
        expect {
          patch "/api/v1/team/#{another_user.id}/notification_preferences",
            params: { notification_preference: { notification_enabled: true } }
        }.to change(NotificationPreference, :count).by(1)

        expect(response).to have_http_status(:ok)
        expect(json_response["notification_enabled"]).to be true
      end
    end

    context "when unsubscribing from all" do
      let!(:notification_preference) do
        create(:notification_preference,
          user: another_user,
          company:,
          notification_enabled: true,
          invoice_email_notifications: true
        )
      end

      it "sets unsubscribed_from_all flag" do
        patch "/api/v1/team/#{another_user.id}/notification_preferences",
          params: { notification_preference: { unsubscribed_from_all: true } }

        expect(response).to have_http_status(:ok)

        notification_preference.reload
        expect(notification_preference.unsubscribed_from_all).to be true
      end

      it "can re-subscribe after unsubscribing from all" do
        notification_preference.update!(unsubscribed_from_all: true)

        patch "/api/v1/team/#{another_user.id}/notification_preferences",
          params: {
            notification_preference: {
              unsubscribed_from_all: false,
              notification_enabled: true
            }
          }

        expect(response).to have_http_status(:ok)

        notification_preference.reload
        expect(notification_preference.unsubscribed_from_all).to be false
        expect(notification_preference.notification_enabled).to be true
        expect(notification_preference.invoice_email_notifications).to be true
      end
    end
  end

  private

    def json_response
      JSON.parse(response.body)
    end
end
