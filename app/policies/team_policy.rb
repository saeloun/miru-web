# frozen_string_literal: true

class TeamPolicy < ApplicationPolicy
  attr_reader :error_message_key

  def index?
    return true if user_owner_role? || user_admin_role? || user_employee_role?

    @error_message_key = :unauthorized_access
    false
  end

  def update?
    authorize_current_user
  end

  def destroy?
    authorize_current_user
  end

  def permitted_attributes
    [:first_name, :last_name, :email]
  end

  def authorize_current_user
    unless user.current_workspace_id == record.company_id
      @error_message_key = :different_workspace
      return false
    end

    user_owner_role? || user_admin_role?
  end
end
