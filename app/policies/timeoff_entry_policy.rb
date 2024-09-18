# frozen_string_literal: true

class TimeoffEntryPolicy < ApplicationPolicy
  ALLOWED_ROLES = [:admin, :owner, :employee].freeze

  def index?
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace },
      { name: :employee, resource: user.current_workspace })
  end

  def create?
    user.has_any_role?(
      { name: :admin, resource: user.current_workspace },
      { name: :owner, resource: user.current_workspace },
      { name: :employee, resource: user.current_workspace })
  end

  def update?
    authorize_update_destroy
  end

  def destroy?
    authorize_update_destroy
  end

  def permitted_attributes
    [
      :duration, :note, :leave_date, :user_id, :leave_type_id, :holiday_info_id
    ]
  end

  private

    def authorize_update_destroy
      return false unless authorize_current_user

      if week_over?
        user.has_any_role?(
          { name: :admin, resource: user.current_workspace },
          { name: :owner, resource: user.current_workspace })
      else
        user.has_any_role?(
          { name: :admin, resource: user.current_workspace },
          { name: :owner, resource: user.current_workspace },
          { name: :employee, resource: user.current_workspace })
      end
    end

    def week_over?
      return false unless record.leave_date.present?

      leave_date_end_of_week = record.leave_date.end_of_week(:sunday)

      Time.current > leave_date_end_of_week
    end

    def authorize_current_user
      unless user.current_workspace_id == record.company.id
        @error_message_key = :different_workspace
        return false
      end

      user_owner_role? || user_admin_role? || user_employee_role?
    end
end
