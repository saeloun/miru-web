# frozen_string_literal: true

class InternalApi::V1::Devices::DeviceUsagesController < InternalApi::V1::DevicesController
  def demand
    authorize :demand, policy_class: DeviceUsagePolicy

    device_usage_exists = device.device_usages.where(approve: nil, created_by_id: current_user.id)

    if device_usage_exists.length > 0
      render json: {
        error: I18n.t("devices.device_usage.demand.failure.already_there")
      }, status: :unprocessable_entity
      return
    end

    device_usage = device.device_usages.new(created_by: current_user)

    if device_usage.save!
      render json: {
        notice: I18n.t("devices.device_usage.demand.success.message")
      }, status: :ok
    else
      render json: {
        error: device_usage.errors.full_messages.to_sentence,
        message: I18n.t("devices.device_usage.demand.failure.message")
      }, status: :unprocessable_entity
    end
  end

  def demand_cancel
    authorize :demand_cancel, policy_class: DeviceUsagePolicy
    device_usage = DeviceUsage.where(approve: nil, created_by_id: current_user.id, device_id: device.id)

    if device_usage.length <= 0
      render json: {
        success: false,
        notice: I18n.t("devices.device_usage.demand_cancel.failure.not_found")
      }, status: :not_found
      return
    end
    device_usages = DeviceUsage.destroy(device_usage.to_a.map(&:id))
    if device_usages
      render json: { notice: I18n.t("devices.device_usage.demand_cancel.success.message") }, status: :ok
    else
      render json: { error: device_usages.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def approve
    authorize :approve, policy_class: DeviceUsagePolicy

    last_usage_request = device.device_usages.last
    if last_usage_request.blank?
      render json: {
        success: false,
        notice: I18n.t("devices.device_usage.approve.failure.not_found")
      }, status: :not_found
      return
    end

    if last_usage_request.update(device_usage_params)
      last_usage_request.device.update!(assignee_id: last_usage_request.created_by_id, available: true)
      render json: {
        success: true,
        approved_device_usage: last_usage_request,
        device:,
        notice: I18n.t("devices.device_usage.update.success.message")
      }, status: :ok
    else
      render json: {
        success: false,
        approved_device_usage: last_usage_request,
        notice: I18n.t("devices.device_usage.update.failure.message")
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
