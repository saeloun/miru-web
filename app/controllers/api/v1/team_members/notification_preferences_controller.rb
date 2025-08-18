# frozen_string_literal: true

module Api
  module V1
    module TeamMembers
      class NotificationPreferencesController < Api::V1::BaseController
        skip_after_action :verify_authorized

        before_action :load_user
        before_action :load_notification_preference

        def show
          render json: {
            notification_enabled: @notification_preference&.notification_enabled || false,
            daily_summary: false,
            timesheet_reminder: true,
            team_updates: false,
            invoice_updates: true,
            desktop_notifications: false
          }, status: 200
        end

        def update
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
            params.permit(:notification_enabled)
          end
      end
    end
  end
end
