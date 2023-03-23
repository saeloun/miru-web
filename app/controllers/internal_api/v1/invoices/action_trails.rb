# frozen_string_literal: true

class InternalApi::V1::Invoices::ActionTrailsController < InternalApi::V1::ApplicationController
  def show
    authorize :show, policy_class: Invoices::ActionTrailsPolicy

    action_trails_service = Invoices::ActionTrailsService.new(params[:id])
    action_trails_service.process

    render :show, locals: {
      trails: action_trails_service.action_trails
    }
  end
end
