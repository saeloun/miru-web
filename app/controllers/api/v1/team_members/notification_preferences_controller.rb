# frozen_string_literal: true

module Api
  module V1
    module TeamMembers
      class NotificationPreferencesController < Api::V1::BaseController
        before_action :load_user
        before_action :load_notification_preference

        def show
          authorize @user, :show?

          if @notification_preference
            render json: {
              notification_enabled: @notification_preference.notification_enabled,
              invoice_email_notifications: @notification_preference.invoice_email_notifications,
              payment_email_notifications: @notification_preference.payment_email_notifications,
              timesheet_reminder_enabled: @notification_preference.timesheet_reminder_enabled,
              unsubscribed_from_all: @notification_preference.unsubscribed_from_all
            }, status: 200
          else
            # Return default values when no preference exists
            render json: {
              notification_enabled: false,
              invoice_email_notifications: true,
              payment_email_notifications: true,
              timesheet_reminder_enabled: true,
              unsubscribed_from_all: false
            }, status: 200
          end
        end

        def update
          authorize @user, :update?
          @notification_preference ||= @user.notification_preferences.build(company: current_company)

          if @notification_preference.update(notification_params)
            render json: {
              notification_enabled: @notification_preference.notification_enabled,
              message: "Preferences updated successfully"
            }, status: 200
          else
            render json: { errors: @notification_preference.errors.full_messages }, status: :unprocessable_entity
          end
        end

        private

          def load_user
            @user = User.find(params[:team_id])
          end

          def load_notification_preference
            @notification_preference = @user.notification_preferences.find_by(company: current_company)
          end

          def notification_params
            params.permit(
              :notification_enabled,
              :invoice_email_notifications,
              :payment_email_notifications,
              :timesheet_reminder_enabled,
              :unsubscribed_from_all
            )
          end
      end
    end
  end
end
