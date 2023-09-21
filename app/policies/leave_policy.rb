# frozen_string_literal: true

class LeavePolicy < ApplicationPolicy
  def index?
    user_owner_role? || user_admin_role?
  end

  def create?
    user_owner_role? || user_admin_role?
  end

  def update?
    user_owner_role? || user_admin_role?
  end

  def permitted_attributes
    [
      :year
    ]
  end
end
