# frozen_string_literal: true

class ProjectPolicy < ApplicationPolicy
  attr_reader :error_message_key

  def index?
    user_owner_role? || user_admin_role? || user_employee_role?
  end

  def show?
    user_owner_role? || user_admin_role?
  end

  def create?
    user_owner_role? || user_admin_role?
  end

  def update?
    user_owner_role? || user_admin_role?
  end

  def destroy?
    user_owner_role? || user_admin_role?
  end

  def index_all?
    user_owner_role? || user_admin_role?
  end

  def permitted_attributes
    [
      :name, :description, :billable, :client_id
    ]
  end
end
