# frozen_string_literal: true

class ProjectPolicy < ApplicationPolicy
  attr_reader :error_message_key

  def index?
    user_owner_role? || user_admin_role? || user_employee_role?
  end

  def show?
    authorize_current_user
  end

  def create?
    user_owner_role? || user_admin_role?
  end

  def update?
    authorize_current_user
  end

  def destroy?
    authorize_current_user
  end

  def permitted_attributes
    [
      :name, :description, :billable, :client_id
    ]
  end

  def authorize_current_user
    unless user.current_workspace_id == record.client.company_id
      @error_message_key = :different_workspace
      return false
    end

    user_owner_role? || user_admin_role?
  end
end
