# frozen_string_literal: true

class Api::V1::LeaveWithLeaveTypesController < Api::V1::ApplicationController
  before_action :leave, only: [:update]

  def update
    authorize current_user, policy_class: LeaveWithLeaveTypesPolicy
    LeaveWithLeaveTypesService.new(leave, update_params).process
    render json: { notice: "Leaves updated successfully" }, status: 200
  end

  private

    def leave
      @_leave ||= current_company.leaves.find_or_create_by(year: params[:year])
    end

    def update_params
      params.require(:leave_with_leave_type).permit(
        add_leave_types: [:name, :color, :icon, :allocation_value,
                          :allocation_period, :allocation_frequency,
                          :carry_forward_days],
        updated_leave_types: [:id, :name, :color, :icon, :allocation_value,
                              :allocation_period, :allocation_frequency,
                              :carry_forward_days],
        removed_leave_type_ids: []
      )
    end
end
