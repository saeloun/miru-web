# frozen_string_literal: true

class InternalApi::V1::CustomLeavesController < InternalApi::V1::ApplicationController
  before_action :set_leave, only: [:update]

  def update
    authorize current_user, policy_class: LeaveWithLeaveTypesPolicy
    CustomLeavesService.new(leave, update_params).process
    render json: { notice: "Leaves updated successfully" }, status: :ok
  end

  private

    def set_leave
      @_leave ||= current_company.leaves.find_or_create_by(year: params[:year])
    end

    def update_params
      params.require(:custom_leaves).permit(
        add_custom_leaves: [:name, :color, :icon, :allocation_value,
                            :allocation_period, user_ids: [],
                          ],
        update_custom_leaves: [:id, :name, :color, :icon, :allocation_value,
                               :allocation_period, user_ids: [],
                              ],
        remove_custom_leaves: []
      )
    end
end
