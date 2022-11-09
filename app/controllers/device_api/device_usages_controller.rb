# frozen_string_literal: true

class DeviceApi::DeviceUsagesController < DeviceApi::ApplicationController
  def approve
    authorize :approve, policy_class: DeviceApi::DeviceUsageApiPolicy

    last_usage_request = device.device_usages.where(approve: nil).last
    if last_usage_request.blank?
      render json: {
        success: false,
        notice: "Device Usage request not found"
      }, status: :not_found
      return
    end

    if last_usage_request.update(device_usage_params)
      last_usage_request.device.update!(assignee_id: last_usage_request.created_by_id, available: false)
      device.device_usages.where(approve: nil).update_all(approve: false)
      Slack::DeviceUsageNotifyJob.perform_later("demand_approved", device.id)

      render :approve, locals: {
        device:,
        last_usage_request:
      }
    else
      render json: {
        success: false,
        approved_device_usage: last_usage_request,
        notice: I18n.t("device_usage.update.failure.message")
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
