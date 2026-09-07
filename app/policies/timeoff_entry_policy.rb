# frozen_string_literal: true

class TimeoffEntryPolicy < ApplicationPolicy
  def index?
    user_owner_role? || user_admin_role? || user_employee_role?
  end

  def create?
    return true if user_owner_role? || user_admin_role?
    return false unless user_employee_role?

    record.user_id == user.id
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
    company_id = record.company&.id
    return false if record.persisted? && company_id.nil?

    if company_id && user.current_workspace_id != company_id
      @error_message_key = :different_workspace
      return false
    end

    return true if user_owner_role? || user_admin_role?
    return false unless user_employee_role?
    return false unless record.user_id == user.id
    return false if entry_week_ended?

    true
  end

  private

    def entry_week_ended?
      return false if record.leave_date.blank?

      record.leave_date.end_of_week < record.company.resolved_time_zone.today
    end
end
