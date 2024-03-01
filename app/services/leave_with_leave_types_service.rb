# frozen_string_literal: true

class LeaveWithLeaveTypesService
  attr_reader :leave, :params

  def initialize(leave, params)
    @leave = leave
    @params = params
  end

  def process
    ActiveRecord::Base.transaction do
      add_leave_types
      updated_leave_types
      remove_leave_types
    end
  end

  private

    def add_leave_types
      return if params[:add_leave_types].blank?

      params[:add_leave_types].each do |leave_type|
        leave.leave_types.create!(leave_type)
      end
    end

    def updated_leave_types
      return if params[:updated_leave_types].blank?

      params[:updated_leave_types].each do |updated_leave_type|
        leave_type = leave.leave_types.find_by(id: updated_leave_type[:id])
        next unless leave_type

        leave_type.update!(updated_leave_type)
      end
    end

    def remove_leave_types
      return if params[:removed_leave_type_ids].blank?

      leave.leave_types.where(id: params[:removed_leave_type_ids]).discard_all
    end
end
