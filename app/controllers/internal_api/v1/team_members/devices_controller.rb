# frozen_string_literal: true

class InternalApi::V1::TeamMembers::DevicesController < InternalApi::V1::ApplicationController
  def show
    authorize employment, policy_class: TeamMembers::DevicePolicy
    render :show, locals: { user: employment.user }, status: :ok
  end

  def update
    authorize employment, policy_class: TeamMembers::DevicePolicy
    user = employment.user
    device = user.devices
    device.update!(device_params)
    render json: {
      device:,
      notice: ("Device updated successfully.")
    }, status: :ok
  end

  private

    def employment
      @employment ||= Employment.find(params[:team_id])
    end

    def device_params
      params.require(:device).permit(
        :device_type, :name, :serial_number, specifications: {}
      )
    end
end
