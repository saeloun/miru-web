# frozen_string_literal: true

class WorkspacePolicy < ApplicationPolicy
  def index?
    user_owner_role? || user_admin_role? || user_employee_role?
  end

  def update?
    user_owner_role? || user_admin_role? || user_employee_role?
  end
end
