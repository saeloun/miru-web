# frozen_string_literal: true

class LeaveTypePolicy < ApplicationPolicy
  def create?
    has_owner_or_admin_role?
  end

  def update?
    authorize_current_user
  end

  def permitted_attributes
    [
      :name, :icon, :color, :allocation_value, :allocation_period,
      :allocation_frequency, :carry_forward_days
    ]
  end

  def authorize_current_user
    unless user.current_workspace_id == record.leave.company_id
      @error_message_key = :different_workspace
      return false
    end

    has_owner_or_admin_role?
  end
end
