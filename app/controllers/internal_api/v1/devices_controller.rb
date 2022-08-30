# frozen_string_literal: true

class InternalApi::V1::DevicesController < InternalApi::V1::ApplicationController
  def index
    authorize :index, policy_class: DevicePolicy
    pagy, devices = pagy(
      current_company.devices.order(created_at: :asc)
      .ransack(params[:q]).result(distinct: true),
      items: 30
    )
    render :index, locals: { devices:, pagy: }, status: :ok
  end

  def update
    authorize current_device
    actual_device_params = device_params
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
      params.require(:space_usage).permit(
        :space_code, :purpose_code,
        :start_duration, :end_duration, :work_date, :note, :restricted, team_members: []
      )
    end
end
