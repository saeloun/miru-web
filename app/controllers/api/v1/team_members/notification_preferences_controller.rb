# frozen_string_literal: true

class Api::V1::TeamMembers::NotificationPreferencesController < Api::V1::ApplicationController
  def show
    pref = notification_preference || build_default_preference
    authorize pref, policy_class: TeamMembers::NotificationPreferencePolicy
    render json: {
      notification_enabled: pref.notification_enabled,
      invoice_email_notifications: pref.invoice_email_notifications,
      payment_email_notifications: pref.payment_email_notifications,
      timesheet_reminder_enabled: pref.timesheet_reminder_enabled,
      unsubscribed_from_all: pref.unsubscribed_from_all
    }, status: 200
  end

  def update
    pref = notification_preference || NotificationPreference.new(
      user_id: params[:team_id],
      company_id: current_company.id
    )
    authorize pref, policy_class: TeamMembers::NotificationPreferencePolicy

    pref.update!(notification_preference_params)
    render json: {
      notification_enabled: pref.notification_enabled,
      invoice_email_notifications: pref.invoice_email_notifications,
      payment_email_notifications: pref.payment_email_notifications,
      timesheet_reminder_enabled: pref.timesheet_reminder_enabled,
      unsubscribed_from_all: pref.unsubscribed_from_all,
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
      params.require(:notification_preference).permit(
        :notification_enabled,
        :invoice_email_notifications,
        :payment_email_notifications,
        :timesheet_reminder_enabled,
        :unsubscribed_from_all
      )
    end

    def build_default_preference
      NotificationPreference.new(
        user_id: params[:team_id],
        company_id: current_company.id,
        notification_enabled: false,
        invoice_email_notifications: true,
        payment_email_notifications: true,
        timesheet_reminder_enabled: true,
        unsubscribed_from_all: false
      )
    end
end
