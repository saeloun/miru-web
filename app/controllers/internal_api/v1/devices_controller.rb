# frozen_string_literal: true

class InternalApi::V1::DevicesController < InternalApi::V1::ApplicationController
  def index
    authorize :index, policy_class: DevicePolicy
    pagy, devices = pagy(
      current_company.devices.order(assignee_id: :asc, created_at: :asc)
      .ransack(params[:q]).result(distinct: true),
      items: 30
    )
    render :index, locals: { devices:, pagy: }, status: :ok
  end

  def update
    authorize current_device
    actual_device_params = device_params
    actual_device_params[:user_id] = current_user.id
    actual_device_params[:company_id] = current_company.id

    if current_device.update(actual_device_params)
      render json: {
        notice: I18n.t("devices.update.message"),
        entry: current_device.formatted_entry
      }, status: :ok
    else
      render json: { error: current_device.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize current_device
    if current_device.destroy
      render json: { notice: I18n.t("devices.destroy.message") }
    else
      # TBD
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
