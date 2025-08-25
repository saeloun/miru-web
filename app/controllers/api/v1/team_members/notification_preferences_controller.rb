# frozen_string_literal: true

class Api::V1::TeamMembers::NotificationPreferencesController < Api::V1::ApplicationController
  def show
    authorize notification_preference, policy_class: TeamMembers::NotificationPreferencePolicy
    render json: { notification_enabled: notification_preference.notification_enabled }, status: 200
  end

  def update
    authorize notification_preference, policy_class: TeamMembers::NotificationPreferencePolicy

    notification_preference.update!(notification_preference_params)
    render json: {
      notification_enabled: notification_preference.notification_enabled,
      notice: "Preference updated successfully"
    }, status: 200
  end

  private

    def notification_preference
      @notification_preference ||= NotificationPreference.find_by(
        user_id: params[:team_id],
        company_id: current_company.id)
    end

    def notification_preference_params
      params.require(:notification_preference).permit(:notification_enabled)
    end
end
