# frozen_string_literal: true

module Admin
  class SettingsController < Admin::ApplicationController
    TIME_INTERVAL = Setting::TIME_INTERVAL

    def edit
      @number_of_email = Setting.number_of_email || 5
      @interval_length = Setting.interval_length || 5
      @interval_unit = Setting.interval_unit || TIME_INTERVAL.first
    end

    def update
      Setting.number_of_email = params[:number_of_email].to_i
      Setting.interval_length = params[:interval_length].to_i
      Setting.interval_unit = params[:interval_unit].to_sym

      if Setting.number_of_email && Setting.interval_length && Setting.interval_unit
        redirect_to edit_admin_setting_path, notice: "Settings updated successfully."
      else
        flash[:alert] = "Failed to update settings."
        render :edit
      end
    end
  end
end
