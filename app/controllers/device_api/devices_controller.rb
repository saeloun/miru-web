# frozen_string_literal: true

class DeviceApi::DevicesController < DeviceApi::ApplicationController
  def create
    authorize Device
    render :create, locals: {
      device: Device.create!(device_params)
    }
  end

  def update
    authorize device

    if device.update!(device_params)
      render json: {
        success: true,
        device:,
        notice: I18n.t("device.update.success.message")
      }, status: :ok
    end
  end

  private

    def device
      @_device ||= Device.find(params[:id])
    end

    def device_params
      params.require(:device).permit(
        policy(Device).permitted_attributes
      )
    end
end
