# frozen_string_literal: true

class InternalApi::V1::Invoices::ActionTrailsController < InternalApi::V1::ApplicationController
  def show
    authorize :show, policy_class: Invoices::ActionTrailsPolicy

    action_trails_service = Invoices::ActionTrailsService.new(params[:id])
    action_trails_service.process
    action_trails = action_trails_service.trails
    payment_trails = action_trails_service.payment_trails

    render :show, locals: {
      trails: action_trails,
      payment_trails:
    }
  end
end
