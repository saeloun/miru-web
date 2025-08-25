# frozen_string_literal: true

class Api::V1::LeaveTypesController < Api::V1::ApplicationController
  before_action :leave, only: [:create, :update]
  before_action :leave_type, only: [:update]

  def create
    authorize LeaveType
    leave.leave_types.create!(leave_type_params)
    render json: { notice: "Added leave type successfully" }, status: 200
  end

  def update
    authorize leave_type
    leave_type.update!(leave_type_params)
    render json: { notice: "Updated leave type successfully" }, status: 200
  end

  private

    def leave_type_params
      params.require(:leave_type).permit(policy(LeaveType).permitted_attributes)
    end

    def leave
      @_leave ||= current_company.leaves.find(params[:id])
    end

    def leave_type
      @_leave_type ||= leave.leave_types.find(params[:id])
    end
end
