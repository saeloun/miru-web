# frozen_string_literal: true

class InternalApi::V1::DevicesController < InternalApi::V1::ApplicationController
  def show
    authorize device
    render :show, locals: { device: }, status: :ok
  end

  def update
    authorize device
    device.update!(device_params)
    render :update, locals: { device: }, status: :ok
  end

  def create
    authorize Device
    device = Device.create!(device_params.merge(user_id: current_user.id, company_id: current_company.id))
    render :create, locals: { device: }, status: :ok
  end

  private

    def device
      @device ||= Device.find(params[:id])
    end

    def device_params
      params.require(:device).permit(
        :device_type, :name, :serial_number, specifications: {}
      )
    end
end
