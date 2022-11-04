# frozen_string_literal: true

class TeamPolicy < ApplicationPolicy
  def index?
    user_owner_role? || user_admin_role? || user_employee_role? # user_team_lead?
  end

  def edit?
    authorize_current_user
  end

  def update?
    authorize_current_user
  end

  def destroy?
    authorize_current_user
  end

  def permitted_attributes
    [:first_name, :last_name, :email, :department_id, :avatar, :team_lead]
  end

  def authorize_current_user
    unless user.current_workspace_id == record&.company_id
      @error_message_key = :different_workspace
      return false
    end

    user_owner_role? || user_admin_role?
  end
end
