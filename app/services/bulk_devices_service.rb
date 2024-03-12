# frozen_string_literal: true

class BulkDevicesService
  attr_reader :user, :device_params

  def initialize(device_params, user)
    @device_params = device_params
    @user = user
  end

  def process
    ActiveRecord::Base.transaction do
      add_new_devices
      update_devices
      remove_devices
    end
  end

  private

  def add_new_devices
    return if device_params[:add_devices].blank?

    device_params[:add_devices].each do |params|
      new_device = user.devices.new(params)
      new_device.issued_to = user
      new_device.issued_by = user.current_workspace
      new_device.save!
    end
  end

  def update_devices
    return if device_params[:update_devices].blank?

    device_params[:update_devices].each do |params|
      device = Device.find_by!(id: params[:id])
      device.update!(params.except(:id))
    end
  end


  def remove_devices
    return if device_params[:remove_devices].blank?
    user.devices.where(id: device_params[:remove_devices]).destroy_all
  end
end
