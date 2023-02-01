# frozen_string_literal: true

class WorkspacePolicy < ApplicationPolicy
  def index?
    logged_in_user?
  end

  def update?
    logged_in_user?
  end

  def logged_in_user?
    true
    # user_owner_role? || user_admin_role? || user_employee_role?
  end
end
