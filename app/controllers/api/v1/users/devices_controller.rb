# frozen_string_literal: true

class Api::V1::Users::DevicesController < Api::V1::ApplicationController
  before_action :set_user

  def index
    authorize @user, policy_class: Users::DevicePolicy
    devices = @user.devices
    return unless stale?(**devices_index_cache_options(devices))

    render :index, locals: { devices: }, status: 200
  end

  def create
    authorize @user, policy_class: Users::DevicePolicy
    device = @user.devices.new(device_params.merge(issued_to: @user, issued_by: @user.current_workspace))
    device.save!
    render :create, locals: { device: }, status: 200
  end

  def show
    authorize device, policy_class: Users::DevicePolicy
    return unless stale?(**device_cache_options(device))

    render :show, locals: { device: }, status: 200
  end

  def update
    authorize device, policy_class: Users::DevicePolicy
    device.update!(device_params)
    render :update, locals: { device: }, status: 200
  end

  def destroy
    authorize device, policy_class: Users::DevicePolicy
    device.destroy!
    head 204
  end

  private

    def set_user
      @user ||= current_company.users.find(params[:user_id])
    end

    def device
      @device ||= @user.devices.find(params[:id])
    end

    def device_params
      params.require(:device).permit(
        :device_type, :name, :serial_number, specifications: {}
      )
    end

    def devices_index_cache_options(devices)
      {
        etag: [current_company.cache_key_with_version, @user.cache_key_with_version, devices.cache_key_with_version],
        last_modified: [@user.updated_at, devices.maximum(:updated_at)].compact.max,
        public: false
      }
    end

    def device_cache_options(device)
      {
        etag: [current_company.cache_key_with_version, @user.cache_key_with_version, device.cache_key_with_version],
        last_modified: device.updated_at,
        public: false
      }
    end
end
