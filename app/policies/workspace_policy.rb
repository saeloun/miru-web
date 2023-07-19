# frozen_string_literal: true

class WorkspacePolicy < ApplicationPolicy
  def index?
    logged_in_user?
  end

  def update?
    logged_in_user?
  end

  def logged_in_user?
    user_owner_role? || user_admin_role? || user_employee_role? || user_book_keeper_role? || user_client_role?
  end
end
