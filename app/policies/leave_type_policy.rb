# frozen_string_literal: true

class LeaveTypePolicy < ApplicationPolicy
  def create?
    user_owner_role? || user_admin_role?
  end

  def update?
    user_owner_role? || user_admin_role?
  end

  def permitted_attributes
    [
      :name, :icon, :color, :allocation_value, :allocation_period,
      :allocation_frequency, :carry_forward_days
    ]
  end
end
