# frozen_string_literal: true

class Api::V1::TeamMembers::NotificationPreferencesController < Api::V1::ApplicationController
  def show
    pref = notification_preference || build_default_preference
    authorize pref, policy_class: TeamMembers::NotificationPreferencePolicy
    render json: {
      notification_enabled: preference_value(pref, :notification_enabled, false),
      invoice_email_notifications: invoice_email_notifications_enabled(pref),
      payment_email_notifications: preference_value(pref, :payment_email_notifications, true),
      timesheet_reminder_enabled: preference_value(pref, :timesheet_reminder_enabled, true),
      monthly_report_digest_enabled: monthly_report_digest_enabled(pref),
      unsubscribed_from_all: preference_value(pref, :unsubscribed_from_all, false)
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
      notification_enabled: preference_value(pref, :notification_enabled, false),
      invoice_email_notifications: invoice_email_notifications_enabled(pref),
      payment_email_notifications: preference_value(pref, :payment_email_notifications, true),
      timesheet_reminder_enabled: preference_value(pref, :timesheet_reminder_enabled, true),
      monthly_report_digest_enabled: monthly_report_digest_enabled(pref),
      unsubscribed_from_all: preference_value(pref, :unsubscribed_from_all, false),
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
        :invoice_email_notifications,
        :payment_email_notifications,
        :timesheet_reminder_enabled,
        :unsubscribed_from_all
      ].select { |attribute| NotificationPreference.attribute_names.include?(attribute.to_s) }

      if billing_notifications_permitted? &&
          NotificationPreference.attribute_names.include?("monthly_report_digest_enabled")
        permitted_attributes << :monthly_report_digest_enabled
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
        monthly_report_digest_enabled: false,
        unsubscribed_from_all: false
      }

      if NotificationPreference.attribute_names.include?("invoice_email_notifications")
        defaults[:invoice_email_notifications] = true
      end

      NotificationPreference.new(defaults)
    end

    def invoice_email_notifications_enabled(preference)
      preference_value(preference, :invoice_email_notifications, true)
    end

    def monthly_report_digest_enabled(preference)
      return false unless billing_notifications_permitted?

      preference_value(preference, :monthly_report_digest_enabled, false)
    end

    def billing_notifications_permitted?
      current_user.has_cached_role?(:owner, current_company) ||
        current_user.has_cached_role?(:admin, current_company) ||
        current_user.has_cached_role?(:book_keeper, current_company)
    end

    def preference_value(preference, attribute, fallback)
      return fallback unless preference.respond_to?(attribute)

      preference.public_send(attribute)
    end
end
