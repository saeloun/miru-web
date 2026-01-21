# frozen_string_literal: true

class TimeoffEntryPolicy < ApplicationPolicy
  def index?
    user_owner_role? || user_admin_role? || user_employee_role?
  end

  def create?
    user_owner_role? || user_admin_role? || user_employee_role?
  end

  def update?
    authorize_current_user
  end

  def destroy?
    authorize_current_user
  end

  def permitted_attributes
    [
      :duration, :note, :leave_date, :user_id, :leave_type_id, :holiday_info_id, :custom_leave_id
    ]
  end

  def authorize_current_user
    unless user.current_workspace_id == record.company.id
      @error_message_key = :different_workspace
      return false
    end

    user_owner_role? || user_admin_role? || user_employee_role?
  end
end
