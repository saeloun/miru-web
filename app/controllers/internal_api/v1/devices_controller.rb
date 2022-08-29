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
end
