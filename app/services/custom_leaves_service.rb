# frozen_string_literal: true

class CustomLeavesService
  attr_reader :leave, :params

  def initialize(leave, params)
    @leave = leave
    @params = params
  end

  def process
    ActiveRecord::Base.transaction do
      add_custom_leaves
      update_custom_leaves
      remove_custom_leaves
    end
  end

  private

    def add_custom_leaves
      return if params[:add_custom_leaves].blank?

      params[:add_custom_leaves].each do |custom_leave|
        leave.custom_leaves.create!(custom_leave)
      end
    end

    def update_custom_leaves
      return if params[:update_custom_leaves].blank?

      params[:update_custom_leaves].each do |update_custom_leave|
        custom_leave = leave.custom_leaves.find(update_custom_leave[:id])
        next unless custom_leave

        custom_leave.update!(update_custom_leave)
      end
    end

    def remove_custom_leaves
      return if params[:remove_custom_leaves].blank?

      leave.custom_leaves.where(id: params[:remove_custom_leaves]).destroy_all
    end
end
