# frozen_string_literal: true

class InternalApi::V1::Users::DevicesController < InternalApi::V1::ApplicationController
  before_action :set_user

  def index
    authorize @user, policy_class: Users::DevicePolicy
    devices = @user.devices
    render :index, locals: { devices: }, status: :ok
  end

  def create
    authorize @user, policy_class: Users::DevicePolicy
    device = @user.devices.new(device_params.merge(issued_to: @user, issued_by: @user.current_workspace))
    device.save!
    render :create, locals: { device: }, status: :ok
  end

  def show
    authorize device, policy_class: Users::DevicePolicy
    render :show, locals: { device: }, status: :ok
  end

  def update
    authorize device, policy_class: Users::DevicePolicy
    device.update!(device_params)
    render :update, locals: { device: }, status: :ok
  end

  private

    def set_user
      @user ||= User.find(params[:user_id])
    end

    def device
      @device ||= Device.find(params[:id])
    end

    def device_params
      params.require(:device).permit(
        :device_type, :name, :serial_number, specifications: {}
      )
    end
end
