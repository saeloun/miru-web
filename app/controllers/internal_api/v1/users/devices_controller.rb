# frozen_string_literal: true

class InternalApi::V1::Users::DevicesController < InternalApi::V1::ApplicationController
  before_action :set_user

  def index
    authorize @user, policy_class: Users::DevicePolicy
    devices = @user.devices
    render :index, locals: { devices: }, status: :ok
  end

  def show
    authorize device, policy_class: Users::DevicePolicy
    render :show, locals: { device: }, status: :ok
  end

  def create
    authorize @user, policy_class: Users::DevicePolicy
    BulkDevicesService.new(device_params, set_user).process
    render json: { notice: I18n.t("devices.update.success") }
  end

  private

    def set_user
      @user ||= User.find(params[:user_id])
    end

    def device
      @device ||= Device.find(params[:id])
    end

    def device_params
      shared_params = [:device_type, :name, :serial_number, :is_insured, :insurance_activation_date,
                       :insurance_expiry_date, specifications: [:processor, :ram, :graphics]]

      params.require(:device).permit(
        add_devices: shared_params,
        update_devices: [:id] + shared_params,
        remove_devices: []
      )
    end
end
