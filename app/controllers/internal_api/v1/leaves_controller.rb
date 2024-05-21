# frozen_string_literal: true

class InternalApi::V1::LeavesController < InternalApi::V1::ApplicationController
  before_action :leave, only: [:update]

  def index
    authorize Leave
    leaves = current_company.leaves.includes([:leave_types, :custom_leaves])
    render :index, locals: {
      leaves:
    }
  end

  def create
    authorize Leave
    current_company.leaves.create!(leave_params)
    render json: { notice: "Leave created successfully" }, status: :ok
  end

  def update
    authorize leave
    leave.update!(leave_params)
    render json: { notice: "Leave updated successfully" }, status: :ok
  end

  private

    def leave_params
      params.require(:leave).permit(policy(:leave).permitted_attributes)
    end

    def leave
      @_leave ||= current_company.leaves.find(params[:id])
    end
end
