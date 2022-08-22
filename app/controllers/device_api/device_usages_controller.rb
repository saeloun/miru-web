# frozen_string_literal: true

class DeviceApi::DeviceUsagesController < DeviceApi::ApplicationController
  def create
    authorize DeviceUsage
    render :create, locals: {
      device_usage: DeviceUsage.create!(device_usage_params)
    }
  end

  def update
    authorize device_usage

    if device_usage.update!(device_usage_params)
      render json: {
        success: true,
        device_usage:,
        notice: I18n.t("device_usage.update.success.message")
      }, status: :ok
    end
  end

  private

    def device_usage
      @_device_usage ||= DeviceUsage.find(params[:id])
    end

    def device_usage_params
      params.require(:device_usage).permit(
        policy(DeviceUsage).permitted_attributes
      )
    end
end
