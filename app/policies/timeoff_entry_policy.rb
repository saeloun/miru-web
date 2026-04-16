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

    return false if stale_entry_for_non_admin?
    return true if user_owner_role? || user_admin_role?
    return false unless user_employee_role?
    return false unless record.user_id == user.id
    return false if stale_entry_for_standard_user?

    true
  end

  private

    def stale_entry_for_standard_user?
      return false if record.leave_date.blank?

      record.leave_date < 7.days.ago.to_date
    end

    def stale_entry_for_non_admin?
      stale_entry_for_standard_user? && !user_admin_role?
    end
end
