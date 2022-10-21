# frozen_string_literal: true

class InternalApi::V1::DevicesController < InternalApi::V1::ApplicationController
  def index
    authorize :index, policy_class: DevicePolicy
    pagy, devices = pagy(
      current_company.devices.order(available: :desc, created_at: :desc)
      .ransack(params[:q]).result(distinct: true),
      items: 30
    )
    devices_demands = {}
    DeviceUsage.includes(:created_by).where(
      approve: nil,
      device_id: devices.to_a.map(&:id)
    ).each do |i|
      devices_demands[i.device_id] ||= []
      devices_demands[i.device_id].push(
        {
          created_by_id: i.created_by_id, user_name: i.created_by.full_name,
          created_at: i.created_at.to_s
        })
    end
    render :index, locals: { devices:, pagy:, devices_demands: }, status: :ok
  end

  def update
    authorize current_device
    if current_device.update(device_params)
      render json: {
        notice: I18n.t("device.update.success.message"),
        entry: current_device.formatted_entry
      }, status: :ok
    else
      render json: { error: current_device.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize current_device
    if current_device.destroy
      render json: { notice: I18n.t("device.delete.success.message") }
    else
      render json: { error: current_device.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def items
    authorize :items, policy_class: DevicePolicy
    render json: {
      device_type: Device::DEVICE_TYPE_OPTIONS,
      users: Device::USERS_OPTIONS
    }, status: :ok
  end

  private

    def current_device
      @_current_device ||= current_company.devices.find(params[:id])
    end

    def device_params
      params.require(:device_params).permit(
        :available,
        :base_os,
        :brand,
        :device_type,
        :manufacturer,
        :meta_details,
        :name,
        :serial_number,
        :specifications,
        :version,
        :assignee_id,
        :user_id,
        :version_id
      )
    end
end
