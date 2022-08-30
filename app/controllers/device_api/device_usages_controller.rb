# frozen_string_literal: true

class DeviceApi::DeviceUsagesController < DeviceApi::ApplicationController
  # skip_after_action :verify_authorized

  def create
    authorize DeviceUsage

    render :create, locals: {
      device_usage: DeviceUsage.create!(device_usage_params)
    }
  end

  def approve
    authorize DeviceUsage

    last_usage_request = device.device_usages.last
    if last_usage_request.blank?
      render json: {
        success: false,
        notice: "Device Usage request not found"
      }, status: :not_found
      return
    end

    if last_usage_request.update(device_usage_params)
      last_usage_request.device.update!(assignee_id: last_usage_request.created_by_id, available: true)
      render json: {
        success: true,
        approved_device_usage: last_usage_request,
        device:,
        notice: I18n.t("device_usage.update.success.message")
      }, status: :ok
    else
      render json: {
        success: false,
        approved_device_usage: last_usage_request,
        notice: I18n.t("device_usage.update.failure.message")
      }, status: :unprocessable_entity
    end
  end

  private

    def device
      @_device ||= Device.find(params[:device_id])
    end

    def device_usage_params
      params.require(:device_usage).permit(
        policy(DeviceUsage).permitted_attributes
      )
    end
end
