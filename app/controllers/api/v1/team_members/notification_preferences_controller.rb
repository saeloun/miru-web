# frozen_string_literal: true

class Api::V1::TeamMembers::NotificationPreferencesController < Api::V1::ApplicationController
  def show
    pref = notification_preference || build_default_preference
    authorize pref, policy_class: TeamMembers::NotificationPreferencePolicy
    render json: {
      notification_enabled: pref.notification_enabled,
      invoice_email_notifications: invoice_email_notifications_enabled(pref),
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
      invoice_email_notifications: invoice_email_notifications_enabled(pref),
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
      permitted_attributes = [
        :notification_enabled,
        :payment_email_notifications,
        :timesheet_reminder_enabled,
        :unsubscribed_from_all
      ]

      if NotificationPreference.attribute_names.include?("invoice_email_notifications")
        permitted_attributes << :invoice_email_notifications
      end

      params.require(:notification_preference).permit(*permitted_attributes)
    end

    def build_default_preference
      defaults = {
        user_id: params[:team_id],
        company_id: current_company.id,
        notification_enabled: false,
        payment_email_notifications: true,
        timesheet_reminder_enabled: true,
        unsubscribed_from_all: false
      }

      if NotificationPreference.attribute_names.include?("invoice_email_notifications")
        defaults[:invoice_email_notifications] = true
      end

      NotificationPreference.new(defaults)
    end

    def invoice_email_notifications_enabled(preference)
      return preference.invoice_email_notifications if preference.respond_to?(:invoice_email_notifications)

      true
    end
end
