# frozen_string_literal: true

class Api::V1::CustomLeavesController < Api::V1::ApplicationController
  before_action :set_leave, only: [:update]

  def update
    authorize current_user, policy_class: LeaveWithLeaveTypesPolicy
    CustomLeavesService.new(@leave, update_params).process
    render json: { notice: "Custom Leaves updated successfully" }, status: 200
  end

  private

    def set_leave
      @leave ||= current_company.leaves.find_or_create_by(year: params[:year])
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
