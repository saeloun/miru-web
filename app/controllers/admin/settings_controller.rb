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
      # Validate and sanitize inputs
      number_of_email = params[:number_of_email].to_i.clamp(1, 1000)
      interval_length = params[:interval_length].to_i.clamp(1, 1440) # Max 24 hours in minutes
      interval_unit = params[:interval_unit].to_sym
      # Validate interval_unit
      unless TIME_INTERVAL.include?(interval_unit)
        flash[:alert] = "Invalid interval unit. Must be one of: #{TIME_INTERVAL.join(', ')}"
        render :edit and return
      end

      Setting.number_of_email = number_of_email
      Setting.interval_length = interval_length
      Setting.interval_unit = interval_unit

      redirect_to edit_admin_setting_path, notice: "Settings updated successfully."
    rescue StandardError => e
      flash[:alert] = "Failed to update settings: #{e.message}"
      render :edit
    end
  end
end
